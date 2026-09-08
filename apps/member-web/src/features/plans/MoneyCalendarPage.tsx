import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { isFeatureEnabled } from '@/lib/flags';
import { formatCurrency } from '@/lib/currency/formatter';
import { Card, Skeleton, Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { fetchFinanceData, FinanceDataState } from '@/lib/api/financeEngineClient';
import { CalendarEventOccurrence, PaymentStatus } from '../../../../../packages/finance-engine/src';
import { LinkTransactionModal } from './LinkTransactionModal';
import { AddCalendarEventModal } from './AddCalendarEventModal';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Link2,
  CheckCircle, AlertCircle, Clock, List, Grid, Filter, RefreshCw, XCircle
} from 'lucide-react';

export const MoneyCalendarPage: React.FC = () => {
  const { user } = useAuthContext();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const isEnabled = isFeatureEnabled('money_calendar_enabled', user?.id);

  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth() + 1); // 1-12
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');

  // Filters
  const [filterEventType, setFilterEventType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAccountId, setFilterAccountId] = useState<string>('all');

  const [dataState, setDataState] = useState<FinanceDataState | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedOccurrence, setSelectedOccurrence] = useState<CalendarEventOccurrence | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate Month Range
  const monthStartStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
  const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();
  const monthEndStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${lastDayOfMonth.toString().padStart(2, '0')}`;

  const loadData = useCallback(async () => {
    if (!user) return;
    const res = await fetchFinanceData({
      userId: user.id,
      todayDate: todayStr,
      horizonConfig: {
        type: 'custom',
        endDate: monthEndStr,
        startDate: monthStartStr,
      },
    });
    setDataState(res);
  }, [user, todayStr, monthStartStr, monthEndStr]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!user) return null;

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleToday = () => {
    const d = new Date();
    setCurrentYear(d.getFullYear());
    setCurrentMonth(d.getMonth() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Filter Occurrences
  const occurrences = (dataState?.calendarOccurrences || []).filter((occ) => {
    if (filterEventType !== 'all' && occ.event_type !== filterEventType) return false;
    if (filterStatus !== 'all' && occ.status !== filterStatus) return false;
    if (filterAccountId !== 'all' && occ.account_id !== filterAccountId) return false;
    return true;
  });

  // Group by Date for Month Grid
  const occurrencesByDate = new Map<string, CalendarEventOccurrence[]>();
  for (const occ of occurrences) {
    if (!occurrencesByDate.has(occ.due_date)) {
      occurrencesByDate.set(occ.due_date, []);
    }
    occurrencesByDate.get(occ.due_date)!.push(occ);
  }

  // Handle Skip occurrence
  const handleSkipOccurrence = async (occ: CalendarEventOccurrence) => {
    try {
      if (occ.source_id && occ.id.includes(':')) {
        // Recurring template occurrence
        const [templateId, dateStr] = occ.id.split(':');
        const { error } = await (supabase.from('occurrence_overrides') as any).upsert({
          user_id: user.id,
          template_id: templateId,
          occurrence_date: dateStr,
          status: 'skipped',
        });
        if (error) throw error;
      } else {
        // Custom event
        const { error } = await (supabase.from('calendar_events') as any)
          .update({ status: 'skipped' })
          .eq('id', occ.id)
          .eq('user_id', user.id);
        if (error) throw error;
      }

      success('Occurrence skipped', 'Event marked as skipped.');
      loadData();
    } catch (err: any) {
      showError('Error skipping event', err.message);
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'paid':
        return <Badge variant="positive">Paid</Badge>;
      case 'partially_paid':
        return <Badge variant="warning">Partially Paid</Badge>;
      case 'overdue':
        return <Badge variant="negative">Overdue</Badge>;
      case 'due_today':
        return <Badge variant="info">Due Today</Badge>;
      case 'skipped':
        return <Badge variant="neutral">Skipped</Badge>;
      default:
        return <Badge variant="neutral">Upcoming</Badge>;
    }
  };

  // Build Calendar Days Grid Matrix
  const firstDayIndex = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0 = Sun
  const totalDays = lastDayOfMonth;
  const calendarDays: Array<{ dateStr: string; dayNum: number; isCurrentMonth: boolean }> = [];

  // Padding prev month
  const prevMonthLastDay = new Date(currentYear, currentMonth - 1, 0).getDate();
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    const pMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const pYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const dateStr = `${pYear}-${pMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    calendarDays.push({ dateStr, dayNum: day, isCurrentMonth: false });
  }

  // Current month days
  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    calendarDays.push({ dateStr, dayNum: d, isCurrentMonth: true });
  }

  const selectedDayOccurrences = occurrencesByDate.get(selectedDate) || [];

  return (
    <div className="page-container pt-5 space-y-6 fade-in pb-12">
      {/* Header & Controls */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[var(--text-page)] font-semibold text-[var(--color-text-primary)]">
              {t.moneyCalendar.title}
            </h1>
            {!isEnabled && <Badge variant="warning">Rollout Preview</Badge>}
          </div>
          <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)] mt-0.5">
            {t.moneyCalendar.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToday} className="text-xs">
            Today
          </Button>

          <div className="flex items-center border border-[var(--color-border)] rounded-[var(--radius-button)] bg-[var(--color-bg-surface)] p-0.5">
            <button
              onClick={handlePrevMonth}
              className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              aria-label="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 text-xs font-semibold text-[var(--color-text-primary)] w-32 text-center">
              {new Date(currentYear, currentMonth - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              aria-label="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex items-center border border-[var(--color-border)] rounded-[var(--radius-button)] bg-[var(--color-bg-surface)] p-0.5">
            <button
              onClick={() => setViewMode('month')}
              className={`p-1.5 rounded text-xs flex items-center gap-1 font-medium ${
                viewMode === 'month' ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)]'
              }`}
            >
              <Grid size={14} /> Month
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`p-1.5 rounded text-xs flex items-center gap-1 font-medium ${
                viewMode === 'agenda' ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)]'
              }`}
            >
              <List size={14} /> Agenda
            </button>
          </div>

          <Button size="sm" onClick={() => setShowAddModal(true)} className="gap-1.5 text-xs">
            <Plus size={14} /> Add Event
          </Button>
        </div>
      </header>

      {/* Filter Toolbar */}
      <Card className="p-3 bg-[var(--color-bg-surface)] border-[var(--color-border)] flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1 text-[var(--color-text-muted)] font-medium">
          <Filter size={14} /> Filters:
        </div>

        <Select
          value={filterEventType}
          onValueChange={setFilterEventType}
          className="text-xs py-1 w-36"
          options={[
            { value: 'all', label: 'Type: All' },
            { value: 'income', label: 'Type: Income' },
            { value: 'bill', label: 'Type: Bills' },
            { value: 'loan', label: 'Type: Loans' },
            { value: 'card', label: 'Type: Credit Cards' },
          ]}
        />

        <Select
          value={filterStatus}
          onValueChange={setFilterStatus}
          className="text-xs py-1 w-36"
          options={[
            { value: 'all', label: 'Status: All' },
            { value: 'upcoming', label: 'Status: Upcoming' },
            { value: 'due_today', label: 'Status: Due Today' },
            { value: 'overdue', label: 'Status: Overdue' },
            { value: 'paid', label: 'Status: Paid' },
            { value: 'skipped', label: 'Status: Skipped' },
          ]}
        />

        <Select
          value={filterAccountId}
          onValueChange={setFilterAccountId}
          className="text-xs py-1 w-44"
          options={[
            { value: 'all', label: 'Account: All' },
            ...(dataState?.accounts || []).map((a) => ({ value: a.id, label: a.name })),
          ]}
        />
      </Card>

      {/* Loading state */}
      {!dataState || dataState.loading ? (
        <Skeleton height={400} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Grid or Agenda View */}
          <div className="lg:col-span-2">
            {viewMode === 'month' ? (
              <Card className="p-4 border-[var(--color-border)] space-y-3 bg-[var(--color-bg-surface)]">
                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-[var(--color-text-muted)] border-b border-[var(--color-border)] pb-2">
                  <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, idx) => {
                    const dayEvents = occurrencesByDate.get(day.dateStr) || [];
                    const isSelected = selectedDate === day.dateStr;
                    const isToday = day.dateStr === todayStr;

                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedDate(day.dateStr)}
                        className={`min-h-[70px] sm:min-h-[85px] p-1.5 rounded-lg border transition-colors cursor-pointer flex flex-col justify-between ${
                          !day.isCurrentMonth
                            ? 'opacity-30 bg-[var(--color-bg-subtle)] border-transparent'
                            : isSelected
                            ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
                            : isToday
                            ? 'border-[var(--color-accent)] bg-[var(--color-bg-surface)]'
                            : 'border-[var(--color-border)] bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-subtle)]'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span
                            className={`text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center ${
                              isToday
                                ? 'bg-[var(--color-accent)] text-white'
                                : 'text-[var(--color-text-primary)]'
                            }`}
                          >
                            {day.dayNum}
                          </span>

                          {dayEvents.length > 0 && (
                            <span className="text-[10px] font-bold text-[var(--color-text-muted)]">
                              {dayEvents.length}
                            </span>
                          )}
                        </div>

                        {/* Event badges */}
                        <div className="space-y-1 overflow-hidden mt-1">
                          {dayEvents.slice(0, 2).map((ev) => (
                            <div
                              key={ev.id}
                              className={`px-1 py-0.5 rounded text-[9px] font-medium truncate ${
                                ev.event_type === 'income'
                                  ? 'bg-[var(--color-positive-soft)] text-[var(--color-positive)]'
                                  : ev.status === 'overdue'
                                  ? 'bg-[var(--color-negative-soft)] text-[var(--color-negative)] font-bold'
                                  : 'bg-[var(--color-bg-subtle)] text-[var(--color-text-primary)] border border-[var(--color-border)]'
                              }`}
                            >
                              {ev.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-[9px] text-[var(--color-text-muted)] font-medium">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ) : (
              /* Agenda View */
              <Card className="p-4 border-[var(--color-border)] space-y-3 bg-[var(--color-bg-surface)]">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Agenda List ({occurrences.length} events)
                </h3>
                {occurrences.length === 0 ? (
                  <p className="text-xs text-[var(--color-text-muted)] italic py-8 text-center">
                    No events scheduled for the selected filters.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {occurrences.map((occ) => (
                      <div
                        key={occ.id}
                        onClick={() => setSelectedDate(occ.due_date)}
                        className={`p-3 rounded-lg border flex justify-between items-center text-xs cursor-pointer transition-colors ${
                          selectedDate === occ.due_date
                            ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
                            : 'border-[var(--color-border)] bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-subtle)]'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[var(--color-text-muted)]">{occ.due_date}</span>
                            <span className="font-semibold text-[var(--color-text-primary)]">{occ.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(occ.status)}
                            {occ.is_estimated && <span className="text-[10px] text-[var(--color-text-muted)]">(Estimated)</span>}
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`font-bold ${
                              occ.event_type === 'income' ? 'text-[var(--color-positive)]' : 'text-[var(--color-text-primary)]'
                            }`}
                          >
                            {occ.event_type === 'income' ? '+' : '−'}
                            {formatCurrency(occ.amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Selected Day Details Panel */}
          <div>
            <Card className="p-4 border-[var(--color-border)] space-y-4 bg-[var(--color-bg-surface)] sticky top-6">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                    <CalendarIcon size={16} className="text-[var(--color-accent)]" />
                    Selected Day
                  </h3>
                  <span className="text-xs font-mono text-[var(--color-text-muted)]">{selectedDate}</span>
                </div>
                <Button size="sm" variant="outline" onClick={() => setShowAddModal(true)} className="text-xs h-7 gap-1">
                  <Plus size={12} /> Add
                </Button>
              </div>

              {selectedDayOccurrences.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <p className="text-xs text-[var(--color-text-muted)]">No financial events scheduled on this day.</p>
                  <Button size="sm" variant="outline" onClick={() => setShowAddModal(true)} className="text-xs">
                    Create Planning Event
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayOccurrences.map((occ) => (
                    <div key={occ.id} className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-subtle)] space-y-2 text-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-semibold text-[var(--color-text-primary)] block">{occ.title}</span>
                          <span className="text-[10px] text-[var(--color-text-muted)] uppercase">{occ.event_type}</span>
                        </div>
                        <span
                          className={`font-bold ${
                            occ.event_type === 'income' ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]'
                          }`}
                        >
                          {formatCurrency(occ.amount)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        {getStatusBadge(occ.status)}
                        {occ.amount_paid > 0 && (
                          <span className="text-[10px] text-[var(--color-positive)] font-medium">
                            Paid: {formatCurrency(occ.amount_paid)}
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-2 border-t border-[var(--color-border)]">
                        {occ.status !== 'paid' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedOccurrence(occ);
                                setShowLinkModal(true);
                              }}
                              className="text-[10px] h-7 gap-1 flex-1"
                            >
                              <Link2 size={12} /> Link Tx
                            </Button>

                            <Button
                              size="sm"
                              onClick={() => {
                                navigate(`/dashboard/activity/add?type=expense&amount=${occ.remaining_amount}&title=${encodeURIComponent(occ.title)}`);
                              }}
                              className="text-[10px] h-7 gap-1 flex-1"
                            >
                              Record Payment
                            </Button>
                          </>
                        )}

                        {occ.status !== 'skipped' && occ.status !== 'paid' && (
                          <button
                            onClick={() => handleSkipOccurrence(occ)}
                            className="text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-negative)] transition-colors p-1"
                            title="Skip this occurrence"
                          >
                            <XCircle size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Add Custom Calendar Event Modal */}
      {dataState && (
        <AddCalendarEventModal
          open={showAddModal}
          onOpenChange={setShowAddModal}
          userId={user.id}
          accounts={dataState.accounts}
          defaultDate={selectedDate}
          onRefresh={loadData}
        />
      )}

      {/* Link Transaction Modal */}
      <LinkTransactionModal
        open={showLinkModal}
        onOpenChange={setShowLinkModal}
        userId={user.id}
        occurrence={selectedOccurrence}
        onRefresh={loadData}
      />
    </div>
  );
};
