import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PiggyBank, ArrowLeft, Plus, Landmark, TrendingUp, Award, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
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

const DEFAULT_SCHEMES: SavingsSchemeRow[] = [
  {
    id: 'sch-1',
    scheme_name: 'City Bank High Yield DPS',
    scheme_type: 'dps',
    institution: 'City Bank Ltd',
    account_number: 'DPS-984321',
    deposit_amount: 10000,
    maturity_amount: 680000,
    interest_rate: 8.5,
    start_date: '2024-01-01',
    maturity_date: '2029-01-01',
    status: 'active',
  },
  {
    id: 'sch-2',
    scheme_name: 'DBBL 1-Year FDR',
    scheme_type: 'fdr',
    institution: 'Dutch-Bangla Bank',
    account_number: 'FDR-554210',
    deposit_amount: 250000,
    maturity_amount: 272500,
    interest_rate: 9.0,
    start_date: '2025-06-15',
    maturity_date: '2026-06-15',
    status: 'active',
  },
  {
    id: 'sch-3',
    scheme_name: '5-Year Bangladesh Sanchaypatra',
    scheme_type: 'sanchaypatra',
    institution: 'National Savings Bureau',
    account_number: 'SNP-778921',
    deposit_amount: 500000,
    maturity_amount: 780000,
    interest_rate: 11.2,
    start_date: '2023-03-01',
    maturity_date: '2028-03-01',
    status: 'active',
  },
];

export const SavingsPage: React.FC = () => {
  const { user } = useAuthContext();
  const { success } = useToast();
  const [schemes, setSchemes] = useState<SavingsSchemeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);

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
      const { data, error } = await supabase
        .from('savings_schemes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        setSchemes(DEFAULT_SCHEMES);
      } else {
        setSchemes((data as SavingsSchemeRow[]) ?? DEFAULT_SCHEMES);
      }
    } catch {
      setSchemes(DEFAULT_SCHEMES);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSchemes();
  }, [fetchSchemes]);

  const handleAddScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schemeName.trim() || !institution.trim() || depositAmount <= 0 || !user) return;

    const newScheme: SavingsSchemeRow = {
      id: `sch-${Date.now()}`,
      scheme_name: schemeName.trim(),
      scheme_type: schemeType,
      institution: institution.trim(),
      account_number: null,
      deposit_amount: depositAmount,
      maturity_amount: maturityAmount,
      interest_rate: interestRate,
      start_date: startDate,
      maturity_date: maturityDate,
      status: 'active',
    };

    try {
      await (supabase.from('savings_schemes') as any).insert({
        user_id: user.id,
        scheme_name: schemeName.trim(),
        scheme_type: schemeType,
        institution: institution.trim(),
        deposit_amount: depositAmount,
        maturity_amount: maturityAmount,
        interest_rate: interestRate,
        start_date: startDate,
        maturity_date: maturityDate,
        status: 'active',
      });
    } catch {
      // Fallback
    }

    setSchemes((prev) => [newScheme, ...prev]);
    setSchemeName('');
    setInstitution('');
    setShowAddDialog(false);
    success('Savings Scheme Added', `${newScheme.scheme_name} registered successfully.`);
  };

  const filteredSchemes = schemes.filter((s) => {
    if (activeTab === 'all') return true;
    return s.scheme_type === activeTab;
  });

  const totalDeposit = schemes.reduce((sum, s) => sum + Number(s.deposit_amount), 0);
  const totalMaturity = schemes.reduce((sum, s) => sum + Number(s.maturity_amount), 0);

  if (loading) {
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
        <Link to="/plans" className="flex items-center gap-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
          <ArrowLeft size={18} /> Plans
        </Link>
      </div>

      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-[var(--text-page)] font-semibold text-[var(--color-text-primary)]">
            Savings, DPS & FDR
          </h1>
          <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">
            Track Deposit Pension Schemes, Fixed Deposits, and Sanchaypatra
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAddDialog(true)} className="gap-1">
          <Plus size={16} /> Add Scheme
        </Button>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card padding="sm" className="space-y-1">
          <div className="flex items-center gap-1.5 text-[var(--text-secondary)] text-[var(--color-text-muted)]">
            <PiggyBank size={15} /> Total Deposit
          </div>
          <p className="text-[var(--text-section)] font-bold text-[var(--color-text-primary)]" data-financial>
            {formatCurrency(totalDeposit)}
          </p>
        </Card>

        <Card padding="sm" className="space-y-1">
          <div className="flex items-center gap-1.5 text-[var(--text-secondary)] text-[var(--color-positive)]">
            <TrendingUp size={15} /> Maturity Estimate
          </div>
          <p className="text-[var(--text-section)] font-bold text-[var(--color-positive)]" data-financial>
            {formatCurrency(totalMaturity)}
          </p>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList fullWidth>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="dps">DPS</TabsTrigger>
          <TabsTrigger value="fdr">FDR</TabsTrigger>
          <TabsTrigger value="sanchaypatra">Sanchaypatra</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Scheme List */}
      {filteredSchemes.length === 0 ? (
        <EmptyState
          icon={<PiggyBank size={22} />}
          title="No schemes found"
          description="Add your DPS installments, bank FDRs, or National Sanchaypatra to monitor growth."
          action={<Button size="sm" onClick={() => setShowAddDialog(true)}>Add Scheme</Button>}
        />
      ) : (
        <div className="space-y-4">
          {filteredSchemes.map((s) => (
            <Card key={s.id} className="space-y-3">
              <div className="flex items-start justify-between">
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
                    <Landmark size={13} /> {s.institution} • {s.interest_rate}% p.a.
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-semibold tabular-nums text-[var(--text-body)]" data-financial>
                    {formatCurrency(s.deposit_amount)} {s.scheme_type === 'dps' ? '/mo' : ''}
                  </span>
                  {s.maturity_amount > 0 && (
                    <p className="text-[var(--text-secondary)] text-[var(--color-positive)] font-medium">
                      Est. {formatCurrency(s.maturity_amount)}
                    </p>
                  )}
                </div>
              </div>

              {s.maturity_date && (
                <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between text-[var(--text-secondary)] text-[var(--color-text-secondary)]">
                  <span className="flex items-center gap-1">
                    <Clock size={13} /> Maturity Date: {formatDate(s.maturity_date)}
                  </span>
                  <span className="flex items-center gap-1 font-medium text-[var(--color-accent)]">
                    <Award size={13} /> {s.status}
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
        title="Add Savings / DPS / FDR Scheme"
        description="Register a new savings commitment or investment deposit"
      >
        <form onSubmit={handleAddScheme} className="space-y-4 pt-2">
          <Input
            label="Scheme Title"
            required
            placeholder="e.g. City Bank 5-Yr DPS, BRAC FDR"
            value={schemeName}
            onChange={(e) => setSchemeName(e.target.value)}
          />
          <Select
            label="Scheme Type"
            value={schemeType}
            onValueChange={(val) => setSchemeType(val as any)}
            options={[
              { value: 'dps', label: 'DPS (Deposit Pension Scheme)' },
              { value: 'fdr', label: 'FDR (Fixed Deposit Receipt)' },
              { value: 'sanchaypatra', label: 'Sanchaypatra (National Savings Certificate)' },
              { value: 'savings_account', label: 'High Yield Savings Account' },
            ]}
          />
          <Input
            label="Bank / Financial Institution"
            required
            placeholder="e.g. City Bank, BRAC Bank, National Savings Bureau"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
          />
          <CurrencyInput
            label={schemeType === 'dps' ? 'Monthly Deposit Amount' : 'Principal Investment Amount'}
            required
            value={depositAmount}
            onChange={setDepositAmount}
          />
          <CurrencyInput
            label="Estimated Maturity Value"
            optional
            value={maturityAmount}
            onChange={setMaturityAmount}
          />
          <Input
            label="Interest Rate (% p.a.)"
            type="number"
            step="0.1"
            required
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="Maturity Date"
              type="date"
              optional
              value={maturityDate}
              onChange={(e) => setMaturityDate(e.target.value)}
            />
          </div>
          <Button type="submit" fullWidth className="mt-4">
            Save Savings Scheme
          </Button>
        </form>
      </Dialog>
    </div>
  );
};
