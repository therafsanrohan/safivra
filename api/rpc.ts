import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './lib/db';
import { verifyAuth } from './lib/auth';
import { crypto } from 'crypto';

function generateUUID(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c: any) =>
        (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
      );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let user;
  try {
    user = verifyAuth(req);
  } catch (err: any) {
    return res.status(401).json({ error: err.message || 'Unauthorized' });
  }

  const { fn, params } = req.body || {};

  if (!fn) {
    return res.status(400).json({ error: 'Missing function (fn) parameter' });
  }

  try {
    const db = await getDb();

    if (fn === 'post_transaction') {
      // 1. Resolve destination account if loan or credit card ID is provided
      let destinationAccountId = params.p_destination_account_id;
      if (params.p_loan_id) {
        const loan = await db.collection('loans').findOne({ id: params.p_loan_id, user_id: user.id });
        if (loan) destinationAccountId = loan.account_id;
      } else if (params.p_credit_card_id) {
        const card = await db.collection('credit_cards').findOne({ id: params.p_credit_card_id, user_id: user.id });
        if (card) destinationAccountId = card.account_id;
      }

      // 2. Verify source account ownership
      const sourceAccount = await db.collection('financial_accounts').findOne({
        id: params.p_account_id,
        user_id: user.id,
        is_active: true
      });
      if (!sourceAccount) {
        return res.status(400).json({ error: 'ACCOUNT_OWNERSHIP: Account not found or access denied' });
      }

      // 3. Verify destination account ownership
      if (destinationAccountId) {
        const destAccount = await db.collection('financial_accounts').findOne({
          id: destinationAccountId,
          user_id: user.id,
          is_active: true
        });
        if (!destAccount) {
          return res.status(400).json({ error: 'ACCOUNT_OWNERSHIP: Destination account not found or access denied' });
        }
        if (destinationAccountId === params.p_account_id) {
          return res.status(400).json({ error: 'VALIDATION_ERROR: Source and destination must be different accounts' });
        }
      }

      // 4. Create transaction header ID
      const txId = generateUUID();

      // 5. Generate ledger entries based on transaction type
      const entries: any[] = [];
      const txType = params.p_transaction_type;
      const amount = Number(params.p_amount);
      const date = params.p_transaction_date;
      const time = params.p_transaction_time;
      const title = params.p_title;
      const merchant = params.p_merchant || null;
      const description = params.p_description || null;

      if (txType === 'income') {
        // Asset account: +amount (debit)
        entries.push({
          id: generateUUID(),
          user_id: user.id,
          ledger_transaction_id: txId,
          financial_account_id: params.p_account_id,
          amount: amount,
          entry_role: 'asset_debit',
          created_at: new Date().toISOString()
        });
        // Income category: -amount (credit)
        entries.push({
          id: generateUUID(),
          user_id: user.id,
          ledger_transaction_id: txId,
          category_id: params.p_category_id,
          amount: -amount,
          entry_role: 'income_credit',
          created_at: new Date().toISOString()
        });
      } else if (txType === 'expense') {
        const accClass = sourceAccount.account_class;
        // Expense category: +amount (debit)
        entries.push({
          id: generateUUID(),
          user_id: user.id,
          ledger_transaction_id: txId,
          category_id: params.p_category_id,
          amount: amount,
          entry_role: 'expense_debit',
          created_at: new Date().toISOString()
        });
        // Paying account: -amount (credit)
        entries.push({
          id: generateUUID(),
          user_id: user.id,
          ledger_transaction_id: txId,
          financial_account_id: params.p_account_id,
          amount: -amount,
          entry_role: accClass === 'liability' ? 'liability_credit' : 'asset_credit',
          created_at: new Date().toISOString()
        });
      } else if (txType === 'transfer') {
        const fee = Number(params.p_fee_amount || 0);
        // Destination account: +amount (debit / transfer in)
        entries.push({
          id: generateUUID(),
          user_id: user.id,
          ledger_transaction_id: txId,
          financial_account_id: destinationAccountId,
          amount: amount,
          entry_role: 'transfer_in',
          created_at: new Date().toISOString()
        });
        // Fee as expense (if any)
        if (fee > 0) {
          entries.push({
            id: generateUUID(),
            user_id: user.id,
            ledger_transaction_id: txId,
            category_id: params.p_category_id,
            amount: fee,
            entry_role: 'fee_expense',
            created_at: new Date().toISOString()
          });
        }
        // Source account: -(amount + fee) (credit / transfer out)
        entries.push({
          id: generateUUID(),
          user_id: user.id,
          ledger_transaction_id: txId,
          financial_account_id: params.p_account_id,
          amount: -(amount + fee),
          entry_role: 'transfer_out',
          created_at: new Date().toISOString()
        });
      } else if (txType === 'loan_received') {
        // Asset account: +amount (loan proceeds in)
        entries.push({
          id: generateUUID(),
          user_id: user.id,
          ledger_transaction_id: txId,
          financial_account_id: params.p_account_id,
          amount: amount,
          entry_role: 'asset_debit',
          created_at: new Date().toISOString()
        });
        // Loan liability: -amount (liability increases)
        entries.push({
          id: generateUUID(),
          user_id: user.id,
          ledger_transaction_id: txId,
          financial_account_id: destinationAccountId,
          amount: -amount,
          entry_role: 'liability_credit',
          created_at: new Date().toISOString()
        });
      } else if (txType === 'loan_payment') {
        const fee = Number(params.p_fee_amount || 0);
        let principal = Number(params.p_principal_amount || 0);
        let interest = Number(params.p_interest_amount || 0);

        // Replicate SQL auto-calculate principal/interest split
        if (principal === 0 && interest === 0) {
          const loan = await db.collection('loans').findOne({ id: params.p_loan_id, user_id: user.id });
          if (loan) {
            const interestType = loan.interest_type;
            const annualRate = Number(loan.annual_rate || 0);
            if (interestType === 'interest_free') {
              interest = 0;
              principal = amount - fee;
            } else if (annualRate > 0) {
              // Get outstanding balance for this loan account
              const ledgerEntries = await db.collection('ledger_entries').aggregate([
                { $match: { user_id: user.id, financial_account_id: destinationAccountId } },
                {
                  $lookup: {
                    from: 'ledger_transactions',
                    localField: 'ledger_transaction_id',
                    foreignField: 'id',
                    as: 'transaction'
                  }
                },
                { $unwind: '$transaction' },
                { $match: { 'transaction.status': 'posted' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
              ]).toArray();
              
              const ledgerSum = ledgerEntries[0]?.total || 0;
              const loanAccount = await db.collection('financial_accounts').findOne({ id: destinationAccountId });
              const loanOpening = loanAccount?.opening_balance || 0;
              const outstanding = Math.abs(ledgerSum !== 0 ? ledgerSum : loanOpening);

              // Interest = outstanding * (annual_rate / 12)
              interest = Math.round(outstanding * (annualRate / 12.0) * 100) / 100;
              if (interest >= (amount - fee)) {
                interest = amount - fee;
                principal = 0;
              } else {
                principal = amount - interest - fee;
              }
            } else {
              interest = 0;
              principal = amount - fee;
            }
          }
        }

        // Loan liability: +principal (reduces outstanding)
        if (principal > 0) {
          entries.push({
            id: generateUUID(),
            user_id: user.id,
            ledger_transaction_id: txId,
            financial_account_id: destinationAccountId,
            amount: principal,
            entry_role: 'liability_debit',
            created_at: new Date().toISOString()
          });
        }
        // Interest expense: +interest
        if (interest > 0) {
          entries.push({
            id: generateUUID(),
            user_id: user.id,
            ledger_transaction_id: txId,
            category_id: params.p_category_id,
            amount: interest,
            entry_role: 'expense_debit',
            created_at: new Date().toISOString()
          });
        }
        // Fee expense: +fee
        if (fee > 0) {
          entries.push({
            id: generateUUID(),
            user_id: user.id,
            ledger_transaction_id: txId,
            category_id: params.p_category_id,
            amount: fee,
            entry_role: 'fee_expense',
            created_at: new Date().toISOString()
          });
        }
        // Payment account: -(principal + interest + fee)
        entries.push({
          id: generateUUID(),
          user_id: user.id,
          ledger_transaction_id: txId,
          financial_account_id: params.p_account_id,
          amount: -(principal + interest + fee),
          entry_role: 'asset_credit',
          created_at: new Date().toISOString()
        });
      } else if (txType === 'credit_card_purchase') {
        // Expense category: +amount
        entries.push({
          id: generateUUID(),
          user_id: user.id,
          ledger_transaction_id: txId,
          category_id: params.p_category_id,
          amount: amount,
          entry_role: 'expense_debit',
          created_at: new Date().toISOString()
        });
        // Credit card liability: -amount (balance increases)
        entries.push({
          id: generateUUID(),
          user_id: user.id,
          ledger_transaction_id: txId,
          financial_account_id: destinationAccountId,
          amount: -amount,
          entry_role: 'liability_credit',
          created_at: new Date().toISOString()
        });
      } else if (txType === 'credit_card_payment') {
        // Credit card liability: +amount (balance decreases)
        entries.push({
          id: generateUUID(),
          user_id: user.id,
          ledger_transaction_id: txId,
          financial_account_id: destinationAccountId,
          amount: amount,
          entry_role: 'liability_debit',
          created_at: new Date().toISOString()
        });
        // Bank/wallet asset: -amount
        entries.push({
          id: generateUUID(),
          user_id: user.id,
          ledger_transaction_id: txId,
          financial_account_id: params.p_account_id,
          amount: -amount,
          entry_role: 'asset_credit',
          created_at: new Date().toISOString()
        });
      } else if (txType === 'refund') {
        // Asset account: +amount (refund received)
        entries.push({
          id: generateUUID(),
          user_id: user.id,
          ledger_transaction_id: txId,
          financial_account_id: params.p_account_id,
          amount: amount,
          entry_role: 'asset_debit',
          created_at: new Date().toISOString()
        });
        // Expense category: -amount (reverses the expense)
        entries.push({
          id: generateUUID(),
          user_id: user.id,
          ledger_transaction_id: txId,
          category_id: params.p_category_id,
          amount: -amount,
          entry_role: 'expense_debit',
          created_at: new Date().toISOString()
        });
      } else if (txType === 'opening_balance') {
        // Asset account: +amount
        entries.push({
          id: generateUUID(),
          user_id: user.id,
          ledger_transaction_id: txId,
          financial_account_id: params.p_account_id,
          amount: amount,
          entry_role: 'asset_debit',
          created_at: new Date().toISOString()
        });
        // Opening equity: -amount (not income)
        entries.push({
          id: generateUUID(),
          user_id: user.id,
          ledger_transaction_id: txId,
          financial_account_id: params.p_account_id,
          amount: -amount,
          entry_role: 'equity_credit',
          created_at: new Date().toISOString()
        });
      } else if (txType === 'balance_adjustment') {
        // Signed adjustment amount can be positive or negative
        entries.push({
          id: generateUUID(),
          user_id: user.id,
          ledger_transaction_id: txId,
          financial_account_id: params.p_account_id,
          amount: amount,
          entry_role: amount >= 0 ? 'asset_debit' : 'asset_credit',
          created_at: new Date().toISOString()
        });
        entries.push({
          id: generateUUID(),
          user_id: user.id,
          ledger_transaction_id: txId,
          category_id: params.p_category_id,
          amount: -amount,
          entry_role: 'equity_credit',
          created_at: new Date().toISOString()
        });
      } else {
        return res.status(400).json({ error: `VALIDATION_ERROR: Unknown transaction type: ${txType}` });
      }

      // 6. Verify entries balance to zero (within rounding tolerances)
      const sum = entries.reduce((acc, curr) => acc + curr.amount, 0);
      if (Math.abs(sum) > 0.001) {
        return res.status(400).json({ error: `LEDGER_UNBALANCED: Transaction entries do not balance. Sum = ${sum}` });
      }

      // 7. Write transaction header
      const txHeader = {
        id: txId,
        user_id: user.id,
        transaction_type: txType,
        transaction_date: date,
        transaction_time: time || null,
        title: title,
        merchant: merchant,
        description: description,
        status: 'posted',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await db.collection('ledger_transactions').insertOne(txHeader);

      // 8. Write ledger entries
      await db.collection('ledger_entries').insertMany(entries);

      // 9. Record loan payment details if applicable
      if (txType === 'loan_payment' && params.p_loan_id) {
        const fee = Number(params.p_fee_amount || 0);
        let principal = Number(params.p_principal_amount || 0);
        let interest = Number(params.p_interest_amount || 0);

        // Same principal interest logic split check
        const lpLog = {
          id: generateUUID(),
          user_id: user.id,
          loan_id: params.p_loan_id,
          ledger_transaction_id: txId,
          payment_date: date,
          total_amount: amount,
          principal_amount: principal,
          interest_amount: interest,
          fee_amount: fee,
          payment_account_id: params.p_account_id,
          created_at: new Date().toISOString()
        };
        await db.collection('loan_payments').insertOne(lpLog);
      }

      // 10. Record credit card payment details if applicable
      if (txType === 'credit_card_payment' && params.p_credit_card_id) {
        const ccLog = {
          id: generateUUID(),
          user_id: user.id,
          credit_card_id: params.p_credit_card_id,
          ledger_transaction_id: txId,
          payment_date: date,
          amount: amount,
          payment_account_id: params.p_account_id,
          created_at: new Date().toISOString()
        };
        await db.collection('credit_card_payments').insertOne(ccLog);
      }

      return res.status(200).json({ data: { transaction_id: txId }, error: null });
    }

    if (fn === 'get_monthly_summary') {
      const year = Number(params.p_year);
      const month = Number(params.p_month);
      const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDay = new Date(year, month, 0).getDate();
      const endStr = `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;

      const entries = await db.collection('ledger_entries').aggregate([
        { $match: { user_id: user.id } },
        {
          $lookup: {
            from: 'ledger_transactions',
            localField: 'ledger_transaction_id',
            foreignField: 'id',
            as: 'transaction'
          }
        },
        { $unwind: '$transaction' },
        {
          $match: {
            'transaction.status': 'posted',
            'transaction.transaction_date': { $gte: startStr, $lte: endStr }
          }
        }
      ]).toArray();

      let income = 0;
      let expense = 0;
      for (const entry of entries) {
        if (entry.entry_role === 'income_credit') {
          income += Math.abs(entry.amount);
        } else if (entry.entry_role === 'expense_debit' || entry.entry_role === 'fee_expense') {
          expense += entry.amount;
        }
      }

      return res.status(200).json({
        data: {
          income,
          expense,
          net: income - expense
        },
        error: null
      });
    }

    if (fn === 'void_transaction') {
      const result = await db.collection('ledger_transactions').updateOne(
        { id: params.p_transaction_id, user_id: user.id, status: 'posted' },
        {
          $set: {
            status: 'voided',
            voided_at: new Date().toISOString(),
            void_reason: params.p_void_reason || null,
            updated_at: new Date().toISOString()
          }
        }
      );

      if (result.matchedCount === 0) {
        return res.status(400).json({ error: 'Transaction not found or already voided' });
      }

      return res.status(200).json({ data: { success: true }, error: null });
    }

    return res.status(400).json({ error: `Unknown RPC function: ${fn}` });
  } catch (err: any) {
    console.error('[API RPC] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
