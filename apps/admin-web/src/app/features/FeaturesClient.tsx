'use client';

import { useState, useMemo } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { FeatureStats } from './page';

interface FeaturesClientProps {
  features: FeatureStats[];
  recentLogs: any[];
}

export default function FeaturesClient({ features, recentLogs }: FeaturesClientProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'grid' | 'logs'>('grid');

  const categories = ['All', 'Financial Core', 'Planning & Goals', 'Zakat & Taxes', 'Tools & System'];

  // Summary Metrics
  const totalInteractions = useMemo(() => {
    return features.reduce((sum, f) => sum + f.totalUsage, 0);
  }, [features]);

  const topFeature = useMemo(() => {
    return [...features].sort((a, b) => b.totalUsage - a.totalUsage)[0];
  }, [features]);

  const latestUsageTime = useMemo(() => {
    const times = features.map(f => f.lastUsedAt).filter(Boolean) as string[];
    if (times.length === 0) return 'No activity yet';
    const sorted = times.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    return new Date(sorted[0]).toLocaleString();
  }, [features]);

  const filteredFeatures = useMemo(() => {
    return features.filter(f => {
      const matchCat = selectedCategory === 'All' || f.category === selectedCategory;
      const matchSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          f.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [features, selectedCategory, searchQuery]);

  const getStatusBadge = (count: number) => {
    if (count > 50) {
      return {
        label: 'High Adoption',
        color: isDark ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-emerald-700 bg-emerald-50 border-emerald-200'
      };
    }
    if (count > 10) {
      return {
        label: 'Moderate',
        color: isDark ? 'text-sky-400 bg-sky-500/10 border-sky-500/20' : 'text-sky-700 bg-sky-50 border-sky-200'
      };
    }
    if (count > 0) {
      return {
        label: 'Low Usage',
        color: isDark ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-amber-700 bg-amber-50 border-amber-200'
      };
    }
    return {
      label: 'Unused / New',
      color: isDark ? 'text-slate-400 bg-slate-800 border-slate-700' : 'text-slate-600 bg-slate-100 border-slate-200'
    };
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'Financial Core':
        return isDark ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40' : 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'Planning & Goals':
        return isDark ? 'text-purple-400 bg-purple-950/40 border-purple-800/40' : 'text-purple-700 bg-purple-50 border-purple-200';
      case 'Zakat & Taxes':
        return isDark ? 'text-amber-400 bg-amber-950/40 border-amber-800/40' : 'text-amber-700 bg-amber-50 border-amber-200';
      default:
        return isDark ? 'text-sky-400 bg-sky-950/40 border-sky-800/40' : 'text-sky-700 bg-sky-50 border-sky-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Feature Usage & Adoption Analytics
          </h1>
          <p className={`mt-1 text-sm ${isDark ? 'text-emerald-200/60' : 'text-slate-600'}`}>
            100% accurate, live database tracking of member feature engagement and usage frequency.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('grid')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
              activeTab === 'grid'
                ? isDark
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                  : 'bg-emerald-600 text-white border-emerald-700 font-bold'
                : isDark
                  ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Feature Overview
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
              activeTab === 'logs'
                ? isDark
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                  : 'bg-emerald-600 text-white border-emerald-700 font-bold'
                : isDark
                  ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Live Activity Feed ({recentLogs.length})
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Interactions */}
        <div className={`rounded-2xl border p-5 transition-all ${
          isDark ? 'bg-emerald-950/20 border-emerald-900/40 shadow-xl' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-emerald-400' : 'text-slate-500'}`}>
              Total Database Hits
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div className={`mt-3 text-3xl font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {totalInteractions.toLocaleString()}
          </div>
          <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Combined data entries across all modules
          </p>
        </div>

        {/* Most Popular Feature */}
        <div className={`rounded-2xl border p-5 transition-all ${
          isDark ? 'bg-emerald-950/20 border-emerald-900/40 shadow-xl' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-emerald-400' : 'text-slate-500'}`}>
              #1 Most Used Feature
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          </div>
          <div className={`mt-3 text-lg font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {topFeature?.name || 'N/A'}
          </div>
          <p className={`mt-1 text-xs font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
            {topFeature?.totalUsage || 0} usage entries recorded
          </p>
        </div>

        {/* Active Features Count */}
        <div className={`rounded-2xl border p-5 transition-all ${
          isDark ? 'bg-emerald-950/20 border-emerald-900/40 shadow-xl' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-emerald-400' : 'text-slate-500'}`}>
              Monitored Modules
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
          </div>
          <div className={`mt-3 text-3xl font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {features.length} Features
          </div>
          <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            100% live database tracking enabled
          </p>
        </div>

        {/* Latest Activity Timestamp */}
        <div className={`rounded-2xl border p-5 transition-all ${
          isDark ? 'bg-emerald-950/20 border-emerald-900/40 shadow-xl' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-emerald-400' : 'text-slate-500'}`}>
              Last User Feature Hit
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className={`mt-3 text-xs font-mono font-semibold truncate ${isDark ? 'text-emerald-300' : 'text-slate-800'}`}>
            {latestUsageTime}
          </div>
          <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Latest member action timestamp
          </p>
        </div>
      </div>

      {activeTab === 'grid' ? (
        <>
          {/* Controls: Search & Category Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-all ${
                    selectedCategory === cat
                      ? isDark
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 font-semibold'
                        : 'bg-emerald-100 border-emerald-300 text-emerald-800 font-semibold'
                      : isDark
                        ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search feature..."
                className={`w-full px-3.5 py-2 pl-9 text-xs rounded-xl border transition-all ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none'
                    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none'
                }`}
              />
              <svg className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Feature List Table */}
          <div className={`rounded-2xl border overflow-hidden transition-all ${
            isDark ? 'bg-slate-900/80 border-slate-800 shadow-xl' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`border-b text-slate-400 uppercase tracking-wider font-semibold ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  <tr>
                    <th className="px-6 py-4">Feature Module</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4 text-center">Total Usage</th>
                    <th className="px-6 py-4 text-center">Active Users</th>
                    <th className="px-6 py-4">Last Used At</th>
                    <th className="px-6 py-4 text-right">Adoption Status</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
                  {filteredFeatures.map(f => {
                    const status = getStatusBadge(f.totalUsage);
                    const catStyle = getCategoryBadge(f.category);
                    return (
                      <tr key={f.id} className={`transition-colors ${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-sm text-slate-900 dark:text-white">
                            {f.name}
                          </div>
                          <div className="text-slate-500 dark:text-slate-400 mt-0.5 max-w-sm text-[11px]">
                            {f.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${catStyle}`}>
                            {f.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            {f.totalUsage.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span className="font-mono text-xs font-medium text-slate-700 dark:text-slate-300">
                            {f.uniqueUsers} members
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
                            {f.lastUsedAt ? new Date(f.lastUsedAt).toLocaleString() : 'No entries'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Recent Live Feature Logs Feed */
        <div className={`rounded-2xl border p-6 transition-all ${
          isDark ? 'bg-slate-900/80 border-slate-800 shadow-xl' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Real-Time Member Feature Activity Stream
          </h2>

          {recentLogs.length === 0 ? (
            <p className={`text-xs p-4 rounded-xl border ${isDark ? 'bg-slate-950/40 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
              No live navigation logs recorded yet. Once users navigate across member features, live events will stream here automatically.
            </p>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                    isDark ? 'bg-slate-950/40 border-slate-800/80 hover:border-emerald-500/40' : 'bg-slate-50/80 border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs">
                      ⚡
                    </div>
                    <div>
                      <div className={`font-semibold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {log.feature_name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        User ID: {log.user_id ? `${log.user_id.slice(0, 8)}...` : 'Anonymous'}
                      </div>
                    </div>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
