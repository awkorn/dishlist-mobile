import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * A shareable invite link (`dishlist://invite/:token`) opened by a logged-out
 * user can't be routed immediately: the InviteLanding screen only exists in the
 * authenticated navigation stack. We stash the token here so the app can route
 * to it once sign-in completes. AsyncStorage (not just memory) so the token
 * survives the app being backgrounded during an email-confirmation signup.
 */
const PENDING_INVITE_KEY = 'pendingInviteToken';

/**
 * Pull the invite token out of a deep-link URL. Matches every prefix form the
 * app registers (`dishlist://invite/x`, `exp://.../--/invite/x`, https links).
 * Returns null when the URL isn't an invite link.
 */
export function extractInviteToken(url: string): string | null {
  const match = url.match(/invite\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function setPendingInvite(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(PENDING_INVITE_KEY, token);
  } catch {
    // Non-fatal: worst case the invite link isn't restored after login.
  }
}

export async function getPendingInvite(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(PENDING_INVITE_KEY);
  } catch {
    return null;
  }
}

export async function clearPendingInvite(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PENDING_INVITE_KEY);
  } catch {
    // Non-fatal.
  }
}

/**
 * If the URL is an invite deep link, stash its token as pending. Safe to call
 * on any incoming URL; no-ops for non-invite links.
 */
export async function captureInviteLink(url: string): Promise<void> {
  const token = extractInviteToken(url);
  if (token) {
    await setPendingInvite(token);
  }
}
