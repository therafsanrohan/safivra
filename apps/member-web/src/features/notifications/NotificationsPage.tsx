import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Check, Trash2, Info, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { formatDate } from '@/lib/dates/formatter';
import { Card, Skeleton, EmptyState, ErrorState } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

interface NotificationRow {
  id: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export const NotificationsPage: React.FC = () => {
  const { user } = useAuthContext();
  const { locale } = useLanguage();
  const { success, error: showError } = useToast();
  const isBn = locale === 'bn';

  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState('');

  const autoPurgeOldNotifications = useCallback(async () => {
    if (!user) return;
    try {
      // Auto cleanup notifications older than 7 days (1 week)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .lt('created_at', sevenDaysAgo);
    } catch (err) {
      console.warn('[NotificationAutoCleanup] Error purging old notifications:', err);
    }
  }, [user]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      await autoPurgeOldNotifications();

      const { data, error: fetchErr } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setNotifications((data as NotificationRow[]) ?? []);
    } catch (err: any) {
      setError(err?.message || (isBn ? 'বিজ্ঞপ্তি লোড করতে সমস্যা হয়েছে' : 'Could not load notifications'));
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user, autoPurgeOldNotifications, isBn]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAllRead = async () => {
    if (!user) return;
    await (supabase.from('notifications') as any).update({ is_read: true }).eq('user_id', user.id);
    fetchNotifications();
  };

  const markAsRead = async (id: string) => {
    if (!user) return;
    await (supabase.from('notifications') as any).update({ is_read: true }).eq('id', id).eq('user_id', user.id);
    fetchNotifications();
  };

  const clearAllNotifications = async () => {
    if (!user) return;
    const confirmClear = window.confirm(
      isBn 
        ? 'আপনি কি নিশ্চিত যে আপনি সব বিজ্ঞপ্তি মুছে ফেলতে চান?' 
        : 'Are you sure you want to clear all notifications?'
    );
    if (!confirmClear) return;

    setClearing(true);
    try {
      const { error: delErr } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      if (delErr) throw delErr;
      setNotifications([]);
      success(
        isBn ? 'বিজ্ঞপ্তি পরিষ্কার করা হয়েছে' : 'Notifications Cleared', 
        isBn ? 'আপনার সমস্ত বিজ্ঞপ্তি মুছে ফেলা হয়েছে।' : 'All notifications have been removed.'
      );
    } catch (err: any) {
      showError(isBn ? 'বিজ্ঞপ্তি মুছতে ব্যর্থ' : 'Failed to clear', err.message);
    } finally {
      setClearing(false);
    }
  };

  const deleteSingleNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    try {
      const { error: delErr } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (delErr) throw delErr;
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err: any) {
      showError(isBn ? 'মুছতে ব্যর্থ' : 'Delete failed', err.message);
    }
  };

  if (loading) {
    return (
      <div className="page-container pt-5 space-y-4">
        <Skeleton height={28} width={140} />
        <Skeleton height={140} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container pt-6">
        <ErrorState message={error} onRetry={fetchNotifications} />
      </div>
    );
  }

  return (
    <div className="page-container pt-5 space-y-5 fade-in">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[var(--text-page)] font-semibold text-[var(--color-text-primary)]">
            {isBn ? 'বিজ্ঞপ্তি' : 'Notifications'}
          </h1>
          <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">
            {isBn ? 'পেমেন্ট রিমাইন্ডার, বাজেট এবং ব্রডকাস্ট বার্তা' : 'Due dates, budget warnings, and announcements'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {notifications.some((n) => !n.is_read) && (
            <Button size="sm" variant="ghost" onClick={markAllRead} className="gap-1 text-xs">
              <Check size={14} /> {isBn ? 'সবগুলো পঠিত মার্ক করুন' : 'Mark all read'}
            </Button>
          )}

          {notifications.length > 0 && (
            <Button size="sm" variant="destructive" onClick={clearAllNotifications} loading={clearing} className="gap-1 text-xs">
              <Trash2 size={14} /> {isBn ? 'সব মুছে ফেলুন' : 'Clear All'}
            </Button>
          )}
        </div>
      </header>

      {/* Auto-cleanup notification info banner */}
      <div className="flex items-center gap-2 text-xs p-3 rounded-[var(--radius-card)] bg-[var(--color-bg-subtle)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
        <Info size={14} className="shrink-0 text-[var(--color-accent)]" />
        <span>
          {isBn 
            ? 'স্টোরেজ খালি রাখতে ৭ দিনের (১ সপ্তাহ) পুরনো বিজ্ঞপ্তি স্বয়ংক্রিয়ভাবে মুছে ফেলা হয়।' 
            : 'Notifications older than 7 days are automatically purged to optimize storage.'}
        </span>
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell size={22} />}
          title={isBn ? 'কোনো বিজ্ঞপ্তি নেই' : 'No notifications'}
          description={isBn ? 'আপনার সমস্ত বিজ্ঞপ্তি দেখা শেষ। নতুন কোনো পেমেন্ট রিমাইন্ডার বা নোটিশ এলে এখানে দেখাবে।' : 'You are all caught up! Payment reminders and threshold warnings will appear here.'}
        />
      ) : (
        <Card padding="none">
          <div className="divide-y divide-[var(--color-border)]" role="list">
            {notifications.map((n) => (
              <div 
                key={n.id} 
                className={[
                  'flex items-start gap-3 p-4 transition-colors group',
                  !n.is_read ? 'bg-[var(--color-bg-subtle)]/50 hover:bg-[var(--color-bg-subtle)] cursor-pointer' : 'opacity-80'
                ].join(' ')} 
                role="button"
                tabIndex={0}
                onClick={() => !n.is_read && markAsRead(n.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (!n.is_read) markAsRead(n.id);
                  }
                }}
              >
                <div className="w-2 h-2 rounded-full bg-[var(--color-accent)] mt-2 shrink-0" aria-hidden={n.is_read} style={{ visibility: n.is_read ? 'hidden' : 'visible' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[var(--text-body)] font-medium text-[var(--color-text-primary)]">{n.title}</p>
                  <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)] mt-0.5 whitespace-pre-wrap break-words">{n.body}</p>
                  <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)] text-[11px] mt-1">{formatDate(n.created_at)}</p>
                </div>
                <button
                  onClick={(e) => deleteSingleNotification(n.id, e)}
                  title={isBn ? 'বিজ্ঞপ্তি মুছুন' : 'Delete notification'}
                  className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-70 group-hover:opacity-100 shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
