import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Check, Trash2, Info, ExternalLink, Megaphone, Landmark, CreditCard, Target, Coins, RefreshCw, HandHeart, BarChart3, Shield, Wallet, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  category?: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  action_url?: string;
  dismissed_at?: string;
}

// ─── Category Configuration ────────────────────────────────────────────────────
const CATEGORY_META: Record<string, { icon: React.ElementType; color: string; bg: string; label: string; labelBn: string }> = {
  dps:               { icon: Coins,       color: 'text-emerald-600 dark:text-emerald-400',  bg: 'bg-emerald-500/10',  label: 'DPS',           labelBn: 'ডিপিএস' },
  fdr:               { icon: Landmark,    color: 'text-blue-600 dark:text-blue-400',         bg: 'bg-blue-500/10',     label: 'FDR',           labelBn: 'এফডিআর' },
  savings_goals:     { icon: Target,      color: 'text-violet-600 dark:text-violet-400',     bg: 'bg-violet-500/10',   label: 'Goals',         labelBn: 'লক্ষ্য' },
  loans:             { icon: Landmark,    color: 'text-orange-600 dark:text-orange-400',     bg: 'bg-orange-500/10',   label: 'Loan',          labelBn: 'ঋণ' },
  credit_cards:      { icon: CreditCard,  color: 'text-rose-600 dark:text-rose-400',         bg: 'bg-rose-500/10',     label: 'Card',          labelBn: 'কার্ড' },
  salary:            { icon: Wallet,      color: 'text-cyan-600 dark:text-cyan-400',         bg: 'bg-cyan-500/10',     label: 'Salary',        labelBn: 'বেতন' },
  budget:            { icon: Filter,      color: 'text-yellow-600 dark:text-yellow-400',     bg: 'bg-yellow-500/10',   label: 'Budget',        labelBn: 'বাজেট' },
  real_wealth:       { icon: BarChart3,   color: 'text-indigo-600 dark:text-indigo-400',     bg: 'bg-indigo-500/10',   label: 'Wealth',        labelBn: 'সম্পদ' },
  zakat:             { icon: HandHeart,   color: 'text-teal-600 dark:text-teal-400',         bg: 'bg-teal-500/10',     label: 'Zakat',         labelBn: 'যাকাত' },
  admin_announcement:{ icon: Megaphone,   color: 'text-pink-600 dark:text-pink-400',         bg: 'bg-pink-500/10',     label: 'Announcement',  labelBn: 'ঘোষণা' },
  security:          { icon: Shield,      color: 'text-red-600 dark:text-red-400',            bg: 'bg-red-500/10',      label: 'Security',      labelBn: 'নিরাপত্তা' },
  financial_reminder:{ icon: Bell,        color: 'text-[var(--color-accent)]',               bg: 'bg-[var(--color-accent-soft)]', label: 'Reminder', labelBn: 'স্মরণ' },
  recurring:         { icon: RefreshCw,   color: 'text-slate-600 dark:text-slate-400',       bg: 'bg-slate-500/10',    label: 'Recurring',     labelBn: 'পুনরাবৃত্তি' },
};

const DEFAULT_CATEGORY = CATEGORY_META['financial_reminder'];

function getCategoryMeta(category?: string) {
  return category && CATEGORY_META[category] ? CATEGORY_META[category] : DEFAULT_CATEGORY;
}

// ─── Priority Badge ────────────────────────────────────────────────────────────
function PriorityBadge({ priority, isBn }: { priority?: string; isBn: boolean }) {
  if (!priority || priority === 'normal' || priority === 'low') return null;
  const isHigh = priority === 'high';
  const isCritical = priority === 'critical';
  return (
    <span
      className={[
        'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide',
        isCritical ? 'bg-red-500/15 text-red-600 dark:text-red-400' : 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
      ].join(' ')}
    >
      {isCritical ? (isBn ? 'জরুরি' : 'Critical') : (isBn ? 'গুরুত্বপূর্ণ' : 'High')}
    </span>
  );
}

// ─── Filter Tabs ───────────────────────────────────────────────────────────────
type FilterMode = 'all' | 'unread';

export const NotificationsPage: React.FC = () => {
  const { user } = useAuthContext();
  const { locale } = useLanguage();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();
  const isBn = locale === 'bn';

  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');

  const autoPurgeOldNotifications = useCallback(async () => {
    if (!user) return;
    try {
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

  // ── Real-time subscription for new notifications ──────────────────────────
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notifications:page:${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => {
        fetchNotifications();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchNotifications]);

  const markAllRead = async () => {
    if (!user) return;
    await (supabase.from('notifications') as any).update({ is_read: true }).eq('user_id', user.id);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const markAsRead = async (id: string) => {
    if (!user) return;
    await (supabase.from('notifications') as any).update({ is_read: true }).eq('id', id).eq('user_id', user.id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
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
      const { error: delErr } = await supabase.from('notifications').delete().eq('user_id', user.id);
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
      const { error: delErr } = await supabase.from('notifications').delete().eq('id', id).eq('user_id', user.id);
      if (delErr) throw delErr;
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err: any) {
      showError(isBn ? 'মুছতে ব্যর্থ' : 'Delete failed', err.message);
    }
  };

  const handleNotificationClick = async (n: NotificationRow) => {
    if (!n.is_read) await markAsRead(n.id);
    if (n.action_url) navigate(n.action_url);
  };

  // ── Derived data ────────────────────────────────────────────────────────────
  const filtered = filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications;
  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="page-container pt-5 space-y-4">
        <Skeleton height={28} width={140} />
        <Skeleton height={140} />
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
      {/* ── Header ── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[var(--text-page)] font-semibold text-[var(--color-text-primary)]">
            {isBn ? 'বিজ্ঞপ্তি' : 'Notifications'}
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-[var(--color-negative)] text-white">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">
            {isBn ? 'পেমেন্ট রিমাইন্ডার, বাজেট সতর্কতা এবং ঘোষণা' : 'Due dates, budget warnings, and announcements'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
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

      {/* ── Filter Tabs ── */}
      {notifications.length > 0 && (
        <div className="flex gap-2">
          {(['all', 'unread'] as FilterMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              className={[
                'px-3.5 py-1.5 rounded-[var(--radius-button)] text-sm font-medium transition-all',
                filter === mode
                  ? 'bg-[var(--color-accent)] text-white shadow-sm'
                  : 'bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
              ].join(' ')}
            >
              {mode === 'all'
                ? (isBn ? 'সব' : 'All')
                : (isBn ? `অপঠিত (${unreadCount})` : `Unread (${unreadCount})`)}
            </button>
          ))}
        </div>
      )}

      {/* ── Auto-cleanup info ── */}
      <div className="flex items-center gap-2 text-xs p-3 rounded-[var(--radius-card)] bg-[var(--color-bg-subtle)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
        <Info size={14} className="shrink-0 text-[var(--color-accent)]" />
        <span>
          {isBn
            ? 'স্টোরেজ খালি রাখতে ৭ দিনের পুরনো বিজ্ঞপ্তি স্বয়ংক্রিয়ভাবে মুছে ফেলা হয়।'
            : 'Notifications older than 7 days are automatically purged to optimize storage.'}
        </span>
      </div>

      {/* ── Notification List ── */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Bell size={22} />}
          title={isBn ? 'কোনো বিজ্ঞপ্তি নেই' : (filter === 'unread' ? 'No unread notifications' : 'No notifications')}
          description={
            isBn
              ? 'আপনার সমস্ত বিজ্ঞপ্তি দেখা শেষ।'
              : filter === 'unread'
                ? 'You are all caught up!'
                : 'Payment reminders and financial alerts will appear here.'
          }
        />
      ) : (
        <Card padding="none">
          <div className="divide-y divide-[var(--color-border)]" role="list">
            {filtered.map((n) => {
              const meta = getCategoryMeta(n.category);
              const IconComponent = meta.icon;
              const isClickable = !n.is_read || !!n.action_url;

              return (
                <div
                  key={n.id}
                  className={[
                    'flex items-start gap-3 p-4 transition-colors group',
                    !n.is_read ? 'bg-[var(--color-bg-subtle)]/60' : '',
                    isClickable ? 'cursor-pointer hover:bg-[var(--color-bg-subtle)]' : '',
                  ].join(' ')}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleNotificationClick(n)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleNotificationClick(n);
                    }
                  }}
                >
                  {/* Category Icon */}
                  <div className={['w-9 h-9 rounded-[var(--radius-button)] flex items-center justify-center shrink-0 mt-0.5', meta.bg].join(' ')}>
                    <IconComponent size={17} className={meta.color} aria-hidden="true" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <p className={['text-[var(--text-body)] text-[var(--color-text-primary)] leading-snug', !n.is_read ? 'font-semibold' : 'font-medium'].join(' ')}>
                        {n.title}
                      </p>
                      <PriorityBadge priority={n.priority} isBn={isBn} />
                    </div>
                    <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)] mt-0.5 whitespace-pre-wrap break-words leading-relaxed">
                      {n.body}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)] text-[11px]">
                        {formatDate(n.created_at)}
                      </p>
                      {n.action_url && (
                        <span className="text-[11px] text-[var(--color-accent)] flex items-center gap-0.5">
                          <ExternalLink size={11} />
                          {isBn ? 'দেখুন' : 'View'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right side: unread dot + delete */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div
                      className="w-2 h-2 rounded-full bg-[var(--color-accent)] mt-1.5"
                      style={{ visibility: n.is_read ? 'hidden' : 'visible' }}
                      aria-hidden={n.is_read}
                    />
                    <button
                      onClick={(e) => deleteSingleNotification(n.id, e)}
                      title={isBn ? 'বিজ্ঞপ্তি মুছুন' : 'Delete notification'}
                      className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-50 group-hover:opacity-100"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};
