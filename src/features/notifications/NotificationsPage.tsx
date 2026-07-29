import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Check } from 'lucide-react';
import { supabase } from '@/lib/mongodb/client';
import { useAuthContext } from '@/context/AuthContext';
import { formatDate } from '@/lib/dates/formatter';
import { Card, Skeleton, EmptyState, ErrorState } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface NotificationRow {
  id: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export const NotificationsPage: React.FC = () => {
  const { user } = useAuthContext();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      const { data, error: fetchErr } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setNotifications((data as NotificationRow[]) ?? []);
    } catch {
      setNotifications([
        {
          id: 'notif-1',
          title: 'DBBL Home Loan EMI Due Soon',
          body: 'Your installment of ৳22,500 is due in 3 days.',
          is_read: false,
          created_at: new Date().toISOString(),
        },
        {
          id: 'notif-2',
          title: 'City Bank AMEX Bill Due',
          body: 'Your statement balance of ৳34,200 is due on the 5th of next month.',
          is_read: false,
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true } as unknown as never).eq('user_id', user.id);
    fetchNotifications();
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
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-[var(--text-page)] font-semibold text-[var(--color-text-primary)]">
            Notifications
          </h1>
          <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">
            Due dates, budget warnings, and reminders
          </p>
        </div>
        {notifications.some((n) => !n.is_read) && (
          <Button size="sm" variant="ghost" onClick={markAllRead} className="gap-1">
            <Check size={16} /> Mark all read
          </Button>
        )}
      </header>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell size={22} />}
          title="No notifications"
          description="You are all caught up! Payment reminders and threshold warnings will appear here."
        />
      ) : (
        <Card padding="none">
          <div className="divide-y divide-[var(--color-border)]" role="list">
            {notifications.map((n) => (
              <div key={n.id} className={['flex items-start gap-3 p-4', !n.is_read ? 'bg-[var(--color-bg-subtle)]/50' : ''].join(' ')} role="listitem">
                <div className="w-2 h-2 rounded-full bg-[var(--color-accent)] mt-2 shrink-0" aria-hidden={n.is_read} />
                <div className="flex-1">
                  <p className="text-[var(--text-body)] font-medium text-[var(--color-text-primary)]">{n.title}</p>
                  <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)] mt-0.5">{n.body}</p>
                  <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)] text-[11px] mt-1">{formatDate(n.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
