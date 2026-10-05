import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface UnreadNotificationState {
  unreadCount: number;
  hasUnread: boolean;
  refresh: () => void;
}

/**
 * Provides live unread notification count for the bell badge.
 *
 * Reads from v_user_notifications unified view (merges legacy + event schema).
 * Falls back to legacy `notifications` table if view not yet deployed.
 * Uses Supabase Realtime to react instantly on both tables.
 */
export function useNotificationBell(userId: string | undefined): UnreadNotificationState {
  const [unreadCount, setUnreadCount] = useState(0);
  const channelLegacyRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const channelEventsRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchCount = useCallback(async () => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }
    try {
      // Try the unified view first
      const { count, error } = await (supabase.from('v_user_notifications') as any)
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        // Fallback to legacy table if view isn't deployed yet
        const { count: legacyCount } = await (supabase.from('notifications') as any)
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_read', false);
        setUnreadCount(legacyCount ?? 0);
        return;
      }

      setUnreadCount(count ?? 0);
    } catch {
      // Silently ignore — badge is non-critical
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    fetchCount();

    // Subscribe to legacy notifications table
    channelLegacyRef.current = supabase
      .channel(`notifications:bell:legacy:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => { fetchCount(); }
      )
      .subscribe();

    // Subscribe to new notification_events table for instant badge refresh
    channelEventsRef.current = supabase
      .channel(`notifications:bell:events:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_events',
          filter: `user_id=eq.${userId}`,
        },
        () => { fetchCount(); }
      )
      .subscribe();

    return () => {
      if (channelLegacyRef.current) {
        supabase.removeChannel(channelLegacyRef.current);
        channelLegacyRef.current = null;
      }
      if (channelEventsRef.current) {
        supabase.removeChannel(channelEventsRef.current);
        channelEventsRef.current = null;
      }
    };
  }, [userId, fetchCount]);

  return {
    unreadCount,
    hasUnread: unreadCount > 0,
    refresh: fetchCount,
  };
}
