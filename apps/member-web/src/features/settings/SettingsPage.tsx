import React, { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/components/ui/Toast';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { APP_CONFIG } from '@/config/app';
import { Sun, Moon, Monitor, Globe, Lock, Info, LogOut, Bell, BellOff, BellRing } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import {
  getUserNotificationSettings,
  type UserNotificationSettings,
} from '@/lib/notifications/notificationEngine';
import {
  isPushSupported,
  getNotificationPermissionState,
  subscribeUserToPush,
} from '@/lib/notifications/pushManager';

type ThemeMode = 'system' | 'light' | 'dark';

function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  return (localStorage.getItem('safivra_theme') as ThemeMode) || 'system';
}

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === 'dark') {
    root.setAttribute('data-theme', 'dark');
    root.classList.add('dark');
  } else if (mode === 'light') {
    root.setAttribute('data-theme', 'light');
    root.classList.remove('dark');
  } else {
    root.removeAttribute('data-theme');
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
  localStorage.setItem('safivra_theme', mode);
}

export const SettingsPage: React.FC = () => {
  const { profile, preferences, user, signOut, updateProfile, updatePassword, updatePreferences } = useAuthContext();
  const { t, locale, setLocale } = useLanguage();
  const { success, error: showError } = useToast();
  const isBn = locale === 'bn';

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const initialPhone = (profile?.phone as string) ?? '';
  let defaultCode = '+880';
  let defaultNum = '';
  
  if (initialPhone) {
    if (initialPhone.startsWith('+')) {
      const match = initialPhone.match(/^(\+\d{1,4})/);
      if (match) {
        defaultCode = match[1];
        let numPart = initialPhone.slice(defaultCode.length);
        if (defaultCode === '+880' && !numPart.startsWith('0')) {
          numPart = '0' + numPart;
        }
        defaultNum = numPart;
      }
    } else if (initialPhone.startsWith('8801')) {
      defaultCode = '+880';
      defaultNum = '0' + initialPhone.slice(3); // '01...'
    } else if (initialPhone.startsWith('01') || initialPhone.startsWith('1')) {
      defaultCode = '+880';
      defaultNum = initialPhone.startsWith('1') ? '0' + initialPhone : initialPhone;
    } else {
      defaultCode = '+880';
      defaultNum = initialPhone;
    }
  }

  const [phoneCode, setPhoneCode] = useState(defaultCode);
  const [phoneNumber, setPhoneNumber] = useState(defaultNum);
  // @ts-ignore
  const [dob, setDob] = useState(profile?.date_of_birth ?? '');
  // @ts-ignore
  const [gender, setGender] = useState(profile?.gender ?? '');
  // @ts-ignore
  const [address, setAddress] = useState(profile?.address ?? '');
  // @ts-ignore
  const [country, setCountry] = useState(profile?.country ?? 'Bangladesh');
  const [saving, setSaving] = useState(false);

  // Password change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Theme
  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // ── Notification Settings ──────────────────────────────────────────────────
  const [notifSettings, setNotifSettings] = useState<UserNotificationSettings | null>(null);
  const [savingNotif, setSavingNotif] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [subscribingPush, setSubscribingPush] = useState(false);

  const loadNotifSettings = useCallback(async () => {
    if (!user) return;
    const settings = await getUserNotificationSettings(user.id);
    setNotifSettings(settings);
    setPushPermission(getNotificationPermissionState());
  }, [user]);

  useEffect(() => {
    loadNotifSettings();
  }, [loadNotifSettings]);

  const handleSaveNotifSettings = async () => {
    if (!user || !notifSettings) return;
    setSavingNotif(true);
    try {
      const { error: upsertErr } = await (supabase.from('user_notification_settings') as any).upsert({
        user_id: user.id,
        in_app_enabled: notifSettings.inAppEnabled,
        web_push_enabled: notifSettings.webPushEnabled,
        category_dps: notifSettings.categoryDps,
        category_fdr: notifSettings.categoryFdr,
        category_goals: notifSettings.categoryGoals,
        category_loans: notifSettings.categoryLoans,
        category_cards: notifSettings.categoryCards,
        category_salary: notifSettings.categorySalary,
        category_budget: notifSettings.categoryBudget,
        category_wealth: notifSettings.categoryWealth,
        category_zakat: notifSettings.categoryZakat,
        category_admin: notifSettings.categoryAdmin,
        category_security: notifSettings.categorySecurity,
        quiet_hours_enabled: notifSettings.quietHoursEnabled,
        quiet_hours_start: notifSettings.quietHoursStart,
        quiet_hours_end: notifSettings.quietHoursEnd,
        daily_push_limit: notifSettings.dailyPushLimit,
      }, { onConflict: 'user_id' });

      if (upsertErr) throw upsertErr;
      success(
        isBn ? 'বিজ্ঞপ্তি সেটিংস সংরক্ষিত' : 'Notification settings saved',
        isBn ? 'আপনার পছন্দ আপডেট করা হয়েছে।' : 'Your preferences have been updated.'
      );
    } catch (err: any) {
      showError(isBn ? 'সংরক্ষণ ব্যর্থ' : 'Save failed', err.message);
    } finally {
      setSavingNotif(false);
    }
  };

  const handleEnablePush = async () => {
    if (!user) return;
    setSubscribingPush(true);
    try {
      const ok = await subscribeUserToPush(user.id);
      if (ok) {
        setPushPermission('granted');
        success(
          isBn ? 'পুশ নোটিফিকেশন সক্রিয়' : 'Push notifications enabled',
          isBn ? 'এখন থেকে আপনি পুশ বিজ্ঞপ্তি পাবেন।' : 'You will now receive push notifications.'
        );
      } else {
        setPushPermission(getNotificationPermissionState());
        showError(
          isBn ? 'সক্রিয় করা যায়নি' : 'Could not enable',
          isBn ? 'ব্রাউজার পুশ নোটিফিকেশন অনুমতি দেয়নি।' : 'Browser denied push notification permission.'
        );
      }
    } finally {
      setSubscribingPush(false);
    }
  };


  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    let finalPhone: string | null = null;
    let numToSave = phoneNumber.trim();
    if (numToSave) {
      if (phoneCode === '+880' && numToSave.startsWith('0')) {
        numToSave = numToSave.slice(1);
      }
      finalPhone = `${phoneCode}${numToSave}`;
    }

    const res = await updateProfile({ 
      full_name: fullName,
      phone: finalPhone,
      date_of_birth: dob || null,
      gender,
      address,
      country
    });
    setSaving(false);
    if (res.error) {
      showError(isBn ? 'প্রোফাইল আপডেট ব্যর্থ' : 'Failed to update profile', res.error);
    } else {
      success(isBn ? 'প্রোফাইল আপডেট হয়েছে' : 'Profile updated', isBn ? 'আপনার প্রোফাইল তথ্য (নাম, ফোন নম্বর, জন্ম তারিখ) সফলভাবে আপডেট করা হয়েছে।' : 'Your profile details (name, phone, DOB) have been updated successfully.');
    }
  };


  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      showError(isBn ? 'দুর্বল পাসওয়ার্ড' : 'Weak password', isBn ? 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।' : 'Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showError(isBn ? 'অমিল' : 'Mismatch', isBn ? 'পাসওয়ার্ড মিলছে না।' : 'Passwords do not match.');
      return;
    }
    setChangingPassword(true);
    const res = await updatePassword(newPassword);
    setChangingPassword(false);
    if (res.error) {
      showError(isBn ? 'পাসওয়ার্ড পরিবর্তন ব্যর্থ' : 'Password change failed', res.error);
    } else {
      success(isBn ? 'পাসওয়ার্ড পরিবর্তিত' : 'Password changed', isBn ? 'আপনার পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে।' : 'Your password has been updated successfully.');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleLanguageChange = async (lang: string) => {
    setLocale(lang as 'en' | 'bn');
    await updatePreferences({ language: lang });
  };

  const themeOptions: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { value: 'system', label: isBn ? 'সিস্টেম' : 'System', icon: <Monitor size={16} /> },
    { value: 'light', label: isBn ? 'লাইট' : 'Light', icon: <Sun size={16} /> },
    { value: 'dark', label: isBn ? 'ডার্ক' : 'Dark', icon: <Moon size={16} /> },
  ];

  return (
    <div className="page-container pt-5 space-y-5 fade-in">
      <header>
        <h1 className="text-[var(--text-page)] font-semibold text-[var(--color-text-primary)]">
          {isBn ? 'সেটিংস' : 'Settings'}
        </h1>
        <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">
          {isBn ? 'প্রোফাইল, পছন্দ, নিরাপত্তা এবং সেশন ব্যবস্থাপনা' : 'Profile, preferences, security, and session management'}
        </p>
      </header>

      {/* Profile Section */}
      <Card>
        <CardHeader title={isBn ? 'প্রোফাইল সেটিংস' : 'Profile Settings'} />
        <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
          <Input
            label={isBn ? 'পুরো নাম' : 'Full Name'}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
              {isBn ? 'ফোন নম্বর' : 'Phone Number'}
            </label>
            <div className="flex gap-2">
              <div className="w-[120px] shrink-0">
                <Select
                  value={phoneCode}
                  onValueChange={(val) => setPhoneCode(val)}
                  options={[
                    { value: '+880', label: '🇧🇩 +880' },
                    { value: '+1', label: '🇺🇸 +1' },
                    { value: '+44', label: '🇬🇧 +44' },
                    { value: '+91', label: '🇮🇳 +91' },
                    { value: '+971', label: '🇦🇪 +971' },
                    { value: '+65', label: '🇸🇬 +65' },
                    { value: '+61', label: '🇦🇺 +61' },
                  ]}
                />
              </div>
              <div className="flex-1">
                <Input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  type="tel"
                  placeholder="17XX-XXXXXX"
                />
              </div>
            </div>
          </div>
          <Input
            label={isBn ? 'জন্ম তারিখ' : 'Date of Birth'}
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            type="date"
          />
          <Select
            label={isBn ? 'লিঙ্গ' : 'Gender'}
            value={gender}
            onValueChange={(val) => setGender(val)}
            options={[
              { value: '', label: isBn ? 'নির্বাচন করুন' : 'Select...' },
              { value: 'Male', label: isBn ? 'পুরুষ' : 'Male' },
              { value: 'Female', label: isBn ? 'নারী' : 'Female' },
              { value: 'Other', label: isBn ? 'অন্যান্য' : 'Other' },
            ]}
          />
          <Input
            label={isBn ? 'ঠিকানা (ঐচ্ছিক)' : 'Address (Optional)'}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <Select
            label={isBn ? 'দেশ' : 'Country'}
            value={country}
            onValueChange={(val) => setCountry(val)}
            options={[
              { value: 'Bangladesh', label: 'Bangladesh' },
              { value: 'USA', label: 'USA' },
              { value: 'UK', label: 'UK' },
              { value: 'India', label: 'India' },
              { value: 'Canada', label: 'Canada' },
              { value: 'Australia', label: 'Australia' },
              { value: 'Other', label: 'Other' },
            ]}
          />
          <Input
            label={isBn ? 'পছন্দের মুদ্রা' : 'Preferred Currency'}
            value={`${APP_CONFIG.currency.code} (${APP_CONFIG.currency.symbol})`}
            disabled
          />
          <Input
            label={isBn ? 'টাইমজোন' : 'Timezone'}
            value={APP_CONFIG.timezone}
            disabled
          />
          <Button type="submit" loading={saving}>
            {isBn ? 'সংরক্ষণ করুন' : 'Save Changes'}
          </Button>
        </form>
      </Card>

      {/* Appearance Section */}
      <Card>
        <CardHeader title={isBn ? 'চেহারা' : 'Appearance'} />
        <div className="space-y-4 max-w-md">
          {/* Theme */}
          <div>
            <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)] mb-2.5">
              {isBn ? 'থিম নির্বাচন করুন' : 'Choose your theme'}
            </p>
            <div className="flex gap-2">
              {themeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={[
                    'flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-button)] text-sm font-medium transition-all',
                    theme === opt.value
                      ? 'bg-[var(--color-accent)] text-[var(--color-accent-text)]'
                      : 'bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]',
                  ].join(' ')}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)] mb-2.5">
              {isBn ? 'ভাষা নির্বাচন করুন' : 'Select language'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleLanguageChange('en')}
                className={[
                  'flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-button)] text-sm font-medium transition-all',
                  locale === 'en'
                    ? 'bg-[var(--color-accent)] text-[var(--color-accent-text)]'
                    : 'bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]',
                ].join(' ')}
              >
                <Globe size={16} /> English
              </button>
              <button
                onClick={() => handleLanguageChange('bn')}
                className={[
                  'flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-button)] text-sm font-medium transition-all',
                  locale === 'bn'
                    ? 'bg-[var(--color-accent)] text-[var(--color-accent-text)]'
                    : 'bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]',
                ].join(' ')}
              >
                <Globe size={16} /> বাংলা
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Security Section */}
      <Card>
        <CardHeader title={isBn ? 'নিরাপত্তা' : 'Security'} />
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div className="flex items-center gap-2 text-[var(--text-secondary)] text-[var(--color-text-muted)] mb-1">
            <Lock size={14} />
            <span>{isBn ? 'পাসওয়ার্ড পরিবর্তন করুন' : 'Change your password'}</span>
          </div>
          <Input
            label={isBn ? 'নতুন পাসওয়ার্ড' : 'New Password'}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            info={isBn ? 'কমপক্ষে ৮ অক্ষর, ১টি বড় হাতের অক্ষর, ১টি সংখ্যা' : 'Min 8 characters, 1 uppercase, 1 number'}
          />
          <Input
            label={isBn ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password'}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button type="submit" loading={changingPassword} disabled={!newPassword || !confirmPassword}>
            {isBn ? 'পাসওয়ার্ড আপডেট করুন' : 'Update Password'}
          </Button>
        </form>
      </Card>

      {/* ── Notification Preferences ── */}
      {notifSettings && (
        <Card>
          <CardHeader title={isBn ? 'বিজ্ঞপ্তি পছন্দ' : 'Notification Preferences'} />
          <div className="space-y-5">

            {/* Master Channels */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                {isBn ? 'চ্যানেল' : 'Channels'}
              </p>
              {[
                { key: 'inAppEnabled', label: isBn ? 'ইন-অ্যাপ বিজ্ঞপ্তি' : 'In-App Notifications', sub: isBn ? 'অ্যাপের ভেতরে দেখাবে' : 'Shows inside the app', icon: Bell },
                { key: 'webPushEnabled', label: isBn ? 'ওয়েব পুশ বিজ্ঞপ্তি' : 'Web Push Notifications', sub: isBn ? 'ব্রাউজার পুশ হিসেবে দেখাবে' : 'Appears as browser push', icon: BellRing },
              ].map(({ key, label, sub, icon: Icon }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <div className="w-8 h-8 rounded-[var(--radius-button)] bg-[var(--color-bg-subtle)] flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-[var(--color-text-secondary)]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[var(--text-body)] font-medium text-[var(--color-text-primary)]">{label}</p>
                    <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)]">{sub}</p>
                  </div>
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-[var(--color-accent)]"
                    checked={(notifSettings as any)[key]}
                    onChange={(e) => setNotifSettings(prev => prev ? { ...prev, [key]: e.target.checked } : prev)}
                  />
                </label>
              ))}
            </div>

            {/* Category Toggles */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                {isBn ? 'ক্যাটাগরি' : 'Categories'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {([
                  { key: 'categoryDps',      label: isBn ? 'ডিপিএস' : 'DPS' },
                  { key: 'categoryFdr',      label: isBn ? 'এফডিআর' : 'FDR' },
                  { key: 'categoryGoals',    label: isBn ? 'সঞ্চয় লক্ষ্য' : 'Savings Goals' },
                  { key: 'categoryLoans',    label: isBn ? 'ঋণ' : 'Loans' },
                  { key: 'categoryCards',    label: isBn ? 'ক্রেডিট কার্ড' : 'Credit Cards' },
                  { key: 'categorySalary',   label: isBn ? 'বেতন' : 'Salary' },
                  { key: 'categoryBudget',   label: isBn ? 'বাজেট' : 'Budget' },
                  { key: 'categoryWealth',   label: isBn ? 'সম্পদ বিশ্লেষণ' : 'Wealth' },
                  { key: 'categoryZakat',    label: isBn ? 'যাকাত' : 'Zakat' },
                  { key: 'categoryAdmin',    label: isBn ? 'ঘোষণা' : 'Announcements' },
                  { key: 'categorySecurity', label: isBn ? 'নিরাপত্তা' : 'Security' },
                ] as { key: keyof UserNotificationSettings; label: string }[]).map(({ key, label }) => (
                  <label key={key} className="flex items-center justify-between gap-2 px-3 py-2 rounded-[var(--radius-button)] bg-[var(--color-bg-subtle)] cursor-pointer hover:bg-[var(--color-bg-hover)] transition-colors">
                    <span className="text-[var(--text-secondary)] text-[var(--color-text-primary)]">{label}</span>
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-[var(--color-accent)]"
                      checked={notifSettings[key] as boolean}
                      onChange={(e) => setNotifSettings(prev => prev ? { ...prev, [key]: e.target.checked } : prev)}
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Quiet Hours */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                {isBn ? 'নিরব সময়' : 'Quiet Hours'}
              </p>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="flex-1">
                  <p className="text-[var(--text-body)] font-medium text-[var(--color-text-primary)]">
                    {isBn ? 'নিরব সময় চালু করুন' : 'Enable quiet hours'}
                  </p>
                  <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)]">
                    {isBn ? 'এই সময়ে শুধু জরুরি বিজ্ঞপ্তি পাবেন' : 'Only critical notifications during this window'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-[var(--color-accent)]"
                  checked={notifSettings.quietHoursEnabled}
                  onChange={(e) => setNotifSettings(prev => prev ? { ...prev, quietHoursEnabled: e.target.checked } : prev)}
                />
              </label>
              {notifSettings.quietHoursEnabled && (
                <div className="flex gap-3 items-center">
                  <div className="flex-1">
                    <Input
                      label={isBn ? 'শুরু' : 'Start'}
                      type="time"
                      value={notifSettings.quietHoursStart}
                      onChange={(e) => setNotifSettings(prev => prev ? { ...prev, quietHoursStart: e.target.value } : prev)}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      label={isBn ? 'শেষ' : 'End'}
                      type="time"
                      value={notifSettings.quietHoursEnd}
                      onChange={(e) => setNotifSettings(prev => prev ? { ...prev, quietHoursEnd: e.target.value } : prev)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Web Push Device Subscription */}
            {isPushSupported() && (
              <div className="p-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {pushPermission === 'granted' ? (
                      <BellRing size={16} className="text-[var(--color-positive)]" />
                    ) : pushPermission === 'denied' ? (
                      <BellOff size={16} className="text-[var(--color-negative)]" />
                    ) : (
                      <Bell size={16} className="text-[var(--color-text-muted)]" />
                    )}
                    <div>
                      <p className="text-[var(--text-secondary)] font-medium text-[var(--color-text-primary)]">
                        {pushPermission === 'granted'
                          ? (isBn ? 'এই ডিভাইসে পুশ সক্রিয়' : 'Push active on this device')
                          : pushPermission === 'denied'
                            ? (isBn ? 'পুশ অবরুদ্ধ (ব্রাউজার সেটিংস দেখুন)' : 'Push blocked (check browser settings)')
                            : (isBn ? 'পুশ নোটিফিকেশন নিষ্ক্রিয়' : 'Push notifications not enabled')}
                      </p>
                    </div>
                  </div>
                  {pushPermission !== 'granted' && pushPermission !== 'denied' && (
                    <Button size="sm" onClick={handleEnablePush} loading={subscribingPush} className="shrink-0">
                      {isBn ? 'সক্রিয় করুন' : 'Enable'}
                    </Button>
                  )}
                </div>
              </div>
            )}

            <Button onClick={handleSaveNotifSettings} loading={savingNotif}>
              {isBn ? 'বিজ্ঞপ্তি পছন্দ সংরক্ষণ করুন' : 'Save Notification Preferences'}
            </Button>
          </div>
        </Card>
      )}

      {/* App Info */}
      <Card>
        <CardHeader title={isBn ? 'অ্যাপ তথ্য' : 'App Info'} />
        <div className="space-y-2 text-sm text-[var(--color-text-secondary)]">
          <div className="flex items-center gap-2">
            <Info size={14} className="text-[var(--color-text-muted)]" />
            <span>{APP_CONFIG.name} v{APP_CONFIG.version ?? '1.0.0'}</span>
          </div>
          <p className="text-[var(--text-secondary)] text-[var(--color-text-muted)]">
            {isBn ? 'বাংলাদেশের জন্য ব্যক্তিগত আর্থিক ব্যবস্থাপনা' : 'Personal financial management for Bangladesh'}
          </p>
        </div>
      </Card>

      {/* Sign Out */}
      <Card>
        <CardHeader title={isBn ? 'অ্যাকাউন্ট নিয়ন্ত্রণ' : 'Account Control'} />
        <Button variant="destructive" onClick={signOut} className="gap-2">
          <LogOut size={16} />
          {isBn ? `${APP_CONFIG.name} থেকে সাইন আউট` : `Sign Out of ${APP_CONFIG.name}`}
        </Button>
      </Card>
    </div>
  );
};
