import type { Database } from '@/types/database';

// ─── Native API Client ───────────────────────────────────────────────────────
// All data goes through MongoDB-backed Vercel Serverless Functions.
// No external database SDK is needed.

function getToken(): string | null {
  return localStorage.getItem('safivra-token');
}

function getBaseUrl(): string {
  return import.meta.env.VITE_API_URL || window.location.origin;
}

async function apiRequest(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  body?: unknown
): Promise<{ data: any; error: { message: string } | null }> {
  try {
    const token = getToken();
    const response = await fetch(`${getBaseUrl()}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : 'Bearer no-token',
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const contentType = response.headers.get('Content-Type') || '';
    if (!contentType.includes('application/json')) {
      return { data: null, error: { message: 'Backend API not available.' } };
    }

    const json = await response.json();
    if (!response.ok) {
      return { data: null, error: { message: json.error || 'API Error' } };
    }
    return { data: json.data, error: null };
  } catch (err: any) {
    return { data: null, error: { message: err.message || 'Network error' } };
  }
}

// ─── Query Builder ────────────────────────────────────────────────────────────
// Mirrors Supabase JS chainable API so all existing feature files work unchanged.

class QueryBuilder {
  private _table: string;
  private _method: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private _filters: Record<string, string> = {};
  private _body: unknown = null;
  private _orderField?: string;
  private _orderDir: 'asc' | 'desc' = 'asc';

  constructor(table: string) {
    this._table = table;
  }

  select(_columns?: string, _options?: { count?: string; head?: boolean }) {
    this._method = 'select';
    return this;
  }

  insert(values: unknown) {
    this._method = 'insert';
    this._body = values;
    return this;
  }

  update(values: unknown) {
    this._method = 'update';
    this._body = values;
    return this;
  }

  delete() {
    this._method = 'delete';
    return this;
  }

  eq(column: string, value: unknown) {
    this._filters[column] = String(value);
    return this;
  }

  not(column: string, _operator: string, _value: unknown) {
    // Passed as a filter hint; server-side handles the actual filtering
    this._filters[`_not_${column}`] = 'true';
    return this;
  }

  or(filterString: string) {
    this._filters['_or'] = filterString;
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this._orderField = column;
    this._orderDir = options?.ascending === false ? 'desc' : 'asc';
    return this;
  }

  limit(_count: number) {
    return this;
  }

  async single() {
    const res = await this._execute();
    return {
      data: Array.isArray(res.data) && res.data.length > 0 ? res.data[0] : null,
      error: res.error,
    };
  }

  then(
    onfulfilled?: (value: { data: any; error: any }) => any,
    onrejected?: (reason: any) => any
  ) {
    return this._execute().then(onfulfilled, onrejected);
  }

  private async _execute() {
    const url = new URL(`${getBaseUrl()}/api/data`);
    url.searchParams.set('table', this._table);
    url.searchParams.set('method', this._method);

    if (this._orderField) {
      url.searchParams.set('_order', this._orderField);
      url.searchParams.set('_dir', this._orderDir);
    }

    for (const [k, v] of Object.entries(this._filters)) {
      url.searchParams.set(k, v);
    }

    const isRead = this._method === 'select';
    return apiRequest(
      url.pathname + url.search,
      isRead ? 'GET' : 'POST',
      isRead ? undefined : this._body
    );
  }
}

// ─── Stub auth object ─────────────────────────────────────────────────────────
// Real auth logic lives in useAuth.ts (calls /api/auth/* endpoints directly).
// This stub keeps compatibility for any code that calls supabase.auth.getSession().
const authStub = {
  getSession: async () => ({ data: { session: null }, error: null }),
  onAuthStateChange: (_event: string, _callback: () => void) => ({
    data: { subscription: { unsubscribe: () => {} } },
  }),
};

// ─── Main export ──────────────────────────────────────────────────────────────
// Named `supabase` for backward compatibility with all feature files.
export interface DbClient {
  auth: typeof authStub;
  from(table: string): QueryBuilder;
  rpc(fn: string, params?: Record<string, unknown>): Promise<{ data: any; error: { message: string } | null }>;
}

export const supabase: DbClient = {
  auth: authStub,

  from(table: string): QueryBuilder {
    return new QueryBuilder(table);
  },

  async rpc(fn: string, params?: Record<string, unknown>) {
    return apiRequest('/api/rpc', 'POST', { fn, params });
  },
};
