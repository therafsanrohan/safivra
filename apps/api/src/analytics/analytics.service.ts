import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly pythonServiceUrl = process.env.PYTHON_ANALYTICS_URL || 'https://analyticsservice-beige.vercel.app';
  private readonly internalApiKey = process.env.INTERNAL_API_KEY || 'dev-secret-key';

  constructor(private readonly supabaseService: SupabaseService) {}

  async getFinancialInsights(userId: string) {
    const supabase = this.supabaseService.getClient();

    // 1. Fetch user's financial accounts
    const { data: accounts, error: accError } = await supabase
      .from('financial_accounts')
      .select('id')
      .eq('user_id', userId);

    if (accError) {
      this.logger.error('Failed to fetch accounts', accError);
      throw new InternalServerErrorException('Failed to retrieve financial data');
    }

    if (!accounts || accounts.length === 0) {
      return this.emptyInsights(userId);
    }

    const accountIds = accounts.map(a => a.id);

    // 2. Fetch all posted transactions for the snapshot (in reality, bound this by a reasonable date range)
    const { data: ledger, error: txError } = await supabase
      .from('ledger_entries')
      .select(`
        id,
        amount,
        type,
        currency,
        ledger_transactions (
          id,
          date,
          status,
          category_id
        )
      `)
      .in('account_id', accountIds);

    if (txError) {
      this.logger.error('Failed to fetch ledger', txError);
      throw new InternalServerErrorException('Failed to retrieve ledger data');
    }

    // 3. Map to Python Snapshot Contract
    const transactions = ledger
      .filter((entry: any) => entry.ledger_transactions && entry.ledger_transactions.status === 'posted')
      .map((entry: any) => ({
        id: entry.id,
        date: entry.ledger_transactions.date,
        amount: entry.amount.toString(),
        currency: entry.currency,
        type: entry.type === 'debit' ? 'expense' : 'income', // Simplification for bridging flat to double-entry
        status: entry.ledger_transactions.status,
        category_id: entry.ledger_transactions.category_id,
        account_id: entry.account_id,
        is_refunded: false 
      }));

    const snapshot = {
      owner_id: userId,
      snapshot_id: `snap-${Date.now()}`,
      as_of: new Date().toISOString(),
      timezone: 'UTC', // Defaulting for now
      transactions: transactions,
      base_currency: 'BDT' // Defaulting for now
    };

    // 4. Proxy to Python Service
    try {
      const response = await fetch(`${this.pythonServiceUrl}/v1/insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-API-Key': this.internalApiKey
        },
        body: JSON.stringify(snapshot)
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Python service error: ${response.status} - ${errorText}`);
        return this.fallbackInsights(userId);
      }

      return await response.json();
    } catch (error) {
      this.logger.error('Error communicating with Python service', error);
      return this.fallbackInsights(userId);
    }
  }

  private emptyInsights(userId: string) {
    return {
      snapshot_id: `snap-empty-${Date.now()}`,
      as_of: new Date().toISOString(),
      spending_comparison: null,
      budget_positions: [],
      seven_day_baseline: null,
      limitations: ["No active accounts found."]
    };
  }

  private fallbackInsights(userId: string) {
    return {
      snapshot_id: `snap-fallback-${Date.now()}`,
      as_of: new Date().toISOString(),
      spending_comparison: null,
      budget_positions: [],
      seven_day_baseline: null,
      limitations: ["Advanced financial insights are temporarily unavailable. The analytics engine is offline, but your core balances and transactions remain unaffected."]
    };
  }

  async calculateScenario(userId: string, body: Record<string, unknown>) {
    // Enforce owner scope: override any owner_id in the request body with the
    // authenticated user's id. The Python service receives only what we send.
    const ownedPayload = {
      ...body,
      owner_id: userId,
      snapshot_revision: `snap-${userId.slice(0, 8)}-${Date.now()}`,
    };

    try {
      const response = await fetch(`${this.pythonServiceUrl}/v1/scenario/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-API-Key': this.internalApiKey,
        },
        body: JSON.stringify(ownedPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Python scenario service error: ${response.status} - ${errorText}`);
        // Return a graceful degradation instead of throwing — core app stays usable
        return {
          owner_id: userId,
          currency: body['currency'] || 'BDT',
          planning_days: body['planning_days'] || 7,
          options: [],
          limitations: ['Financial guidance is temporarily unavailable. Your balances and transactions are not affected.'],
          service_available: false,
        };
      }

      const result = await response.json();
      // Verify the Python service returned the correct owner scope
      if (result.owner_id && result.owner_id !== userId) {
        this.logger.error(`Scenario owner_id mismatch: expected ${userId}, got ${result.owner_id}`);
        throw new Error('Owner scope violation in scenario response');
      }

      return { ...result, service_available: true };
    } catch (error) {
      this.logger.error('Error communicating with Python scenario service', error);
      return {
        owner_id: userId,
        currency: body['currency'] || 'BDT',
        planning_days: body['planning_days'] || 7,
        options: [],
        limitations: ['Financial guidance is temporarily unavailable. Your balances and transactions are not affected.'],
        service_available: false,
      };
    }
  }
}
