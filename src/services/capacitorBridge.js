import { isCapacitorNative } from '../utils/platform.js';

// Safe, runtime-only bridge to Capacitor APIs. Use dynamic import and runtime
// checks so web bundling is unaffected and runtime errors are avoided.

export async function requestCameraPermission() {
  if (!isCapacitorNative()) return { granted: false, reason: 'not_native' };

  try {
    // Dynamic import to avoid bundling @capacitor/core for web-only builds
    const cap = await import('@capacitor/core');
    const Plugins = cap?.Plugins || (cap && cap.getPlugins && cap.getPlugins());

    // Capacitor may expose a Permissions plugin or Camera plugin depending on platform
    if (Plugins?.Permissions && Plugins.Permissions.request) {
      const res = await Plugins.Permissions.request({ name: 'camera' });
      return { granted: !!(res.granted || res.state === 'granted') };
    }

    // Fallback: try Camera plugin permission flow
    if (Plugins?.Camera && Plugins.Camera.requestPermissions) {
      const res = await Plugins.Camera.requestPermissions();
      return { granted: !!res?.camera };
    }

    return { granted: false, reason: 'no_plugin' };
  } catch (err) {
    console.warn('Capacitor permission bridge failed:', err);
    return { granted: false, reason: 'exception' };
  }
}

export async function openAppSettings() {
  if (!isCapacitorNative()) return false;
  try {
    const cap = await import('@capacitor/core');
    const Plugins = cap?.Plugins || (cap && cap.getPlugins && cap.getPlugins());
    if (Plugins?.App && Plugins.App.openSettings) {
      await Plugins.App.openSettings();
      return true;
    }
  } catch (e) {
    console.warn('openAppSettings failed', e);
  }
  return false;
}

export default { requestCameraPermission, openAppSettings };
