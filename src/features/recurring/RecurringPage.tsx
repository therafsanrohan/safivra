import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { formatCurrency } from '@/lib/currency/formatter';
import { formatDate, todayString } from '@/lib/dates/formatter';
import { Card, Skeleton, EmptyState, Badge, Switch } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Dialog } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';
import { parseError } from '@/lib/errors/handler';

interface RecurringRow {
  id: string;
  name: string;
  transaction_type: 'expense' | 'income';
  amount: number;
  frequency: string;
  next_occurrence: string;
  is_active: boolean;
  account_id: string;
  category_id?: string | null;
  auto_post: boolean;
  financial_accounts?: { name: string } | null;
  transaction_categories?: { name: string } | null;
}

const getMockRecurring = (lang: string): RecurringRow[] => [
  {
    id: 'rec-1',
    name: lang === 'bn' ? 'বাড়ি ভাড়া (গুলশান)' : 'House Rent (Gulshan)',
    transaction_type: 'expense',
    amount: 45000,
    frequency: 'monthly',
    next_occurrence: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    is_active: true,
    account_id: '',
    auto_post: false,
  },
  {
    id: 'rec-2',
    name: lang === 'bn' ? 'ফাইবার ইন্টারনেট ১০০ এমবিপিএস (ডটইন্টারনেট)' : 'Fiber Internet 100Mbps (DotInternet)',
    transaction_type: 'expense',
    amount: 1500,
    frequency: 'monthly',
    next_occurrence: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
    is_active: true,
    account_id: '',
    auto_post: false,
  },
  {
    id: 'rec-3',
    name: lang === 'bn' ? 'মাসিক বেতন ক্রেডিট' : 'Monthly Salary Credit',
    transaction_type: 'income',
    amount: 185000,
    frequency: 'monthly',
    next_occurrence: new Date(Date.now() + 25 * 86400000).toISOString().split('T')[0],
    is_active: true,
    account_id: '',
    auto_post: false,
  },
];

export const RecurringPage: React.FC = () => {
  const { user } = useAuthContext();
  const { t, locale } = useLanguage();
  const { success, error: showError } = useToast();
  const [items, setItems] = useState<RecurringRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Reference Data
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string }>>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; category_type: string }>>([]);

  // Form State
  const [name, setName] = useState('');
  const [amount, setAmount] = useState(1500);
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [frequency, setFrequency] = useState('monthly');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [nextDate, setNextDate] = useState(todayString());
  const [autoPost, setAutoPost] = useState(false);

  const fetchRecurring = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error: fetchErr } = await (supabase.from('recurring_templates') as any)
        .select(`
          id,
          name,
          transaction_type,
          amount,
          frequency,
          next_occurrence,
          is_active,
          account_id,
          category_id,
          auto_post,
          financial_accounts (name),
          transaction_categories (name)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('next_occurrence', { ascending: true });

      if (fetchErr) throw fetchErr;

      if (!data || data.length === 0) {
        setItems(getMockRecurring(locale));
      } else {
        setItems(data as unknown as RecurringRow[]);
      }
    } catch (err) {
      showError('Could not load recurring commitments', parseError(err).message);
      setItems(getMockRecurring(locale));
    } finally {
      setLoading(false);
    }
  }, [user, locale, showError]);

  useEffect(() => {
    fetchRecurring();
  }, [fetchRecurring]);

  // Fetch accounts & categories for the add form
  useEffect(() => {
    if (!user) return;

    (supabase.from('financial_accounts') as any)
      .select('id, name')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .then(({ data }: any) => {
        if (data) {
          setAccounts(data);
          if (data.length > 0) {
            setAccountId(data[0].id);
          }
        }
      });

    (supabase.from('transaction_categories') as any)
      .select('id, name, category_type')
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }: any) => {
        if (data) {
          setCategories(data);
        }
      });
  }, [user]);

  const handleTypeChange = (newType: string) => {
    setType(newType as 'expense' | 'income');
    setCategoryId('');
  };

  const handleAddRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || amount <= 0 || !user || !accountId) return;

    try {
      const { data, error: insertErr } = await (supabase.from('recurring_templates') as any)
        .insert({
          user_id: user.id,
          name: name.trim(),
          transaction_type: type,
          amount,
          frequency,
          start_date: todayString(),
          next_occurrence: nextDate,
          reminder_days: 3,
          is_active: true,
          account_id: accountId,
          category_id: categoryId || null,
          auto_post: autoPost,
        })
        .select(`
          id,
          name,
          transaction_type,
          amount,
          frequency,
          next_occurrence,
          is_active,
          account_id,
          category_id,
          auto_post,
          financial_accounts (name),
          transaction_categories (name)
        `)
        .single();

      if (insertErr) throw insertErr;

      if (data) {
        setItems((prev) => {
          // Remove mock items if any
          const realItems = prev.filter((item) => !item.id.startsWith('rec-'));
          return [...realItems, data as unknown as RecurringRow];
        });
      }

      setName('');
      setAmount(1500);
      setCategoryId('');
      setAutoPost(false);
      setShowAddDialog(false);
      success(
        t.recurring.toastAdded,
        t.recurring.toastAddedDesc
          .replace('{name}', name.trim())
          .replace('{amount}', formatCurrency(amount))
      );
    } catch (err) {
      showError('Could not save commitment', parseError(err).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t.recurring.deleteConfirm)) return;

    if (id.startsWith('rec-')) {
      setItems((prev) => prev.filter((item) => item.id !== id));
      success(t.recurring.toastDeleted, t.recurring.toastDeletedDesc);
      return;
    }

    try {
      const { error: delErr } = await (supabase.from('recurring_templates') as any)
        .update({ is_active: false })
        .eq('id', id);

      if (delErr) throw delErr;

      setItems((prev) => prev.filter((item) => item.id !== id));
      success(t.recurring.toastDeleted, t.recurring.toastDeletedDesc);
    } catch (err) {
      showError('Could not delete item', parseError(err).message);
    }
  };

  const filteredCategories = categories.filter((c) => c.category_type === type);

  if (loading) {
    return (
      <div className="page-container pt-5 space-y-4">
        <Skeleton height={24} width={100} />
        <Skeleton height={140} />
      </div>
    );
  }

  return (
    <div className="page-container pt-4 space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <Link to="/plans" className="flex items-center gap-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
          <ArrowLeft size={18} /> {t.recurring.backToPlans}
        </Link>
      </div>

      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-[var(--text-page)] font-semibold text-[var(--color-text-primary)]">
            {t.recurring.pageTitle}
          </h1>
          <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">
            {t.recurring.pageSubtitle}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAddDialog(true)} className="gap-1">
          <Plus size={16} /> {t.recurring.addRecurring}
        </Button>
      </header>

      {items.length === 0 ? (
        <EmptyState
          icon={<RefreshCw size={22} />}
          title={t.recurring.noCommitments}
          description={t.recurring.noCommitmentsDesc}
          action={<Button size="sm" onClick={() => setShowAddDialog(true)}>{t.recurring.addItem}</Button>}
        />
      ) : (
        <Card padding="none">
          <div className="divide-y divide-[var(--color-border)]" role="list">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-5 py-3.5 group" role="listitem">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[var(--text-body)] font-medium text-[var(--color-text-primary)]">
                      {item.name}
                    </p>
                    <Badge variant={item.transaction_type === 'income' ? 'positive' : 'neutral'}>
                      {item.frequency === 'monthly' ? t.recurring.monthly : item.frequency === 'weekly' ? t.recurring.weekly : item.frequency === 'yearly' ? t.recurring.yearly : item.frequency}
                    </Badge>
                    {item.auto_post && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-accent-soft)] text-[var(--color-accent)] font-semibold">
                        {t.recurring.autoPostLabel}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[var(--text-secondary)] text-[var(--color-text-muted)] text-[13px]">
                    <span>{t.recurring.nextDue}: {formatDate(item.next_occurrence)}</span>
                    {item.financial_accounts?.name && (
                      <>
                        <span>•</span>
                        <span className="text-[11px] px-1.5 py-0.25 rounded bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)]">
                          {item.financial_accounts.name}
                        </span>
                      </>
                    )}
                    {item.transaction_categories?.name && (
                      <>
                        <span>•</span>
                        <span className="text-[11px] px-1.5 py-0.25 rounded bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)]">
                          {item.transaction_categories.name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={['font-semibold tabular-nums text-[var(--text-body)]', item.transaction_type === 'income' ? 'text-[var(--color-positive)]' : 'text-[var(--color-text-primary)]'].join(' ')} data-financial>
                    {item.transaction_type === 'income' ? '+' : ''}{formatCurrency(Number(item.amount))}
                  </span>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1 rounded-[var(--radius-button)] text-[var(--color-text-muted)] hover:text-[var(--color-negative)] hover:bg-[var(--color-bg-subtle)] transition-colors"
                    aria-label="Delete commitment"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Add Recurring Dialog */}
      <Dialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        title={t.recurring.dialogTitle}
        description={t.recurring.dialogDesc}
      >
        {accounts.length === 0 ? (
          <div className="space-y-4 py-4 text-center">
            <p className="text-[var(--text-body)] text-[var(--color-text-secondary)] leading-relaxed">
              {t.recurring.noAccountWarning}
            </p>
            <Link to="/accounts/add" onClick={() => setShowAddDialog(false)} className="block">
              <Button fullWidth>{t.recurring.createAccountBtn}</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleAddRecurring} className="space-y-4 pt-2">
            <Input
              label={t.recurring.titleLabel}
              required
              placeholder={t.recurring.titlePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            
            <CurrencyInput
              label={t.recurring.amountLabel}
              required
              value={amount}
              onChange={setAmount}
            />

            <Select
              label={t.recurring.typeLabel}
              value={type}
              onValueChange={handleTypeChange}
              options={[
                { value: 'expense', label: t.recurring.expense },
                { value: 'income', label: t.recurring.income },
              ]}
            />

            <Select
              label={t.recurring.frequencyLabel}
              value={frequency}
              onValueChange={setFrequency}
              options={[
                { value: 'weekly', label: t.recurring.weekly },
                { value: 'monthly', label: t.recurring.monthly },
                { value: 'yearly', label: t.recurring.yearly },
              ]}
            />

            <Select
              label={t.recurring.accountLabel}
              value={accountId}
              onValueChange={setAccountId}
              options={accounts.map((acc) => ({ value: acc.id, label: acc.name }))}
              required
            />

            {filteredCategories.length > 0 && (
              <Select
                label={t.recurring.categoryLabel}
                value={categoryId}
                onValueChange={setCategoryId}
                options={[
                  { value: '', label: 'None' },
                  ...filteredCategories.map((cat) => ({ value: cat.id, label: cat.name }))
                ]}
                optional
              />
            )}

            <Input
              label={t.recurring.nextDueLabel}
              type="date"
              required
              value={nextDate}
              onChange={(e) => setNextDate(e.target.value)}
            />

            <Switch
              label={t.recurring.autoPostLabel}
              description={t.recurring.autoPostDesc}
              checked={autoPost}
              onCheckedChange={setAutoPost}
            />

            <Button type="submit" fullWidth className="mt-4">
              {t.recurring.saveCommitment}
            </Button>
          </form>
        )}
      </Dialog>
    </div>
  );
};
