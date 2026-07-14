// Mirrors the Supabase session into App-Group shared storage so the iOS share
// extension (separate process) can authenticate API calls, and adopts rotated
// sessions written back by the extension.
//
// Two directions:
//  1. app → extension: every auth state change writes {access, refresh,
//     expiresAt} to shared MMKV (cleared on sign-out).
//  2. extension → app: the extension refreshes an expired token directly
//     against Supabase, which ROTATES the refresh token. On foreground the app
//     adopts any newer shared session via setSession() so its own (now stale)
//     refresh token is replaced before it tries to use it.
//
// Wired up once via initSharedSessionSync() in App.tsx.

import { AppState } from "react-native";
import { supabase } from "@services/supabase";
import {
  clearSharedSession,
  readSharedSession,
  writeSharedSession,
} from "@features/shareExtension/sharedStorage";

let lastMirroredAccessToken: string | null = null;
let initialized = false;

export function initSharedSessionSync(): void {
  if (initialized) return;
  initialized = true;

  supabase.auth.onAuthStateChange((_event, session) => {
    if (!session) {
      lastMirroredAccessToken = null;
      clearSharedSession();
      return;
    }
    if (
      session.access_token === lastMirroredAccessToken ||
      !session.refresh_token ||
      !session.expires_at
    ) {
      return;
    }
    lastMirroredAccessToken = session.access_token;
    writeSharedSession({
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: session.expires_at,
    });
  });

  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      void adoptNewerSharedSession();
    }
  });
  void adoptNewerSharedSession();
}

async function adoptNewerSharedSession(): Promise<void> {
  try {
    const shared = readSharedSession();
    if (!shared) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return; // Signed out locally — don't resurrect a session.
    if (shared.accessToken === session.access_token) return;

    // The extension only ever writes after a successful refresh, so a
    // differing shared token that expires later than ours is the newer one.
    if ((session.expires_at ?? 0) >= shared.expiresAt) return;

    const { error } = await supabase.auth.setSession({
      access_token: shared.accessToken,
      refresh_token: shared.refreshToken,
    });
    if (error) {
      console.warn("Failed to adopt shared session:", error.message);
    }
  } catch (error) {
    console.warn("Shared session adoption failed:", error);
  }
}
