import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface UnreadNotificationState {
  unreadCount: number;
  hasUnread: boolean;
  refresh: () => void;
}

/**
 * Provides live unread notification count for the bell badge.
 * Uses Supabase Realtime to react to new inserts instantly.
 */
export function useNotificationBell(userId: string | undefined): UnreadNotificationState {
  const [unreadCount, setUnreadCount] = useState(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchCount = useCallback(async () => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }
    try {
      const { count } = await (supabase.from('notifications') as any)
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      setUnreadCount(count ?? 0);
    } catch {
      // Silently ignore — badge is non-critical
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    fetchCount();

    // Subscribe to realtime inserts / updates for instant badge refresh
    channelRef.current = supabase
      .channel(`notifications:bell:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, fetchCount]);

  return {
    unreadCount,
    hasUnread: unreadCount > 0,
    refresh: fetchCount,
  };
}
