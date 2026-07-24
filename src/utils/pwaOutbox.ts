import type { OfflineQueueAction } from '../types/finance';

const STORAGE_KEY = 'safivra_offline_outbox_v1';

export function getOfflineOutbox(): OfflineQueueAction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function queueOfflineAction(actionType: OfflineQueueAction['action'], payload: any): OfflineQueueAction {
  const item: OfflineQueueAction = {
    id: `outbox-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    action: actionType,
    payload,
    createdAt: new Date().toISOString(),
  };

  const queue = getOfflineOutbox();
  queue.push(item);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  return item;
}

export function clearOfflineOutbox(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
}
