import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../lib/db';
import crypto from 'crypto';

function generateUUID(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c: any) =>
        (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
      );
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { email, password, full_name } = req.body || {};

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = await getDb();

    // Check if email already registered
    const existingUser = await db.collection('users').findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'already_registered' });
    }

    const userId = generateUUID();
    const hashed = hashPassword(password);

    // Save user
    const userDoc = {
      id: userId,
      email: email.toLowerCase(),
      password: hashed,
      created_at: new Date().toISOString()
    };
    await db.collection('users').insertOne(userDoc);

    // Save profile
    const profileDoc = {
      id: userId,
      full_name: full_name,
      preferred_currency: 'BDT',
      timezone: 'Asia/Dhaka',
      onboarding_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await db.collection('profiles').insertOne(profileDoc);

    return res.status(200).json({ success: true, userId });
  } catch (err: any) {
    console.error('[Signup] Error:', err);
    return res.status(500).json({ error: err?.message || 'Database connection error or invalid credentials.' });
  }
}
