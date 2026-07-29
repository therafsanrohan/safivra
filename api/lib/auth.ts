import jwt from 'jsonwebtoken';
import type { VercelRequest } from '@vercel/node';

const jwtSecret = process.env.JWT_SECRET || 'safivra-default-jwt-secret-key-12345';

export interface AuthUser {
  id: string;
  email: string;
}

export function verifyAuth(req: VercelRequest): AuthUser {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing Authorization header');
  }

  const token = authHeader.split(' ')[1];
  
  // Custom auth JWT verification
  try {
    const decoded = jwt.verify(token, jwtSecret) as any;
    return {
      id: decoded.sub,
      email: decoded.email,
    };
  } catch (err: any) {
    throw new Error(`Unauthorized: ${err.message}`);
  }
}
