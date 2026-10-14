import { useSyncExternalStore } from 'react';
import { AccessibilityInfo } from 'react-native';
import type { EmitterSubscription } from 'react-native';

type AccessibilityEvent = 'reduceMotionChanged' | 'screenReaderChanged';

/**
 * Builds a hook that tracks one OS accessibility setting.
 *
 * Each hook owns a single module-level store shared by every component
 * instance, rather than one subscription per instance — several mounted
 * diagrams should not mean several AccessibilityInfo listeners.
 */
export function createAccessibilityFlagHook(
  event: AccessibilityEvent,
  query: () => Promise<boolean>,
): () => boolean {
  let enabled = false;
  let nativeSubscription: EmitterSubscription | null = null;
  const listeners = new Set<() => void>();

  function notifyIfChanged(next: boolean) {
    if (next === enabled) return;
    enabled = next;
    listeners.forEach((listener) => listener());
  }

  function subscribe(onStoreChange: () => void): () => void {
    if (nativeSubscription === null) {
      // A rejection here (an OS query failing, or a test environment without the
      // native module) must not become an unhandled promise rejection — falling
      // back to `false` matches the initial value above.
      query().then(notifyIfChanged).catch(() => {});
      nativeSubscription = AccessibilityInfo.addEventListener(event, notifyIfChanged);
    }
    listeners.add(onStoreChange);

    return () => {
      listeners.delete(onStoreChange);
      // Release the native listener once nothing is watching, so unmounting
      // every diagram doesn't leave a subscription alive for the process.
      if (listeners.size === 0) {
        nativeSubscription?.remove();
        nativeSubscription = null;
      }
    };
  }

  return function useAccessibilityFlag(): boolean {
    return useSyncExternalStore(subscribe, () => enabled);
  };
}
