import React, { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/components/ui/Toast';
import { DownloadCloud } from 'lucide-react';

export const PwaUpdatePrompt: React.FC = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const { t } = useLanguage();
  const { success } = useToast();

  useEffect(() => {
    if (offlineReady) {
      success(t.common.readyOffline, t.common.readyOfflineDesc);
      setOfflineReady(false);
    }
  }, [offlineReady, success, t, setOfflineReady]);

  if (!needRefresh) return null;

  return (
    <div 
      className="fixed bottom-24 right-4 left-4 md:bottom-6 md:right-6 md:left-auto md:w-[22rem] z-[100] bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 shadow-xl flex flex-col gap-4 animate-in slide-in-from-bottom-5 fade-in duration-[var(--duration-standard)]"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 bg-[var(--color-accent-muted)] p-2 rounded-full text-[var(--color-accent)]">
          <DownloadCloud size={20} />
        </div>
        <div>
          <h4 className="font-semibold text-[var(--color-text-primary)]">
            {t.common.updateAvailable}
          </h4>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {t.common.updateAvailableDesc}
          </p>
        </div>
      </div>
      <div className="flex gap-3 justify-end mt-1">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setNeedRefresh(false)}
        >
          {t.common.later}
        </Button>
        <Button 
          variant="primary"
          size="sm" 
          onClick={() => updateServiceWorker(true)}
        >
          {t.common.updateNow}
        </Button>
      </div>
    </div>
  );
};
