import { AccessibilityInfo } from 'react-native';
import { createAccessibilityFlagHook } from './useAccessibilityFlag';

/**
 * Whether VoiceOver/TalkBack is running.
 *
 * BodySilhouette mounts its accessible overlay only while this is true. SVG
 * paths cannot carry a role, a selected state, or an activation handler — see
 * the overlay comment in BodySilhouette — so reaching a muscle with a screen
 * reader needs real views on top, and those would otherwise sit in the way of
 * everyone else's taps.
 */
export const useScreenReaderEnabled = createAccessibilityFlagHook('screenReaderChanged', () =>
  AccessibilityInfo.isScreenReaderEnabled(),
);
