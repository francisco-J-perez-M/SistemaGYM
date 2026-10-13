import { AccessibilityInfo } from 'react-native';
import { createAccessibilityFlagHook } from './useAccessibilityFlag';

/**
 * Whether the OS "Reduce Motion" setting is on. BodySilhouette uses this to
 * skip the animated zoom-step transition and snap instantly instead.
 */
export const useReducedMotion = createAccessibilityFlagHook('reduceMotionChanged', () =>
  AccessibilityInfo.isReduceMotionEnabled(),
);
