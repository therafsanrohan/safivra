import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const start = performance.now();
  let dbHealthy = false;
  let responseTime = 0;
  let errorMessage = '';

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
    responseTime = Math.round(performance.now() - start);
    if (error) {
      errorMessage = error.message;
    } else {
      dbHealthy = true;
    }
  } catch (err: any) {
    errorMessage = err.message || 'Unknown connection error';
  }

  return NextResponse.json({
    dbHealthy,
    responseTime,
    errorMessage,
    timestamp: new Date().toISOString(),
    env: {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    }
  });
}
