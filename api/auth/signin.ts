import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../lib/db';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET || 'safivra-default-jwt-secret-key-12345';

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
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

    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'safivra-default-jwt-secret';

    const db = await getDb();

    // Find user
    const user = await db.collection('users').findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ error: 'invalid_credentials' });
    }

    // Verify password
    if (!verifyPassword(password, user.password)) {
      return res.status(400).json({ error: 'invalid_credentials' });
    }

    // Get profile
    const profile = await db.collection('profiles').findOne({ id: user.id });

    // Generate JWT
    const token = jwt.sign(
      { sub: user.id, email: user.email },
      jwtSecret,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      session: {
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          user_metadata: { full_name: profile?.full_name || '' }
        }
      },
      profile
    });
  } catch (err: any) {
    console.error('[Signin] Error:', err);
    return res.status(500).json({ error: err?.message || 'Internal Server Error' });
  }
}
