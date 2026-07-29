import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { parseError } from '@/lib/errors/handler';

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

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
    initialized: false,
  });

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[Auth] Failed to fetch profile:', error.code);
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
      const { data: { session } } = await supabase.auth.getSession();

      if (!mounted) return;

      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setState({ user: session.user, session, profile, loading: false, initialized: true });
      } else {
        setState({ user: null, session: null, profile: null, loading: false, initialized: true });
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setState({ user: session.user, session, profile, loading: false, initialized: true });
      } else {
        setState({ user: null, session: null, profile: null, loading: false, initialized: true });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: parseError(error).message };
    return {};
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string
  ): Promise<{ error?: string }> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/verify-email`,
      },
    });
    if (error) return { error: parseError(error).message };
    return {};
  };

  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut();
  };

  const sendPasswordReset = async (email: string): Promise<{ error?: string }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    // Return the same message whether email exists or not (security)
    if (error && !error.message.includes('rate limit')) return {};
    if (error) return { error: parseError(error).message };
    return {};
  };

  const updatePassword = async (password: string): Promise<{ error?: string }> => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: parseError(error).message };
    return {};
  };

  const updateProfile = async (
    updates: Partial<Pick<Profile, 'full_name' | 'preferred_currency' | 'timezone'>>
  ): Promise<{ error?: string }> => {
    if (!state.user) return { error: 'Not authenticated' };

    const { error } = await (supabase.from('profiles') as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', state.user.id);

    if (error) return { error: parseError(error).message };

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
