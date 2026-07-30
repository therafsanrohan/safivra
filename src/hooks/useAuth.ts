import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserPreferences = Database['public']['Tables']['user_preferences']['Row'];

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  preferences: UserPreferences | null;
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
  updatePreferences: (updates: Database['public']['Tables']['user_preferences']['Update']) => Promise<{ error?: string }>;
  refreshProfile: () => Promise<void>;
}

export type UseAuthReturn = AuthState & AuthActions;



export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    preferences: null,
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
      console.error('[Auth] Failed to fetch profile:', error.message);
      return null;
    }
    return data;
  }, []);

  const fetchPreferences = useCallback(async (userId: string) => {


    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('[Auth] Failed to fetch preferences:', error.message);
      return null;
    }
    return data;
  }, []);

  const refreshProfile = useCallback(async () => {
    const userId = state.user?.id;
    if (!userId) return;
    const [profile, preferences] = await Promise.all([
      fetchProfile(userId),
      fetchPreferences(userId)
    ]);
    setState((prev) => ({ ...prev, profile, preferences }));
  }, [state.user?.id, fetchProfile, fetchPreferences]);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {


      try {
        const sessionRes = await supabase.auth.getSession();
        const session = sessionRes?.data?.session;
        
        if (session?.user) {
          const [profile, preferences] = await Promise.all([
            fetchProfile(session.user.id),
            fetchPreferences(session.user.id)
          ]);
          if (mounted) {
            setState({
              user: session.user,
              session,
              profile,
              preferences,
              loading: false,
              initialized: true,
            });
          }
        } else {
          if (mounted) {
            setState({ user: null, session: null, profile: null, preferences: null, loading: false, initialized: true });
          }
        }
      } catch {
        if (mounted) {
          setState({ user: null, session: null, profile: null, preferences: null, loading: false, initialized: true });
        }
      }
    }

    initAuth();



    const authListener = supabase.auth?.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      if (session?.user) {
        const [profile, preferences] = await Promise.all([
          fetchProfile(session.user.id),
          fetchPreferences(session.user.id)
        ]);
        if (mounted) {
          setState({
            user: session.user,
            session,
            profile,
            preferences,
            loading: false,
            initialized: true,
          });
        }
      } else {
        if (mounted) {
          setState({ user: null, session: null, profile: null, preferences: null, loading: false, initialized: true });
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


    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
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
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) return { error: error.message };
    return {};
  };

  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut();
    setState({
      user: null,
      session: null,
      profile: null,
      preferences: null,
      loading: false,
      initialized: true,
    });
  };

  const sendPasswordReset = async (email: string): Promise<{ error?: string }> => {

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

  const updatePreferences = async (
    updates: Database['public']['Tables']['user_preferences']['Update']
  ): Promise<{ error?: string }> => {
    if (!state.user) return { error: 'Not authenticated' };



    const { error } = await supabase
      .from('user_preferences')
      // @ts-ignore
      .update(updates)
      .eq('user_id', state.user.id);

    if (error) {
      console.error('[Auth] Failed to update preferences:', error.message);
      return { error: error.message };
    }

    setState(prev => ({
      ...prev,
      preferences: prev.preferences ? { ...prev.preferences, ...updates } : null
    }));

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
    updatePreferences,
    refreshProfile,
  };
}
