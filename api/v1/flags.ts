import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');

  const flags = {
    backend_v1_enabled: process.env.VITE_FF_BACKEND_V1_ENABLED === 'true',
    backend_transactions_enabled:
      process.env.VITE_FF_BACKEND_TRANSACTIONS_ENABLED === 'true',
    backend_dashboard_enabled:
      process.env.VITE_FF_BACKEND_DASHBOARD_ENABLED === 'true',
    backend_accounts_enabled:
      process.env.VITE_FF_BACKEND_ACCOUNTS_ENABLED === 'true',
    redis_cache_enabled: process.env.VITE_FF_REDIS_CACHE_ENABLED === 'true',
  };

  return res.status(200).json({ success: true, flags });
}
