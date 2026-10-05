import { supabase } from '@/lib/supabase/client';

export interface TranslationContext {
  context?: string;
  namespace?: string;
  variables?: Record<string, string | number>;
}

interface MissingTranslationTask {
  text: string;
  hash: string;
  context?: string;
  namespace?: string;
}

// Fast synchronous hash (FNV-1a 32-bit) for English strings
export function generateSourceHashSync(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h.toString(16);
}

class AutoTranslationEngine {
  private cache: Map<string, string> = new Map();
  private pendingQueue: Map<string, MissingTranslationTask> = new Map();
  private inFlightRequests: Set<string> = new Set();
  private batchTimeout: ReturnType<typeof setTimeout> | null = null;
  private currentLocale: 'en' | 'bn' = 'en';
  
  // Callbacks to notify React to re-render when new translations arrive
  private listeners: Set<(hash: string, text: string) => void> = new Set();

  subscribe(listener: (hash: string, text: string) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(hash: string, text: string) {
    this.listeners.forEach(l => l(hash, text));
  }

  async setLocale(locale: 'en' | 'bn') {
    this.currentLocale = locale;
    if (locale === 'en') return;

    // Load entire cache for the user's locale on app boot
    try {
      const { data, error } = await supabase
        .from('translation_cache')
        .select('source_hash, translated_text')
        .eq('target_locale', locale);

      if (error) throw error;
      if (data) {
        data.forEach((entry: { source_hash: string; translated_text: string }) => {
          this.cache.set(entry.source_hash, entry.translated_text);
        });
      }
    } catch (err) {
      console.error('[AutoTranslation] Failed to load cache from DB:', err);
    }
  }

  // Synchronous translation check
  // Falls back to English immediately, queues missing strings in background
  translate(text: string, hash: string, options?: TranslationContext): string {
    if (!text || this.currentLocale === 'en') return this.interpolate(text, options?.variables);

    const translated = this.cache.get(hash);
    if (translated) {
      return this.interpolate(translated, options?.variables);
    }

    // Cache Miss -> Queue for translation if not already flying
    if (!this.inFlightRequests.has(hash) && !this.pendingQueue.has(hash)) {
      this.pendingQueue.set(hash, {
        text,
        hash,
        context: options?.context,
        namespace: options?.namespace,
      });
      this.scheduleBatch();
    }

    // Return English instantly to prevent UI blocking
    return this.interpolate(text, options?.variables);
  }

  // Pre-computes hashes for a batch of static strings.
  prefetchHashes(texts: string[]): Record<string, string> {
    const map: Record<string, string> = {};
    for (const t of texts) {
      map[t] = generateSourceHashSync(t);
    }
    return map;
  }

  private scheduleBatch() {
    if (this.batchTimeout) clearTimeout(this.batchTimeout);
    this.batchTimeout = setTimeout(() => this.processBatch(), 2000); // 2 second debounce
  }

  private async processBatch() {
    if (this.pendingQueue.size === 0) return;

    const tasks = Array.from(this.pendingQueue.values());
    this.pendingQueue.clear();

    tasks.forEach(t => this.inFlightRequests.add(t.hash));

    try {
      const { data, error } = await supabase.functions.invoke('translate-service', {
        body: {
          targetLocale: this.currentLocale,
          strings: tasks,
        },
      });

      if (error) throw error;
      if (data?.success && Array.isArray(data.results)) {
        data.results.forEach((res: { hash: string, translated_text: string }) => {
          this.cache.set(res.hash, res.translated_text);
          this.inFlightRequests.delete(res.hash);
          this.notify(res.hash, res.translated_text);
        });
      }
    } catch (err) {
      console.error('[AutoTranslation] Batch translation failed:', err);
      // Re-queue or just drop. In a real app we might retry with backoff.
      tasks.forEach(t => this.inFlightRequests.delete(t.hash));
    }
  }

  private interpolate(text: string, variables?: Record<string, string | number>): string {
    if (!variables) return text;
    return Object.keys(variables).reduce((result, key) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      return result.replace(regex, String(variables[key]));
    }, text);
  }
}

export const autoTranslationEngine = new AutoTranslationEngine();
