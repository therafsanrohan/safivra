import { MongoClient, Db } from 'mongodb';
import { attachDatabasePool } from '@vercel/functions';

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('MONGODB_URI environment variable is missing.');
}

let client: MongoClient | null = null;
let db: Db | null = null;

const defaultCategories = [
  // Income
  { name: 'Salary', category_type: 'income', icon: 'Banknote', is_system: true, sort_order: 10, is_active: true },
  { name: 'Freelance', category_type: 'income', icon: 'Laptop', is_system: true, sort_order: 20, is_active: true },
  { name: 'Business Income', category_type: 'income', icon: 'Briefcase', is_system: true, sort_order: 30, is_active: true },
  { name: 'Bonus', category_type: 'income', icon: 'Award', is_system: true, sort_order: 40, is_active: true },
  { name: 'Commission', category_type: 'income', icon: 'Percent', is_system: true, sort_order: 50, is_active: true },
  { name: 'Investment Return', category_type: 'income', icon: 'TrendingUp', is_system: true, sort_order: 60, is_active: true },
  { name: 'Rental Income', category_type: 'income', icon: 'Home', is_system: true, sort_order: 70, is_active: true },
  { name: 'Gift Received', category_type: 'income', icon: 'Gift', is_system: true, sort_order: 80, is_active: true },
  { name: 'Refund', category_type: 'income', icon: 'RotateCcw', is_system: true, sort_order: 90, is_active: true },
  { name: 'Other Income', category_type: 'income', icon: 'CircleDollarSign', is_system: true, sort_order: 100, is_active: true },

  // Expense
  { name: 'Food & Dining', category_type: 'expense', icon: 'Utensils', is_system: true, sort_order: 10, is_active: true },
  { name: 'Groceries', category_type: 'expense', icon: 'ShoppingCart', is_system: true, sort_order: 20, is_active: true },
  { name: 'Transport', category_type: 'expense', icon: 'Car', is_system: true, sort_order: 30, is_active: true },
  { name: 'Rent', category_type: 'expense', icon: 'Home', is_system: true, sort_order: 40, is_active: true },
  { name: 'Utilities', category_type: 'expense', icon: 'Zap', is_system: true, sort_order: 50, is_active: true },
  { name: 'Shopping', category_type: 'expense', icon: 'ShoppingBag', is_system: true, sort_order: 60, is_active: true },
  { name: 'Healthcare', category_type: 'expense', icon: 'Heart', is_system: true, sort_order: 70, is_active: true },
  { name: 'Education', category_type: 'expense', icon: 'BookOpen', is_system: true, sort_order: 80, is_active: true },
  { name: 'Entertainment', category_type: 'expense', icon: 'Tv', is_system: true, sort_order: 90, is_active: true },
  { name: 'Subscription', category_type: 'expense', icon: 'RefreshCw', is_system: true, sort_order: 100, is_active: true },
  { name: 'Family', category_type: 'expense', icon: 'Users', is_system: true, sort_order: 110, is_active: true },
  { name: 'Personal Care', category_type: 'expense', icon: 'Scissors', is_system: true, sort_order: 120, is_active: true },
  { name: 'Travel', category_type: 'expense', icon: 'Plane', is_system: true, sort_order: 130, is_active: true },
  { name: 'Charity', category_type: 'expense', icon: 'HandHeart', is_system: true, sort_order: 140, is_active: true },
  { name: 'Bank Charge', category_type: 'expense', icon: 'Landmark', is_system: true, sort_order: 150, is_active: true },
  { name: 'Mobile Wallet Fee', category_type: 'expense', icon: 'Smartphone', is_system: true, sort_order: 160, is_active: true },
  { name: 'Loan Interest', category_type: 'expense', icon: 'Percent', is_system: true, sort_order: 170, is_active: true },
  { name: 'Credit Card Fee', category_type: 'expense', icon: 'CreditCard', is_system: true, sort_order: 180, is_active: true },
  { name: 'Other Expense', category_type: 'expense', icon: 'MoreHorizontal', is_system: true, sort_order: 190, is_active: true },

  // System
  { name: 'Opening Balance Equity', category_type: 'system', icon: 'Database', is_system: true, sort_order: 1, is_active: true },
  { name: 'Transfer Fee', category_type: 'system', icon: 'ArrowRightLeft', is_system: true, sort_order: 2, is_active: true },
  { name: 'Balance Adjustment', category_type: 'system', icon: 'SlidersHorizontal', is_system: true, sort_order: 3, is_active: true }
];

export async function getDb(): Promise<Db> {
  if (db) return db;

  if (!client) {
    client = new MongoClient(uri!, {
      maxPoolSize: 10,
    });
    // Hook it into Vercel database connection pool lifecycle manager
    attachDatabasePool(client);
    await client.connect();
  }

  db = client.db();

  // Seed categories if database is empty
  const count = await db.collection('transaction_categories').countDocuments();
  if (count === 0) {
    console.log('[MongoDB] Seeding default transaction categories...');
    await db.collection('transaction_categories').insertMany(defaultCategories);
  }

  return db;
}
