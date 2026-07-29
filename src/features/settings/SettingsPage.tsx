import React, { useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { APP_CONFIG } from '@/config/app';

export const SettingsPage: React.FC = () => {
  const { profile, signOut, updateProfile } = useAuthContext();
  const { success, error: showError } = useToast();

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await updateProfile({ full_name: fullName });
    setSaving(false);
    if (res.error) {
      showError('Failed to update profile', res.error);
    } else {
      success('Profile updated', 'Your full name has been updated.');
    }
  };

  return (
    <div className="page-container pt-5 space-y-5 fade-in">
      <header>
        <h1 className="text-[var(--text-page)] font-semibold text-[var(--color-text-primary)]">
          Settings
        </h1>
        <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)]">
          Profile, preferences, security, and session management
        </p>
      </header>

      {/* Profile Section */}
      <Card>
        <CardHeader title="Profile Settings" />
        <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
          <Input
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Input
            label="Preferred Currency"
            value={`${APP_CONFIG.currency.code} (${APP_CONFIG.currency.symbol})`}
            disabled
          />
          <Input
            label="Timezone"
            value={APP_CONFIG.timezone}
            disabled
          />
          <Button type="submit" loading={saving}>Save Changes</Button>
        </form>
      </Card>

      {/* Account Control */}
      <Card>
        <CardHeader title="Account Security" />
        <Button variant="destructive" onClick={signOut}>
          Sign Out of {APP_CONFIG.name}
        </Button>
      </Card>
    </div>
  );
};
