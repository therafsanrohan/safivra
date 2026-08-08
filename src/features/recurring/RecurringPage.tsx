import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, ArrowLeft, Plus, Trash2, Edit2 } from 'lucide-react';
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
import { useFeatureTranslation } from '@/hooks/useFeatureTranslation';

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

export const RecurringPage: React.FC = () => {
  const { user } = useAuthContext();
  const { t, locale } = useLanguage();
  const { loaded } = useFeatureTranslation('recurring');
  const { success, error: showError } = useToast();
  const [items, setItems] = useState<RecurringRow[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RecurringRow | null>(null);

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
        setItems([]);
      } else {
        setItems(data as unknown as RecurringRow[]);
      }
    } catch (err) {
      showError('Could not load recurring commitments', parseError(err).message);
      setItems([]);
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
        setItems((prev) => [...prev, data as unknown as RecurringRow]);
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

  const handleEditRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !name.trim() || amount <= 0 || !user || !accountId) return;

    try {
      const { data, error: updateErr } = await (supabase.from('recurring_templates') as any)
        .update({
          name: name.trim(),
          transaction_type: type,
          amount,
          frequency,
          next_occurrence: nextDate,
          account_id: accountId,
          category_id: categoryId || null,
          auto_post: autoPost,
        })
        .eq('id', selectedItem.id)
        .eq('user_id', user.id)
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

      if (updateErr) throw updateErr;

      if (data) {
        setItems((prev) => prev.map((item) => item.id === data.id ? data as unknown as RecurringRow : item));
      }

      setShowEditDialog(false);
      success('Commitment Updated', `Successfully updated ${name.trim()}.`);
    } catch (err) {
      showError('Could not update commitment', parseError(err).message);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    try {
      const { error: delErr } = await (supabase.from('recurring_templates') as any)
        .update({ is_active: false })
        .eq('id', selectedItem.id)
        .eq('user_id', user!.id);

      if (delErr) throw delErr;

      setItems((prev) => prev.filter((item) => item.id !== selectedItem.id));
      setShowDeleteDialog(false);
      success(t.recurring.toastDeleted, t.recurring.toastDeletedDesc);
    } catch (err) {
      showError('Could not delete item', parseError(err).message);
    }
  };

  const openEdit = (item: RecurringRow) => {
    setSelectedItem(item);
    setName(item.name);
    setAmount(Number(item.amount));
    setType(item.transaction_type);
    setFrequency(item.frequency);
    setAccountId(item.account_id);
    setCategoryId(item.category_id || '');
    setNextDate(item.next_occurrence);
    setAutoPost(item.auto_post);
    setShowEditDialog(true);
  };

  const openDelete = (item: RecurringRow) => {
    setSelectedItem(item);
    setShowDeleteDialog(true);
  };

  const filteredCategories = categories.filter((c) => c.category_type === type);

  if (loading || !loaded) {
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
        <Link to="/dashboard/plans" className="flex items-center gap-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
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
        <Button size="sm" onClick={() => {
          setName('');
          setAmount(1500);
          setCategoryId('');
          setNextDate(todayString());
          setAutoPost(false);
          setShowAddDialog(true);
        }} className="gap-1">
          <Plus size={16} /> {t.recurring.addRecurring}
        </Button>
      </header>

      {items.length === 0 ? (
        <EmptyState
          icon={<RefreshCw size={22} />}
          title={t.recurring.noCommitments}
          description={t.recurring.noCommitmentsDesc}
          action={<Button size="sm" onClick={() => {
            setName('');
            setAmount(1500);
            setCategoryId('');
            setNextDate(todayString());
            setAutoPost(false);
            setShowAddDialog(true);
          }}>{t.recurring.addItem}</Button>}
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
                <div className="flex items-center gap-2">
                  <span className={['font-semibold tabular-nums text-[var(--text-body)] pr-2', item.transaction_type === 'income' ? 'text-[var(--color-positive)]' : 'text-[var(--color-text-primary)]'].join(' ')} data-financial>
                    {item.transaction_type === 'income' ? '+' : ''}{formatCurrency(Number(item.amount))}
                  </span>
                  <button
                    onClick={() => openEdit(item)}
                    className="p-1 rounded-[var(--radius-button)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-bg-subtle)] transition-colors"
                    aria-label="Edit commitment"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => openDelete(item)}
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
            <Link to="/dashboard/accounts/add" onClick={() => setShowAddDialog(false)} className="block">
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

      {/* Edit Recurring Dialog */}
      <Dialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        title="Edit Commitment"
        description="Update details of your recurring commitment"
      >
        <form onSubmit={handleEditRecurring} className="space-y-4 pt-2">
          <Input
            label={t.recurring.titleLabel}
            required
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
            Update Commitment
          </Button>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Commitment"
        description="Are you sure you want to delete this recurring commitment? This action cannot be undone."
      >
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[var(--color-border)]">
          <Button type="button" variant="outline" onClick={() => setShowDeleteDialog(false)} className="flex-1">
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={handleDelete} className="flex-1">
            Delete
          </Button>
        </div>
      </Dialog>
    </div>
  );
};
