import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isPlaceholderConfig =
  !rawUrl ||
  !rawKey ||
  rawUrl.includes('placeholder-project') ||
  rawKey.includes('placeholder');

const supabaseUrl = isPlaceholderConfig ? 'https://placeholder-project.supabase.co' : rawUrl;
const supabaseAnonKey = isPlaceholderConfig ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder' : rawKey;

if (isPlaceholderConfig) {
  console.warn(
    '[Safivra] Operating in Offline/Demo mode. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env for production database access.'
  );
}

// Custom fetch wrapper with 2500ms fast-timeout to eliminate 30-second loading hangs
const fastFetch: typeof fetch = (input, init) => {
  if (isPlaceholderConfig) {
    // Instant rejection in placeholder mode so components fallback to sample data in 0ms
    return Promise.reject(new TypeError('Offline placeholder configuration'));
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);
  const combinedSignal = init?.signal
    ? init.signal
    : controller.signal;

  return fetch(input, { ...init, signal: combinedSignal }).finally(() => {
    clearTimeout(timeoutId);
  });
};

const realSupabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: !isPlaceholderConfig,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: fastFetch,
  },
});

// A chainable query builder proxy that mirrors Supabase JS queries but hits /api/data backend
class MongoQueryBuilder {
  private table: string;
  private method: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private filters: Record<string, any> = {};
  private bodyData: any = null;
  private orderField?: string;
  private orderDir?: 'asc' | 'desc';
  private limitCount?: number;

  constructor(table: string) {
    this.table = table;
  }

  select(columns?: string) {
    this.method = 'select';
    return this;
  }

  insert(values: any) {
    this.method = 'insert';
    this.bodyData = values;
    return this;
  }

  update(values: any) {
    this.method = 'update';
    this.bodyData = values;
    return this;
  }

  delete() {
    this.method = 'delete';
    return this;
  }

  eq(column: string, value: any) {
    this.filters[column] = value;
    return this;
  }

  or(filterString: string) {
    this.filters['_or'] = filterString;
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderField = column;
    this.orderDir = options?.ascending === false ? 'desc' : 'asc';
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  async single() {
    const res = await this.execute();
    return {
      data: res.data && res.data.length > 0 ? res.data[0] : null,
      error: res.error,
    };
  }

  async then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    try {
      const result = await this.execute();
      if (onfulfilled) return onfulfilled(result);
      return result;
    } catch (err) {
      if (onrejected) return onrejected(err);
      throw err;
    }
  }

  private async execute() {
    try {
      const token = localStorage.getItem('safivra-token');
      
      const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
      const url = new URL(`${baseUrl}/api/data`);
      
      url.searchParams.set('table', this.table);
      url.searchParams.set('method', this.method);
      
      if (this.orderField) {
        url.searchParams.set('_order', this.orderField);
        url.searchParams.set('_dir', this.orderDir || 'asc');
      }

      for (const [k, v] of Object.entries(this.filters)) {
        url.searchParams.set(k, String(v));
      }

      const isSelect = this.method === 'select';
      const response = await fetch(url.toString(), {
        method: isSelect ? 'GET' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : 'Bearer demo-token',
        },
        body: !isSelect ? JSON.stringify(this.bodyData) : undefined,
      });

      const contentType = response.headers.get('Content-Type') || '';
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        return { data: null, error: { message: `Backend error (non-JSON). Make sure you run "npx vercel dev" to run the backend functions locally.` } };
      }

      const resData = await response.json();
      if (!response.ok) {
        return { data: null, error: { message: resData.error || 'API Error' } };
      }
      return { data: resData.data, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message || 'Network error' } };
    }
  }
}

const isMongoBackend = import.meta.env.VITE_BACKEND_PROVIDER === 'mongodb';

export const supabase = (isMongoBackend
  ? ({
      auth: realSupabase.auth,
      from: (table: string) => {
        return new MongoQueryBuilder(table) as any;
      },
      rpc: async (fn: string, params?: any) => {
        try {
          const token = localStorage.getItem('safivra-token');
          
          const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
          const url = `${baseUrl}/api/rpc`;

          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token ? `Bearer ${token}` : 'Bearer demo-token',
            },
            body: JSON.stringify({ fn, params }),
          });

          const contentType = response.headers.get('Content-Type') || '';
          if (!contentType.includes('application/json')) {
            const text = await response.text();
            return { data: null, error: { message: `Backend error (non-JSON). Make sure you run "npx vercel dev" to run the backend functions locally.` } };
          }

          const resData = await response.json();
          if (!response.ok) {
            return { data: null, error: { message: resData.error || 'RPC Error' } };
          }
          return { data: resData.data, error: null };
        } catch (err: any) {
          return { data: null, error: { message: err.message || 'Network error' } };
        }
      }
    } as any)
  : realSupabase) as unknown as SupabaseClient<Database>;
