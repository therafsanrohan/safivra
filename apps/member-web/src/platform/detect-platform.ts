import { SafivraPlatform } from './types';

export const detectPlatform = (): SafivraPlatform => {
  // 1. Tauri check
  if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('windows')) return 'windows';
    if (userAgent.includes('macintosh') || userAgent.includes('mac os')) return 'macos';
    return 'linux';
  }

  // 2. Capacitor check
  if (typeof window !== 'undefined' && (window as any).Capacitor) {
    const cap = (window as any).Capacitor;
    if (cap.getPlatform() === 'android') return 'android';
    if (cap.getPlatform() === 'ios') return 'ios';
  }

  // 3. PWA check
  if (typeof window !== 'undefined') {
    const isPwa =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');
    if (isPwa) return 'pwa';
  }

  return 'web';
};
