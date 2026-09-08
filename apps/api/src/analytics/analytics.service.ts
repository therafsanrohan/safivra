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
      .from('journal_entries')
      .select(`
        id,
        amount,
        type,
        currency,
        journal_transactions (
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
      .filter((entry: any) => entry.journal_transactions && entry.journal_transactions.status === 'posted')
      .map((entry: any) => ({
        id: entry.id,
        date: entry.journal_transactions.date,
        amount: entry.amount.toString(),
        currency: entry.currency,
        type: entry.type === 'debit' ? 'expense' : 'income', // Simplification for bridging flat to double-entry
        status: entry.journal_transactions.status,
        category_id: entry.journal_transactions.category_id,
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
        throw new InternalServerErrorException('Analytics service failed');
      }

      return await response.json();
    } catch (error) {
      this.logger.error('Error communicating with Python service', error);
      throw new InternalServerErrorException('Analytics service unavailable');
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
}
