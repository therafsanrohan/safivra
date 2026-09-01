import type { VercelRequest, VercelResponse } from '@vercel/node';
import { processOutboxBatch } from '../../lib/outbox';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');

  // Protect background worker endpoint with CRON_SECRET if configured
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized worker invocation' });
    }
  }

  try {
    const batchSize = Math.min(Number(req.query.batch_size) || 25, 100);
    const result = await processOutboxBatch(batchSize);

    return res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({
      error: 'Failed to process outbox batch',
      message: err.message || 'Server error',
    });
  }
}
