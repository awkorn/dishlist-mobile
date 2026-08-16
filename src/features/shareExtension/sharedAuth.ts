// Extension-side auth: read the mirrored Supabase session from App Group
// storage and refresh it directly against the Supabase token endpoint when
// expired. Deliberately does NOT import @supabase/supabase-js — the extension
// bundle stays tiny and we only need one REST call.
//
// Refresh-token rotation: Supabase rotates the refresh token on use, so the
// rotated session is written back to shared storage; the main app adopts any
// newer shared session on foreground (src/services/sharedSession.ts), keeping
// both processes converged.

import {
  readSharedSession,
  writeSharedSession,
  type SharedSession,
} from "./sharedStorage";
import { shareLog } from "./logger";

const EXPIRY_MARGIN_SEC = 60;
const REFRESH_TIMEOUT_MS = 10_000;
const MAX_REFRESH_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 200;

export type SharedAuthResult =
  | { status: "ok"; accessToken: string }
  | { status: "signed-out" }
  | { status: "error" };

export async function getShareExtensionAccessToken(options?: {
  forceRefresh?: boolean;
}): Promise<SharedAuthResult> {
  const session = readSharedSession();
  if (!session) {
    // Empty shared storage: either the user isn't signed in, or the App Group
    // container isn't shared between app and extension (id mismatch).
    shareLog.warn(
      "No shared session found — sign into DishList, or check the App Group id matches on both targets"
    );
    return { status: "signed-out" };
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (!options?.forceRefresh && session.expiresAt > nowSec + EXPIRY_MARGIN_SEC) {
    shareLog.info("Using cached access token from shared session");
    return { status: "ok", accessToken: session.accessToken };
  }

  shareLog.info("Shared access token expired — refreshing");
  return refreshSharedSession(session);
}

async function refreshSharedSession(
  session: SharedSession
): Promise<SharedAuthResult> {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    shareLog.error(
      "EXPO_PUBLIC_SUPABASE_URL / ANON_KEY undefined in the extension bundle — rebuild the dev client"
    );
    return { status: "error" };
  }

  const endpoint = `${supabaseUrl}/auth/v1/token?grant_type=refresh_token`;
  const deadline = Date.now() + REFRESH_TIMEOUT_MS;

  for (let attempt = 0; attempt < MAX_REFRESH_ATTEMPTS; attempt += 1) {
    if (attempt > 0) {
      const delay = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
      if (Date.now() + delay >= deadline) break;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) break;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), remainingMs);

    try {
      // Match the headers used by supabase-js. The Authorization header is
      // important for publishable keys and keeps this small client compatible
      // with Supabase's API gateway as key formats evolve.
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          Authorization: `Bearer ${anonKey}`,
          apikey: anonKey,
          "X-Client-Info": "dishlist-share-extension/1.0",
        },
        body: JSON.stringify({ refresh_token: session.refreshToken }),
        signal: controller.signal,
      });

      if (response.status === 400 || response.status === 401) {
        // Refresh token revoked/expired — the user must open the app to sign in.
        shareLog.warn(
          `Token refresh rejected (${response.status}) — signing out`
        );
        return { status: "signed-out" };
      }

      const isRetryable = response.status === 429 || response.status >= 500;
      if (!response.ok) {
        shareLog.error(`Token refresh failed with status ${response.status}`);
        if (isRetryable && attempt < MAX_REFRESH_ATTEMPTS - 1) continue;
        return { status: "error" };
      }

      const data = (await response.json()) as {
        access_token?: string;
        refresh_token?: string;
        expires_at?: number;
        expires_in?: number;
      };
      if (!data.access_token || !data.refresh_token) {
        shareLog.error("Token refresh response was missing session fields");
        return { status: "error" };
      }

      const expiresAt =
        data.expires_at ??
        Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600);

      writeSharedSession({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
      });

      shareLog.info("Token refreshed and written back to shared session");
      return { status: "ok", accessToken: data.access_token };
    } catch (error) {
      shareLog.error(
        `Token refresh attempt ${attempt + 1} threw: ${(error as Error)?.message ?? String(error)}`
      );
      if (attempt === MAX_REFRESH_ATTEMPTS - 1) {
        return { status: "error" };
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  shareLog.error(`Token refresh timed out after ${REFRESH_TIMEOUT_MS}ms`);
  return { status: "error" };
}
