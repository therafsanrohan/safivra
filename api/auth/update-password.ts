import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../lib/db';
import { verifyAuth } from '../lib/auth';
import crypto from 'crypto';

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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let user;
  try {
    user = verifyAuth(req);
  } catch (err: any) {
    return res.status(401).json({ error: err.message || 'Unauthorized' });
  }

  const { password } = req.body || {};

  if (!password) {
    return res.status(400).json({ error: 'Missing password' });
  }

  try {
    const db = await getDb();

    const hashed = hashPassword(password);
    await db.collection('users').updateOne(
      { id: user.id },
      { $set: { password: hashed } }
    );

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('[Update Password] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
