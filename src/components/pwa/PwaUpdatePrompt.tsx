import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/context/LanguageContext';

export const PwaUpdatePrompt: React.FC = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const { t } = useLanguage();

  if (!needRefresh && !offlineReady) return null;

  return (
    <div 
      className="fixed bottom-20 right-4 left-4 md:left-auto md:w-96 z-50 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-4 shadow-xl flex flex-col gap-3 fade-in"
      role="alert"
    >
      <div>
        <h4 className="font-semibold text-[var(--color-text-primary)]">
          {needRefresh ? t.common.updateAvailable : t.common.readyOffline}
        </h4>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          {needRefresh ? t.common.updateAvailableDesc : t.common.readyOfflineDesc}
        </p>
      </div>
      <div className="flex gap-2 justify-end">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            setOfflineReady(false);
            setNeedRefresh(false);
          }}
        >
          {t.common.later}
        </Button>
        {needRefresh && (
          <Button 
            size="sm" 
            onClick={() => updateServiceWorker(true)}
          >
            {t.common.updateNow}
          </Button>
        )}
      </div>
    </div>
  );
};
