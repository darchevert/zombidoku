import { Platform } from 'react-native';
import { getTrackingPermissionsAsync, requestTrackingPermissionsAsync } from 'expo-tracking-transparency';

let requested = false;

/** iOS only, and only once per app session: asks for permission to use
 * the device's advertising identifier (IDFA) for personalized ads. Apple
 * requires this App Tracking Transparency prompt before any SDK —
 * AdMob included — reads the IDFA; declining doesn't block ads, it just
 * makes AdMob fall back to non-personalized ones. No-op on Android
 * (no ATT there) and on repeat calls once already asked this session. */
export async function ensureTrackingPermission(): Promise<void> {
  if (Platform.OS !== 'ios' || requested) return;
  requested = true;
  const { status } = await getTrackingPermissionsAsync();
  if (status === 'undetermined') {
    await requestTrackingPermissionsAsync();
  }
}
