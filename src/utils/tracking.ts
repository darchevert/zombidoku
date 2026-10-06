import { Platform } from 'react-native';

let requested = false;

/** iOS only, and only once per app session: asks for permission to use
 * the device's advertising identifier (IDFA) for personalized ads. Apple
 * requires this App Tracking Transparency prompt before any SDK —
 * AdMob included — reads the IDFA; declining doesn't block ads, it just
 * makes AdMob fall back to non-personalized ones. No-op on Android
 * (no ATT there) and on repeat calls once already asked this session.
 *
 * `expo-tracking-transparency` has no web implementation — its native
 * module binding throws immediately just from being loaded on a platform
 * that doesn't have it, not only when called. A static top-level import
 * would therefore crash the *entire* web build on load, even though
 * `Platform.OS !== 'ios'` would have skipped using it a line later. The
 * dynamic `import()` below is only ever evaluated inside the iOS branch,
 * so the module is never loaded — and never crashes — on web or
 * Android. */
export async function ensureTrackingPermission(): Promise<void> {
  if (Platform.OS !== 'ios' || requested) return;
  requested = true;
  const { getTrackingPermissionsAsync, requestTrackingPermissionsAsync } = await import(
    'expo-tracking-transparency'
  );
  const { status } = await getTrackingPermissionsAsync();
  if (status === 'undetermined') {
    await requestTrackingPermissionsAsync();
  }
}
