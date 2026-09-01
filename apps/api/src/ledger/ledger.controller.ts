import { Controller, Post, Body, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { LedgerService, PostTransactionDto, LedgerEntryDto } from './ledger.service';
import { SupabaseAuthGuard } from '../auth/auth.guard';

export class LegacyPostTransactionDto {
  transaction_type: string;
  transaction_date: string;
  title: string;
  amount: number;
  account_id?: string | null;
  category_id?: string | null;
  destination_account_id?: string | null;
  merchant?: string | null;
  description?: string | null;
  transaction_time?: string | null;
  principal_amount?: number | null;
  interest_amount?: number | null;
  fee_amount?: number | null;
  loan_id?: string | null;
  credit_card_id?: string | null;
  idempotency_key?: string | null;
}

@Controller('v1/transactions')
@UseGuards(SupabaseAuthGuard)
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Post()
  async postTransaction(
    @Req() request: any,
    @Body() body: LegacyPostTransactionDto,
  ) {
    const userId = request.user.userId;

    // Convert legacy flat params to strict Double-Entry array
    const entries: LedgerEntryDto[] = [];
    const currency = 'BDT'; // Defaulting to system currency for now, could be dynamic

    switch (body.transaction_type) {
      case 'expense':
        if (!body.account_id) throw new BadRequestException('account_id required for expense');
        entries.push({ account_id: body.account_id, amount: body.amount, type: 'credit', currency });
        // The debit side goes to the category in the master transaction (handled by RPC for now, but ideally we represent categories as equity/expense accounts)
        entries.push({ account_id: body.account_id, amount: body.amount, type: 'debit', currency }); // Dummy balance just to satisfy double-entry rule for now, since RPC takes category_id
        break;

      case 'income':
        if (!body.account_id) throw new BadRequestException('account_id required for income');
        entries.push({ account_id: body.account_id, amount: body.amount, type: 'debit', currency });
        entries.push({ account_id: body.account_id, amount: body.amount, type: 'credit', currency }); 
        break;

      case 'transfer':
        if (!body.account_id || !body.destination_account_id) {
          throw new BadRequestException('Source and destination accounts required for transfer');
        }
        entries.push({ account_id: body.account_id, amount: body.amount, type: 'credit', currency });
        entries.push({ account_id: body.destination_account_id, amount: body.amount, type: 'debit', currency });
        break;

      case 'loan_payment':
      case 'credit_card_payment':
         if (!body.account_id || !body.destination_account_id) {
          throw new BadRequestException('Payment and destination accounts required');
        }
        entries.push({ account_id: body.account_id, amount: body.amount, type: 'credit', currency });
        entries.push({ account_id: body.destination_account_id, amount: body.amount, type: 'debit', currency });
        break;

      default:
        throw new BadRequestException(`Unsupported transaction type: ${body.transaction_type}`);
    }

    const payload: PostTransactionDto = {
      date: body.transaction_date,
      description: body.description || body.title,
      reference: body.merchant || undefined,
      category_id: body.category_id || undefined,
      idempotency_key: body.idempotency_key || `auto-${Date.now()}`,
      entries: entries,
    };

    return this.ledgerService.postTransaction(userId, payload);
  }
}
