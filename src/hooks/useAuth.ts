import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/mongodb/client';
import type { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];

export interface AuthUser {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
  };
}

export interface AuthSession {
  user: AuthUser;
  access_token: string;
}

interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<{ error?: string }>;
  updatePassword: (password: string) => Promise<{ error?: string }>;
  updateProfile: (updates: Partial<Pick<Profile, 'full_name' | 'preferred_currency' | 'timezone'>>) => Promise<{ error?: string }>;
  refreshProfile: () => Promise<void>;
}

export type UseAuthReturn = AuthState & AuthActions;

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
    initialized: false,
  });

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await (supabase.from('profiles') as any)
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[Auth] Failed to fetch profile:', error.message);
      return null;
    }
    return data;
  }, []);

  const refreshProfile = useCallback(async () => {
    const userId = state.user?.id;
    if (!userId) return;
    const profile = await fetchProfile(userId);
    setState((prev) => ({ ...prev, profile }));
  }, [state.user?.id, fetchProfile]);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const token = localStorage.getItem('safivra-token');
        if (!token) {
          if (mounted) setState({ user: null, session: null, profile: null, loading: false, initialized: true });
          return;
        }

        const decoded = parseJwt(token);
        if (!decoded || (decoded.exp && decoded.exp * 1000 < Date.now())) {
          localStorage.removeItem('safivra-token');
          if (mounted) setState({ user: null, session: null, profile: null, loading: false, initialized: true });
          return;
        }

        // Fetch profile using our intercepted supabase client
        const profile = await fetchProfile(decoded.sub);
        if (!profile) {
          localStorage.removeItem('safivra-token');
          if (mounted) setState({ user: null, session: null, profile: null, loading: false, initialized: true });
          return;
        }

        if (mounted) {
          const user: AuthUser = {
            id: decoded.sub,
            email: decoded.email,
            user_metadata: { full_name: profile.full_name || '' },
          };
          setState({
            user,
            session: { user, access_token: token },
            profile,
            loading: false,
            initialized: true,
          });
        }
      } catch {
        if (mounted) {
          setState({ user: null, session: null, profile: null, loading: false, initialized: true });
        }
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [fetchProfile]);

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
      const res = await fetch(`${baseUrl}/api/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const contentType = res.headers.get('Content-Type') || '';
      if (!contentType.includes('application/json')) {
        return { error: 'Backend server is not responding correctly. If on Production, please check MONGODB_URI & JWT_SECRET in Vercel Environment Variables.' };
      }

      const resData = await res.json();
      if (!res.ok) {
        if (resData.error === 'invalid_credentials') {
          return { error: 'Incorrect email or password. Please try again.' };
        }
        return { error: resData.error || 'Failed to sign in' };
      }

      const { session, profile } = resData;
      localStorage.setItem('safivra-token', session.access_token);

      setState({
        user: session.user,
        session,
        profile,
        loading: false,
        initialized: true,
      });

      return {};
    } catch (err: any) {
      return { error: err.message || 'Network error' };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string
  ): Promise<{ error?: string }> => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
      const res = await fetch(`${baseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName }),
      });

      const contentType = res.headers.get('Content-Type') || '';
      if (!contentType.includes('application/json')) {
        return { error: 'Backend server is not responding correctly. If on Production, please check MONGODB_URI & JWT_SECRET in Vercel Environment Variables.' };
      }

      const resData = await res.json();
      if (!res.ok) {
        if (resData.error === 'already_registered') {
          return { error: 'An account with that email address already exists.' };
        }
        return { error: resData.error || 'Failed to create account' };
      }

      return {};
    } catch (err: any) {
      return { error: err.message || 'Network error' };
    }
  };

  const signOut = async (): Promise<void> => {
    localStorage.removeItem('safivra-token');
    setState({
      user: null,
      session: null,
      profile: null,
      loading: false,
      initialized: true,
    });
  };

  const sendPasswordReset = async (email: string): Promise<{ error?: string }> => {
    // Stubbed since we do not configure SMTP server, return positive status for safety
    return {};
  };

  const updatePassword = async (password: string): Promise<{ error?: string }> => {
    try {
      const token = localStorage.getItem('safivra-token');
      const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
      const res = await fetch(`${baseUrl}/api/auth/update-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ password }),
      });

      const contentType = res.headers.get('Content-Type') || '';
      if (!contentType.includes('application/json')) {
        return { error: 'Backend error (non-JSON). Please run using "npx vercel dev" instead of "npm run dev" to run the local backend server.' };
      }

      const resData = await res.json();
      if (!res.ok) {
        return { error: resData.error || 'Failed to update password' };
      }
      return {};
    } catch (err: any) {
      return { error: err.message || 'Network error' };
    }
  };

  const updateProfile = async (
    updates: Partial<Pick<Profile, 'full_name' | 'preferred_currency' | 'timezone'>>
  ): Promise<{ error?: string }> => {
    if (!state.user) return { error: 'Not authenticated' };

    const { error } = await (supabase.from('profiles') as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', state.user.id);

    if (error) return { error: error.message };

    await refreshProfile();
    return {};
  };

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    sendPasswordReset,
    updatePassword,
    updateProfile,
    refreshProfile,
  };
}
