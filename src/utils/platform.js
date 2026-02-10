// Lightweight, safe platform detection helpers.
// These functions do not import native modules and are safe for web bundlers.

export function isCapacitorNative() {
  try {
    return typeof window !== 'undefined' && !!window.Capacitor && !!window.Capacitor.isNative;
  } catch (e) {
    return false;
  }
}

export function isAndroid() {
  try {
    return typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
  } catch (e) {
    return false;
  }
}

export function isIOS() {
  try {
    return typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);
  } catch (e) {
    return false;
  }
}

export default { isCapacitorNative, isAndroid, isIOS };
