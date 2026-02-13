import { useState, useEffect, useCallback, useRef } from 'react';

const HAPTIC_STORAGE_KEY = 'smirkle_haptic_enabled';
const HAPTIC_COOLDOWN_MS = 500;
const HAPTIC_VIBRATION_MS = 200;

/**
 * useHapticFeedback hook for managing device vibration feedback
 *
 * Features:
 * - Loads/saves haptic preference from localStorage
 * - Prevents feedback loops with cooldown
 * - Graceful degradation when Vibration API is unavailable
 */
export function useHapticFeedback() {
  const [isEnabled, setIsEnabled] = useState(true);
  const [isSupported, setIsSupported] = useState(false);
  const lastVibrationRef = useRef(0);

  // Check for Vibration API support on mount
  useEffect(() => {
    const supported = typeof navigator !== 'undefined' && 'vibrate' in navigator;
    setIsSupported(supported);
  }, []);

  // Load haptic preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(HAPTIC_STORAGE_KEY);
    if (saved !== null) {
      setIsEnabled(JSON.parse(saved));
    }
  }, []);

  // Save haptic preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(HAPTIC_STORAGE_KEY, JSON.stringify(isEnabled));
  }, [isEnabled]);

  const vibrate = useCallback(() => {
    // Check if vibration is supported and enabled
    if (!isSupported || !isEnabled) {
      return;
    }

    const now = Date.now();

    // Prevent feedback loop with cooldown check
    if (now - lastVibrationRef.current < HAPTIC_COOLDOWN_MS) {
      return;
    }

    // Trigger vibration
    navigator.vibrate(HAPTIC_VIBRATION_MS);
    lastVibrationRef.current = now;
  }, [isSupported, isEnabled]);

  const toggle = useCallback(() => {
    setIsEnabled((prev) => !prev);
  }, []);

  const enable = useCallback(() => {
    setIsEnabled(true);
  }, []);

  const disable = useCallback(() => {
    setIsEnabled(false);
  }, []);

  return {
    vibrate,
    isEnabled,
    isSupported,
    toggle,
    enable,
    disable,
  };
}
