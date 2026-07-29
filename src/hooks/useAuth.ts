import { useState, useEffect, useCallback } from 'react';
import { supabase, isPlaceholderConfig, isDemoMode } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthState {
  user: User | null;
  session: Session | null;
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

const DEMO_USER: User = {
  id: 'demo-user-id',
  email: 'demo@safivra.com',
  app_metadata: {},
  user_metadata: { full_name: 'Demo User' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

const DEMO_SESSION: Session = {
  access_token: 'demo-token',
  token_type: 'bearer',
  expires_in: 3600,
  refresh_token: 'demo-refresh-token',
  user: DEMO_USER,
};

const DEMO_PROFILE: Profile = {
  id: 'demo-user-id',
  full_name: 'Demo User',
  preferred_currency: 'BDT',
  timezone: 'Asia/Dhaka',
  onboarding_completed: true,
  avatar_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
    initialized: false,
  });

  const fetchProfile = useCallback(async (userId: string) => {
    if (isPlaceholderConfig && isDemoMode && userId === 'demo-user-id') {
      return DEMO_PROFILE;
    }

    const { data, error } = await supabase
      .from('profiles')
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

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      // 1. If in Demo Mode (VITE_ENABLE_DEMO_MODE=true) and config is placeholder, load demo session if present
      if (isPlaceholderConfig && isDemoMode) {
        const isDemoLoggedIn = localStorage.getItem('safivra_demo_logged_in') === 'true';
        if (mounted) {
          if (isDemoLoggedIn) {
            setState({
              user: DEMO_USER,
              session: DEMO_SESSION,
              profile: DEMO_PROFILE,
              loading: false,
              initialized: true,
            });
          } else {
            setState({ user: null, session: null, profile: null, loading: false, initialized: true });
          }
        }
        return;
      }

      // 2. If credentials are placeholder and demo mode is disabled, keep visitor logged out
      if (isPlaceholderConfig && !isDemoMode) {
        if (mounted) {
          setState({ user: null, session: null, profile: null, loading: false, initialized: true });
        }
        return;
      }

      try {
        const sessionRes = await supabase.auth.getSession();
        const session = sessionRes?.data?.session;
        
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          if (mounted) {
            setState({
              user: session.user,
              session,
              profile,
              loading: false,
              initialized: true,
            });
          }
        } else {
          if (mounted) {
            setState({ user: null, session: null, profile: null, loading: false, initialized: true });
          }
        }
      } catch (err) {
        if (mounted) {
          setState({ user: null, session: null, profile: null, loading: false, initialized: true });
        }
      }
    }

    initAuth();

    // Do not listen to auth state changes if we are operating in pure offline placeholder demo mode
    if (isPlaceholderConfig && isDemoMode) {
      return () => {
        mounted = false;
      };
    }

    const authListener = supabase.auth?.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        if (mounted) {
          setState({
            user: session.user,
            session,
            profile,
            loading: false,
            initialized: true,
          });
        }
      } else {
        if (mounted) {
          setState({ user: null, session: null, profile: null, loading: false, initialized: true });
        }
      }
    });

    const subscription = authListener?.data?.subscription;

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    if (isPlaceholderConfig) {
      if (isDemoMode) {
        localStorage.setItem('safivra_demo_logged_in', 'true');
        setState({
          user: DEMO_USER,
          session: DEMO_SESSION,
          profile: DEMO_PROFILE,
          loading: false,
          initialized: true,
        });
        return {};
      }
      return { error: 'Supabase credentials missing or invalid. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string
  ): Promise<{ error?: string }> => {
    if (isPlaceholderConfig) {
      if (isDemoMode) {
        localStorage.setItem('safivra_demo_logged_in', 'true');
        setState({
          user: DEMO_USER,
          session: DEMO_SESSION,
          profile: DEMO_PROFILE,
          loading: false,
          initialized: true,
        });
        return {};
      }
      return { error: 'Supabase credentials missing or invalid. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) return { error: error.message };
    return {};
  };

  const signOut = async (): Promise<void> => {
    if (isPlaceholderConfig && isDemoMode) {
      localStorage.removeItem('safivra_demo_logged_in');
    } else {
      await supabase.auth.signOut();
    }
    setState({
      user: null,
      session: null,
      profile: null,
      loading: false,
      initialized: true,
    });
  };

  const sendPasswordReset = async (email: string): Promise<{ error?: string }> => {
    if (isPlaceholderConfig) {
      return { error: 'Supabase credentials missing.' };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return { error: error.message };
    return {};
  };

  const updatePassword = async (password: string): Promise<{ error?: string }> => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: error.message };
    return {};
  };

  const updateProfile = async (
    updates: Partial<Pick<Profile, 'full_name' | 'preferred_currency' | 'timezone'>>
  ): Promise<{ error?: string }> => {
    if (!state.user) return { error: 'Not authenticated' };

    if (isPlaceholderConfig && isDemoMode) {
      // Mock update local profile
      return {};
    }

    const userId = state.user.id;
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    const res = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ ...updates, updated_at: new Date().toISOString() }),
      }
    );

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { error: (errData as any)?.message || 'Failed to update profile' };
    }

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
