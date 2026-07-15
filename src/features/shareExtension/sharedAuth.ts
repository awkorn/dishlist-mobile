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

export type SharedAuthResult =
  | { status: "ok"; accessToken: string }
  | { status: "signed-out" }
  | { status: "error" };

export async function getShareExtensionAccessToken(): Promise<SharedAuthResult> {
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
  if (session.expiresAt > nowSec + EXPIRY_MARGIN_SEC) {
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

  try {
    const response = await fetch(
      `${supabaseUrl}/auth/v1/token?grant_type=refresh_token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: anonKey,
        },
        body: JSON.stringify({ refresh_token: session.refreshToken }),
      }
    );

    if (response.status === 400 || response.status === 401) {
      // Refresh token revoked/expired — the user must open the app to sign in.
      shareLog.warn(`Token refresh rejected (${response.status}) — signing out`);
      return { status: "signed-out" };
    }
    if (!response.ok) {
      shareLog.error(`Token refresh failed with status ${response.status}`);
      return { status: "error" };
    }

    const data = (await response.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_at?: number;
      expires_in?: number;
    };
    if (!data.access_token || !data.refresh_token) {
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
      `Token refresh threw: ${(error as Error)?.message ?? String(error)}`
    );
    return { status: "error" };
  }
}
