import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Database, ShieldCheck, Wifi, HardDrive, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useLanguage } from '@/context/LanguageContext';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export const SystemHealthPage: React.FC = () => {
  const { locale } = useLanguage();
  const isBn = locale === 'bn';

  const [dbHealthy, setDbHealthy] = useState<boolean>(true);
  const [latency, setLatency] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [lastPingTime, setLastPingTime] = useState<string>('');
  const [autoPing, setAutoPing] = useState<boolean>(true);
  const [pingHistory, setPingHistory] = useState<number[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [storageUsage, setStorageUsage] = useState<{ usedMb: string; totalMb: string } | null>(null);

  const runSystemVerification = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    const start = performance.now();

    try {
      // Direct live head check to Supabase profiles DB table
      const { error } = await supabase.from('profiles').select('id', { head: true, count: 'exact' });
      const elapsed = Math.round(performance.now() - start);
      setLatency(elapsed);

      if (error) {
        setDbHealthy(false);
        setErrorMessage(error.message);
      } else {
        setDbHealthy(true);
      }

      setLastPingTime(new Date().toLocaleTimeString());
      setPingHistory(prev => [...prev.slice(-9), elapsed]);
    } catch (err: any) {
      setDbHealthy(false);
      setErrorMessage(err?.message || 'Connection error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Storage estimation
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(estimate => {
        if (estimate.usage !== undefined && estimate.quota !== undefined) {
          setStorageUsage({
            usedMb: (estimate.usage / (1024 * 1024)).toFixed(2),
            totalMb: (estimate.quota / (1024 * 1024)).toFixed(0)
          });
        }
      }).catch(() => {});
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    runSystemVerification();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [runSystemVerification]);

  useEffect(() => {
    if (!autoPing) return;
    const interval = setInterval(() => {
      runSystemVerification();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoPing, runSystemVerification]);

  const getLatencyBadge = (val: number) => {
    if (val < 150) return { label: isBn ? 'উৎকৃষ্ট (<১৫০ms)' : 'Optimal (<150ms)', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
    if (val < 350) return { label: isBn ? 'মাঝারি (১৫০-৩৫০ms)' : 'Fair (150-350ms)', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
    return { label: isBn ? 'ধীর (>৩৫০ms)' : 'High (>350ms)', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' };
  };

  const badge = getLatencyBadge(latency);

  return (
    <div className="page-container pt-5 space-y-5 fade-in">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[var(--text-page)] font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
            <Activity className="text-[var(--color-accent)] shrink-0" size={24} />
            {isBn ? 'সিস্টেম হেলথ ও ডায়াগনস্টিকস' : 'System Health & Diagnostics'}
          </h1>
          <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">
            {isBn ? 'লাইভ ডাটাবেস লেটেন্সি, এপিআই রেসপন্স এবং লোকাল ক্লায়েন্ট রানটাইম যাচাই' : 'Live database latency, API roundtrip, and local client runtime verification'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoPing(!autoPing)}
            className={`px-3 py-1.5 text-xs font-medium rounded-[var(--radius-button)] border transition-all flex items-center gap-1.5 ${
              autoPing
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-[var(--color-bg-subtle)] border-[var(--color-border)] text-[var(--color-text-muted)]'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${autoPing ? 'bg-emerald-500 animate-ping' : 'bg-gray-400'}`} />
            {autoPing ? (isBn ? 'লাইভ ৫s অটো' : 'Live 5s Auto') : (isBn ? 'অটো বন্ধ' : 'Auto Off')}
          </button>

          <Button size="sm" variant="outline" onClick={runSystemVerification} loading={loading} className="gap-1 text-xs">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {isBn ? 'পিং করুন' : 'Ping Now'}
          </Button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Database Connectivity Card */}
        <Card>
          <CardHeader title={isBn ? 'ডাটাবেস কানেক্টিভিটি' : 'Database Connectivity'} />
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-secondary)] flex items-center gap-2">
                <Database size={16} className="text-[var(--color-accent)]" />
                {isBn ? 'কানেকশন স্ট্যাটাস' : 'Connection Status'}
              </span>
              <span className={`flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                dbHealthy
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
              }`}>
                {dbHealthy ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                {dbHealthy ? (isBn ? '১০০% সচল' : '100% Connected') : (isBn ? 'বিচ্ছিন্ন' : 'Disconnected')}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">{isBn ? 'কুয়েরি লেটেন্সি (রাউন্ডট্রিপ)' : 'Query Latency (Roundtrip)'}</span>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] px-2 py-0.5 rounded border font-medium ${badge.color}`}>
                  {badge.label}
                </span>
                <span className="font-bold font-mono text-base text-[var(--color-text-primary)]">
                  {latency} ms
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">{isBn ? 'শেষ পিং সময়' : 'Last Ping Time'}</span>
              <span className="font-mono text-xs text-[var(--color-text-muted)]">
                {lastPingTime || '--:--:--'}
              </span>
            </div>

            {/* Sparkline Latency History */}
            {pingHistory.length > 0 && (
              <div className="pt-2 border-t border-[var(--color-border)]">
                <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)] mb-1">
                  <span>{isBn ? 'সাম্প্রতিক লেটেন্সি ট্রেন্ড (শেষ ১০টি পিং)' : 'Recent Latency Trend (Last 10 Pings)'}</span>
                  <span className="font-mono text-[var(--color-accent)]">
                    {isBn ? 'গড়: ' : 'Avg: '}{Math.round(pingHistory.reduce((a, b) => a + b, 0) / pingHistory.length)} ms
                  </span>
                </div>
                <div className="flex items-end gap-1 h-10 pt-1">
                  {pingHistory.map((val, idx) => {
                    const max = Math.max(...pingHistory, 200);
                    const heightPct = Math.max(15, Math.min(100, (val / max) * 100));
                    return (
                      <div
                        key={idx}
                        className="flex-1 bg-[var(--color-accent)]/40 hover:bg-[var(--color-accent)] rounded-t transition-all relative group"
                        style={{ height: `${heightPct}%` }}
                      >
                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block px-1.5 py-0.5 bg-slate-900 text-white text-[10px] rounded font-mono z-10 whitespace-nowrap">
                          {val}ms
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!dbHealthy && errorMessage && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-mono break-all">
                {errorMessage}
              </div>
            )}
          </div>
        </Card>

        {/* Runtime & Client Health Card */}
        <Card>
          <CardHeader title={isBn ? 'ক্লায়েন্ট রানটাইম ও নেটওয়ার্ক' : 'Client Runtime & Network'} />
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-secondary)] flex items-center gap-2">
                <Wifi size={16} className="text-[var(--color-accent)]" />
                {isBn ? 'ইন্টারনেট স্ট্যাটাস' : 'Network Online'}
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                isOnline
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
              }`}>
                {isOnline ? (isBn ? 'অনলাইন' : 'Online') : (isBn ? 'অফলাইন' : 'Offline')}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-secondary)] flex items-center gap-2">
                <ShieldCheck size={16} className="text-[var(--color-accent)]" />
                {isBn ? 'সুপাবেস এপিআই URL' : 'Supabase API Host'}
              </span>
              <span className="font-mono text-xs text-emerald-600 font-medium">
                {import.meta.env.VITE_SUPABASE_URL ? (isBn ? 'সংযুক্ত' : 'Configured') : (isBn ? 'অনুপস্থিত' : 'Missing')}
              </span>
            </div>

            {storageUsage && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-text-secondary)] flex items-center gap-2">
                  <HardDrive size={16} className="text-[var(--color-accent)]" />
                  {isBn ? 'লোকাল স্টোরেজ ব্যবহৃত' : 'Local Storage Usage'}
                </span>
                <span className="font-mono text-xs text-[var(--color-text-primary)] font-medium">
                  {storageUsage.usedMb} MB / {storageUsage.totalMb} MB
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">{isBn ? 'অ্যাপ ফ্রেমওয়ার্ক' : 'App Environment'}</span>
              <span className="font-mono text-xs text-[var(--color-text-muted)]">
                @safivra/member-web (PWA/Vite)
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">{isBn ? 'টাইমজোন' : 'Local Time'}</span>
              <span className="font-mono text-xs text-[var(--color-text-muted)]">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
