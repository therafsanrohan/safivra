import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Coins, ArrowLeft, Plus, Landmark, TrendingUp, Award, Clock, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { formatCurrency } from '@/lib/currency/formatter';
import { formatDate, todayString } from '@/lib/dates/formatter';
import { Card, Skeleton, EmptyState, Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Dialog } from '@/components/ui/Dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { useFeatureTranslation } from '@/hooks/useFeatureTranslation';
import { parseError } from '@/lib/errors/handler';

export interface SavingsSchemeRow {
  id: string;
  scheme_name: string;
  scheme_type: 'dps' | 'fdr' | 'savings_account' | 'sanchaypatra';
  institution: string;
  account_number: string | null;
  deposit_amount: number;
  maturity_amount: number;
  interest_rate: number;
  start_date: string;
  maturity_date: string | null;
  status: 'active' | 'matured' | 'closed';
}

export const SavingsPage: React.FC = () => {
  const { user } = useAuthContext();
  const { t } = useLanguage();
  const { loaded } = useFeatureTranslation('savings');
  const { success, error: showError } = useToast();
  const [schemes, setSchemes] = useState<SavingsSchemeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState<SavingsSchemeRow | null>(null);

  // Form State
  const [schemeName, setSchemeName] = useState('');
  const [schemeType, setSchemeType] = useState<'dps' | 'fdr' | 'savings_account' | 'sanchaypatra'>('dps');
  const [institution, setInstitution] = useState('');
  const [depositAmount, setDepositAmount] = useState(5000);
  const [maturityAmount, setMaturityAmount] = useState(350000);
  const [interestRate, setInterestRate] = useState(8.5);
  const [startDate, setStartDate] = useState(todayString());
  const [maturityDate, setMaturityDate] = useState('2030-01-01');

  const fetchSchemes = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error: fetchErr } = await supabase
        .from('savings_schemes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setSchemes((data as SavingsSchemeRow[]) ?? []);
    } catch (err) {
      showError('Failed to load schemes', parseError(err).message);
      setSchemes([]);
    } finally {
      setLoading(false);
    }
  }, [user, showError]);

  useEffect(() => {
    fetchSchemes();
  }, [fetchSchemes]);

  const handleAddScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schemeName.trim() || !institution.trim() || depositAmount <= 0 || !user) return;

    try {
      const { data, error } = await supabase.from('savings_schemes').insert({
        user_id: user.id,
        scheme_name: schemeName.trim(),
        scheme_type: schemeType,
        institution: institution.trim(),
        deposit_amount: depositAmount,
        maturity_amount: maturityAmount,
        interest_rate: interestRate,
        start_date: startDate,
        maturity_date: maturityDate || null,
        status: 'active',
      }).select().single();

      if (error) throw error;

      setSchemes((prev) => [data, ...prev]);
      setSchemeName('');
      setInstitution('');
      setDepositAmount(5000);
      setMaturityAmount(350000);
      setInterestRate(8.5);
      setStartDate(todayString());
      setMaturityDate('2030-01-01');
      setShowAddDialog(false);
      success('Savings Scheme Added', `${data.scheme_name} registered successfully.`);
    } catch (err) {
      showError('Failed to add scheme', parseError(err).message);
    }
  };

  const handleEditScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScheme || !schemeName.trim() || !institution.trim() || depositAmount <= 0 || !user) return;

    try {
      const { data, error } = await supabase.from('savings_schemes').update({
        scheme_name: schemeName.trim(),
        scheme_type: schemeType,
        institution: institution.trim(),
        deposit_amount: depositAmount,
        maturity_amount: maturityAmount,
        interest_rate: interestRate,
        start_date: startDate,
        maturity_date: maturityDate || null,
      })
      .eq('id', selectedScheme.id)
      .eq('user_id', user.id)
      .select().single();

      if (error) throw error;

      setSchemes((prev) => prev.map((s) => s.id === data.id ? data : s));
      setShowEditDialog(false);
      success('Scheme Updated', `${data.scheme_name} updated successfully.`);
    } catch (err) {
      showError('Failed to update scheme', parseError(err).message);
    }
  };

  const handleDeleteScheme = async () => {
    if (!selectedScheme || !user) return;

    try {
      const { error } = await supabase.from('savings_schemes').delete()
        .eq('id', selectedScheme.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setSchemes((prev) => prev.filter((s) => s.id !== selectedScheme.id));
      setShowDeleteDialog(false);
      success('Scheme Deleted', `${selectedScheme.scheme_name} has been removed.`);
    } catch (err) {
      showError('Failed to delete scheme', parseError(err).message);
    }
  };

  const openEdit = (s: SavingsSchemeRow) => {
    setSelectedScheme(s);
    setSchemeName(s.scheme_name);
    setSchemeType(s.scheme_type);
    setInstitution(s.institution);
    setDepositAmount(Number(s.deposit_amount));
    setMaturityAmount(Number(s.maturity_amount));
    setInterestRate(Number(s.interest_rate));
    setStartDate(s.start_date);
    setMaturityDate(s.maturity_date || '');
    setShowEditDialog(true);
  };

  const openDelete = (s: SavingsSchemeRow) => {
    setSelectedScheme(s);
    setShowDeleteDialog(true);
  };

  const filteredSchemes = schemes.filter((s) => {
    if (activeTab === 'all') return true;
    return s.scheme_type === activeTab;
  });

  const totalDeposit = schemes.reduce((sum, s) => sum + Number(s.deposit_amount), 0);
  const totalMaturity = schemes.reduce((sum, s) => sum + Number(s.maturity_amount), 0);

  if (loading || !loaded) {
    return (
      <div className="page-container pt-5 space-y-4">
        <Skeleton height={24} width={120} />
        <Skeleton height={140} />
      </div>
    );
  }

  return (
    <div className="page-container pt-4 space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <Link to="/dashboard/plans" className="flex items-center gap-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
          <ArrowLeft size={18} /> {t.savings.backToPlans}
        </Link>
      </div>

      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-[var(--text-page)] font-semibold text-[var(--color-text-primary)]">
            {t.savings.pageTitle}
          </h1>
          <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">
            {t.savings.pageSubtitle}
          </p>
        </div>
        <Button size="sm" onClick={() => {
          setSchemeName('');
          setInstitution('');
          setDepositAmount(5000);
          setMaturityAmount(350000);
          setInterestRate(8.5);
          setStartDate(todayString());
          setMaturityDate('2030-01-01');
          setShowAddDialog(true);
        }} className="gap-1">
          <Plus size={16} /> {t.savings.addScheme}
        </Button>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card padding="sm" className="space-y-1">
          <div className="flex items-center gap-1.5 text-[var(--text-secondary)] text-[var(--color-text-muted)]">
            <Coins size={15} /> {t.savings.totalDeposit}
          </div>
          <p className="text-[var(--text-section)] font-bold text-[var(--color-text-primary)]" data-financial>
            {formatCurrency(totalDeposit)}
          </p>
        </Card>

        <Card padding="sm" className="space-y-1">
          <div className="flex items-center gap-1.5 text-[var(--text-secondary)] text-[var(--color-positive)]">
            <TrendingUp size={15} /> {t.savings.maturityEstimate}
          </div>
          <p className="text-[var(--text-section)] font-bold text-[var(--color-positive)]" data-financial>
            {formatCurrency(totalMaturity)}
          </p>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList fullWidth>
          <TabsTrigger value="all">{t.savings.tabAll}</TabsTrigger>
          <TabsTrigger value="dps">{t.savings.tabDps}</TabsTrigger>
          <TabsTrigger value="fdr">{t.savings.tabFdr}</TabsTrigger>
          <TabsTrigger value="sanchaypatra">{t.savings.tabSanchaypatra}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Scheme List */}
      {filteredSchemes.length === 0 ? (
        <EmptyState
          icon={<Coins size={22} />}
          title={t.savings.noSchemes}
          description={t.savings.noSchemesDesc}
          action={<Button size="sm" onClick={() => setShowAddDialog(true)}>{t.savings.addScheme}</Button>}
        />
      ) : (
        <div className="space-y-4">
          {filteredSchemes.map((s) => (
            <Card key={s.id} className="space-y-3 relative group">
              <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(s)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors p-1" title="Edit Scheme">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => openDelete(s)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-negative)] transition-colors p-1" title="Delete Scheme">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="flex items-start justify-between pr-14">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
                      {s.scheme_name}
                    </h2>
                    <Badge variant={s.scheme_type === 'fdr' ? 'info' : s.scheme_type === 'sanchaypatra' ? 'positive' : 'warning'}>
                      {s.scheme_type.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)] flex items-center gap-1 mt-0.5">
                    <Landmark size={13} /> {s.institution} • {s.interest_rate > 0 ? `${s.interest_rate}${t.savings.profit}` : t.savings.noProfit}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-semibold tabular-nums text-[var(--text-body)]" data-financial>
                    {formatCurrency(s.deposit_amount)} {s.scheme_type === 'dps' ? t.savings.perMonth : ''}
                  </span>
                  {s.maturity_amount > 0 && (
                    <p className="text-[var(--text-secondary)] text-[var(--color-positive)] font-medium mt-1">
                      {t.savings.estimated} {formatCurrency(s.maturity_amount)}
                    </p>
                  )}
                </div>
              </div>

              {s.maturity_date && (
                <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between text-[var(--text-secondary)] text-[var(--color-text-secondary)]">
                  <span className="flex items-center gap-1">
                    <Clock size={13} /> {t.savings.maturesOn} {formatDate(s.maturity_date)}
                  </span>
                  <span className="flex items-center gap-1 font-medium text-[var(--color-accent)]">
                    <Award size={13} /> {s.status === 'active' ? t.savings.statusActive : s.status === 'matured' ? t.savings.statusMatured : t.savings.statusClosed}
                  </span>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Add Scheme Dialog */}
      <Dialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        title={t.savings.dialogTitle}
        description={t.savings.dialogDesc}
      >
        <form onSubmit={handleAddScheme} className="space-y-4 pt-2">
          <Input
            label={t.savings.schemeTitle}
            required
            placeholder={t.savings.schemeTitlePlaceholder}
            value={schemeName}
            onChange={(e) => setSchemeName(e.target.value)}
          />
          <Select
            label={t.savings.schemeType}
            value={schemeType}
            onValueChange={(val) => setSchemeType(val as any)}
            options={[
              { value: 'dps', label: t.savings.dpsLabel },
              { value: 'fdr', label: t.savings.fdrLabel },
              { value: 'sanchaypatra', label: t.savings.sanchaypataLabel },
              { value: 'savings_account', label: t.savings.savingsLabel },
            ]}
          />
          <Input
            label={t.savings.institution}
            required
            placeholder={t.savings.institutionPlaceholder}
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
          />
          <CurrencyInput
            label={schemeType === 'dps' ? t.savings.monthlyDeposit : t.savings.principalAmount}
            required
            value={depositAmount}
            onChange={setDepositAmount}
          />
          <CurrencyInput
            label={t.savings.maturityValue}
            optional
            value={maturityAmount}
            onChange={setMaturityAmount}
          />
          <Input
            label={t.savings.interestRate}
            type="number"
            step="0.1"
            required
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t.savings.startDate}
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label={t.savings.maturityDate}
              type="date"
              optional
              value={maturityDate}
              onChange={(e) => setMaturityDate(e.target.value)}
            />
          </div>
          <Button type="submit" fullWidth className="mt-4">
            {t.savings.saveScheme}
          </Button>
        </form>
      </Dialog>
      
      {/* Edit Scheme Dialog */}
      <Dialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        title="Edit Savings Scheme"
        description="Update your savings scheme details"
      >
        <form onSubmit={handleEditScheme} className="space-y-4 pt-2">
          <Input
            label={t.savings.schemeTitle}
            required
            value={schemeName}
            onChange={(e) => setSchemeName(e.target.value)}
          />
          <Select
            label={t.savings.schemeType}
            value={schemeType}
            onValueChange={(val) => setSchemeType(val as any)}
            options={[
              { value: 'dps', label: t.savings.dpsLabel },
              { value: 'fdr', label: t.savings.fdrLabel },
              { value: 'sanchaypatra', label: t.savings.sanchaypataLabel },
              { value: 'savings_account', label: t.savings.savingsLabel },
            ]}
          />
          <Input
            label={t.savings.institution}
            required
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
          />
          <CurrencyInput
            label={schemeType === 'dps' ? t.savings.monthlyDeposit : t.savings.principalAmount}
            required
            value={depositAmount}
            onChange={setDepositAmount}
          />
          <CurrencyInput
            label={t.savings.maturityValue}
            optional
            value={maturityAmount}
            onChange={setMaturityAmount}
          />
          <Input
            label={t.savings.interestRate}
            type="number"
            step="0.1"
            required
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t.savings.startDate}
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label={t.savings.maturityDate}
              type="date"
              optional
              value={maturityDate}
              onChange={(e) => setMaturityDate(e.target.value)}
            />
          </div>
          <Button type="submit" fullWidth className="mt-4">
            Update Scheme
          </Button>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Scheme"
        description="Are you sure you want to delete this savings scheme? This action cannot be undone."
      >
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[var(--color-border)]">
          <Button type="button" variant="outline" onClick={() => setShowDeleteDialog(false)} className="flex-1">
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={handleDeleteScheme} className="flex-1">
            Delete Scheme
          </Button>
        </div>
      </Dialog>
    </div>
  );
};
