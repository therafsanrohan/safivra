import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/components/ui/Toast';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { APP_CONFIG } from '@/config/app';
import { Sun, Moon, Monitor, Globe, Lock, Info, LogOut } from 'lucide-react';

type ThemeMode = 'system' | 'light' | 'dark';

function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  return (localStorage.getItem('safivra_theme') as ThemeMode) || 'system';
}

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else if (mode === 'light') {
    root.setAttribute('data-theme', 'light');
  } else {
    root.removeAttribute('data-theme');
  }
  localStorage.setItem('safivra_theme', mode);
}

export const SettingsPage: React.FC = () => {
  const { profile, preferences, signOut, updateProfile, updatePassword, updatePreferences } = useAuthContext();
  const { t, locale, setLocale } = useLanguage();
  const { success, error: showError } = useToast();
  const isBn = locale === 'bn';

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const initialPhone = (profile?.phone as string) ?? '';
  const initialCodeMatch = initialPhone.match(/^(\+\d{1,4})/);
  const initialCode = initialCodeMatch ? initialCodeMatch[1] : '+880';
  const initialNumber = initialCodeMatch ? initialPhone.slice(initialCode.length) : initialPhone;
  const [phoneCode, setPhoneCode] = useState(initialCode);
  const [phoneNumber, setPhoneNumber] = useState(initialNumber);
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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await updateProfile({ 
      full_name: fullName,
      phone: `${phoneCode}${phoneNumber}`,
      date_of_birth: dob,
      gender,
      address,
      country
    });
    setSaving(false);
    if (res.error) {
      showError(isBn ? 'প্রোফাইল আপডেট ব্যর্থ' : 'Failed to update profile', res.error);
    } else {
      success(isBn ? 'প্রোফাইল আপডেট হয়েছে' : 'Profile updated', isBn ? 'আপনার নাম আপডেট করা হয়েছে।' : 'Your full name has been updated.');
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
                  placeholder="1700000000"
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
