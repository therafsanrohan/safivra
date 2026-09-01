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
  updateProfile: (updates: Partial<Pick<Profile, 'full_name' | 'preferred_currency' | 'timezone' | 'phone' | 'date_of_birth' | 'gender' | 'address' | 'country'>>) => Promise<{ error?: string }>;
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

  const fetchProfile = useCallback(async (userId: string, userMeta?: any) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('[Auth] Error fetching profile:', error.message);
      }

      if (!data) {
        // Fallback lazy profile creation if trigger missed
        const fullName = userMeta?.full_name || '';
        const { data: createdProf, error: insErr } = await (supabase.from('profiles') as any)
          .upsert({
            id: userId,
            full_name: fullName,
            preferred_currency: 'BDT',
            timezone: 'Asia/Dhaka',
            onboarding_completed: false,
          })
          .select('*')
          .maybeSingle();

        if (insErr) {
          console.warn('[Auth] Could not create fallback profile:', insErr.message);
        }
        return createdProf ?? null;
      }

      return data;
    } catch (err: any) {
      console.warn('[Auth] Unexpected error in fetchProfile:', err?.message);
      return null;
    }
  }, []);

  const fetchPreferences = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.warn('[Auth] Error fetching preferences:', error.message);
      }

      if (!data) {
        // Fallback lazy preferences creation if trigger missed
        const { data: createdPref, error: insErr } = await (supabase.from('user_preferences') as any)
          .upsert({
            user_id: userId,
            language: 'en',
            preferred_currency: 'BDT',
            timezone: 'Asia/Dhaka',
            theme: 'light',
          })
          .select('*')
          .maybeSingle();

        if (insErr) {
          console.warn('[Auth] Could not create fallback preferences:', insErr.message);
        }
        return createdPref ?? null;
      }

      return data;
    } catch (err: any) {
      console.warn('[Auth] Unexpected error in fetchPreferences:', err?.message);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const userId = state.user?.id;
    if (!userId) return;
    const [profile, preferences] = await Promise.all([
      fetchProfile(userId, state.user?.user_metadata),
      fetchPreferences(userId)
    ]);
    setState((prev) => ({ ...prev, profile, preferences }));
  }, [state.user?.id, state.user?.user_metadata, fetchProfile, fetchPreferences]);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {


      try {
        const sessionRes = await supabase.auth.getSession();
        const session = sessionRes?.data?.session;
        
        if (session?.user) {
          const [profile, preferences] = await Promise.all([
            fetchProfile(session.user.id, session.user.user_metadata),
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
          fetchProfile(session.user.id, session.user.user_metadata),
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
  }, [fetchProfile, fetchPreferences]);

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
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        let msg = error.message;
        if (!msg || msg === '{}' || msg === '[object Object]') {
          msg = 'Signup failed: ' + JSON.stringify(error);
        }
        return { error: msg };
      }
      return {};
    } catch (err: any) {
      console.error('SignUp Error:', err);
      let errMsg = err.message || JSON.stringify(err);
      if (errMsg === '{}' || errMsg === '[object Object]') {
        errMsg = 'An unexpected error occurred during signup.';
      }
      return { error: errMsg };
    }
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
      redirectTo: `${window.location.origin}/auth/reset-password`,
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
    updates: Partial<Pick<Profile, 'full_name' | 'preferred_currency' | 'timezone' | 'phone' | 'date_of_birth' | 'gender' | 'address' | 'country'>>
  ): Promise<{ error?: string }> => {
    if (!state.user) return { error: 'Not authenticated' };



    const userId = state.user.id;

    const { error } = await supabase
      .from('profiles')
      // @ts-ignore — Supabase generated types may lag behind schema
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      return { error: error.message || 'Failed to update profile' };
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
