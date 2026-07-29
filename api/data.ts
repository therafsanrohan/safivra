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

  const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
  const table = url.searchParams.get('table');
  const method = url.searchParams.get('method') || (req.method === 'GET' ? 'select' : 'insert');

  if (!table) {
    return res.status(400).json({ error: 'Missing table parameter' });
  }

  try {
    const db = await getDb();

    // Map filters from searchParams
    const filters: Record<string, any> = {};
    url.searchParams.forEach((value, key) => {
      if (['_order', '_dir', 'table', 'method'].includes(key)) return;

      // Map special query formats
      if (value === 'true') {
        filters[key] = true;
      } else if (value === 'false') {
        filters[key] = false;
      } else if (value === 'null') {
        filters[key] = null;
      } else {
        filters[key] = value;
      }
    });

    // Enforce security boundaries
    if (table === 'transaction_categories') {
      // System categories have user_id = null
      filters.$or = [
        { user_id: user.id },
        { user_id: null },
        { user_id: { $exists: false } }
      ];
    } else {
      filters.user_id = user.id;
    }

    if (method === 'select') {
      let data: any[] = [];

      if (table === 'v_account_balances') {
        // Compute balances dynamically from ledger entries
        const accounts = await db.collection('financial_accounts')
          .find({ user_id: user.id, is_archived: false })
          .sort({ name: 1 })
          .toArray();

        // Aggregate ledger entries (where tx status is posted) to find sums
        const balances = await db.collection('ledger_entries').aggregate([
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
          { $match: { 'transaction.status': 'posted' } },
          {
            $group: {
              _id: '$financial_account_id',
              total: { $sum: '$amount' }
            }
          }
        ]).toArray();

        const balanceMap = new Map(balances.map(b => [b._id, b.total]));

        data = accounts.map(acc => {
          const accountId = acc.id;
          const ledgerSum = balanceMap.get(accountId);
          // If there are ledger entries, the balance is the ledger sum, otherwise opening_balance
          const balance = ledgerSum !== undefined ? ledgerSum : (acc.opening_balance || 0);
          return {
            ...acc,
            account_id: accountId,
            balance: String(balance)
          };
        });
      } else if (table === 'profiles') {
        // Auto-initialize profile if it does not exist
        let profile = await db.collection('profiles').findOne({ id: user.id });
        if (!profile) {
          profile = {
            id: user.id,
            full_name: user.email ? user.email.split('@')[0] : 'Real User',
            preferred_currency: 'BDT',
            timezone: 'Asia/Dhaka',
            onboarding_completed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          await db.collection('profiles').insertOne(profile);
        }
        data = [profile];
      } else if (table === 'ledger_transactions') {
        // Aggregate ledger entries nested inside transactions
        const orderField = url.searchParams.get('_order') || 'transaction_date';
        const orderDir = url.searchParams.get('_dir') === 'asc' ? 1 : -1;

        data = await db.collection('ledger_transactions').aggregate([
          { $match: filters },
          { $sort: { [orderField]: orderDir, created_at: -1 } },
          { $limit: 100 },
          {
            $lookup: {
              from: 'ledger_entries',
              localField: 'id',
              foreignField: 'ledger_transaction_id',
              as: 'ledger_entries'
            }
          }
        ]).toArray();
      } else {
        const orderField = url.searchParams.get('_order');
        const orderDir = url.searchParams.get('_dir') === 'asc' ? 1 : -1;
        
        let cursor = db.collection(table).find(filters);
        if (orderField) {
          cursor = cursor.sort({ [orderField]: orderDir });
        }
        data = await cursor.toArray();
      }

      return res.status(200).json({ data, error: null });
    }

    if (method === 'insert') {
      const body = req.body;
      const doc = {
        ...body,
        id: body.id || generateUUID(),
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await db.collection(table).insertOne(doc);
      return res.status(200).json({ data: [doc], error: null });
    }

    if (method === 'update') {
      const body = req.body;
      const updateDoc = {
        $set: {
          ...body,
          updated_at: new Date().toISOString()
        }
      };

      await db.collection(table).updateMany(filters, updateDoc);
      
      // Fetch updated docs to return
      const data = await db.collection(table).find(filters).toArray();
      return res.status(200).json({ data, error: null });
    }

    if (method === 'delete') {
      await db.collection(table).deleteMany(filters);
      return res.status(200).json({ data: [], error: null });
    }

    return res.status(400).json({ error: `Unsupported method: ${method}` });
  } catch (err: any) {
    console.error('[API Data] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
