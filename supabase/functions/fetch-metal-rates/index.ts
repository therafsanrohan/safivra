import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// Interface for standardizing provider response
interface MetalRates {
  gold_per_gram: number;
  silver_per_gram: number;
  currency: string;
}

// Mock provider since we don't have a real API key right now.
// In a real scenario, this would call Metals-API, GoldAPI, etc.
async function fetchRatesFromProvider(): Promise<MetalRates> {
  // Simulating an API call delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Current approximate rates in BDT for demonstration
  return {
    gold_per_gram: 9250.0,
    silver_per_gram: 105.5,
    currency: 'BDT',
  };
}

serve(async (req) => {
  try {
    // 1. Validate request method
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Authorize the request (must be from cron or admin)
    // For now, we expect a valid Authorization header with service_role or a valid admin token.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Missing authorization header' }), { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Initialize Supabase Client with the Auth header passed in
    // Note: To write to zakat_rate_snapshots bypassing RLS, we should ideally use the service_role key.
    // However, if called by an admin, the RLS policies we created allow admins to insert.
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''; // Should be ANON key, letting the Auth header define permissions
    
    // Create client using the provided auth header
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify if the user is an admin or if it's the service role. 
    // If it's a cron job, it usually passes the service_role key.
    
    // 3. Fetch rates from external provider
    const rates = await fetchRatesFromProvider();

    // 4. Save to Database
    const { data, error } = await supabase
      .from('zakat_rate_snapshots')
      .insert({
        provider_name: 'MockMetalProvider',
        gold_rate_per_gram: rates.gold_per_gram,
        silver_rate_per_gram: rates.silver_per_gram,
        currency: rates.currency,
        is_override: false
      })
      .select()
      .single();

    if (error) {
      console.error('Database Error:', error);
      throw new Error(`Failed to save snapshot: ${error.message}`);
    }

    // 5. Return success
    return new Response(JSON.stringify({ success: true, snapshot: data }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMsg }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
