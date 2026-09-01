import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface LedgerEntryDto {
  account_id: string;
  amount: number;
  type: 'debit' | 'credit';
  currency: string;
}

export interface PostTransactionDto {
  date: string;
  description: string;
  reference?: string;
  category_id?: string;
  idempotency_key: string;
  entries: LedgerEntryDto[];
}

@Injectable()
export class LedgerService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async postTransaction(userId: string, data: PostTransactionDto) {
    // 1. Enforce debit equals credit
    const totalDebit = data.entries
      .filter((e) => e.type === 'debit')
      .reduce((sum, e) => sum + e.amount, 0);
    const totalCredit = data.entries
      .filter((e) => e.type === 'credit')
      .reduce((sum, e) => sum + e.amount, 0);

    if (totalDebit !== totalCredit) {
      throw new BadRequestException('Total debit must equal total credit');
    }

    // 2. Consistent currency check
    const currencies = new Set(data.entries.map((e) => e.currency));
    if (currencies.size > 1) {
      throw new BadRequestException('All entries must have the same currency');
    }
    const currency = currencies.values().next().value;

    const supabase = this.supabaseService.getClient();

    // 3. Verify account ownership
    const accountIds = data.entries.map((e) => e.account_id);
    const { data: accounts, error: accountsError } = await supabase
      .from('financial_accounts')
      .select('id, user_id, status')
      .in('id', accountIds);

    if (accountsError) {
      throw new InternalServerErrorException('Failed to verify accounts');
    }

    if (accounts.length !== new Set(accountIds).size) {
      throw new BadRequestException('One or more accounts do not exist or you lack permission');
    }

    for (const account of accounts) {
      if (account.user_id !== userId) {
        throw new BadRequestException(`Account ${account.id} does not belong to you`);
      }
      if (account.status !== 'active') {
        throw new BadRequestException(`Account ${account.id} is not active`);
      }
    }

    // 4. Duplicate-operation protection & Atomic insertion via RPC
    const { data: result, error: rpcError } = await supabase.rpc('post_journal_transaction', {
      p_user_id: userId,
      p_idempotency_key: data.idempotency_key,
      p_date: data.date,
      p_description: data.description,
      p_reference: data.reference,
      p_category_id: data.category_id,
      p_currency: currency,
      p_entries: data.entries,
    });

    if (rpcError) {
      if (rpcError.message.includes('idempotency')) {
        throw new BadRequestException('Duplicate transaction (idempotency key already exists)');
      }
      throw new InternalServerErrorException(rpcError.message);
    }

    return {
      success: true,
      transaction_id: result,
    };
  }
}
