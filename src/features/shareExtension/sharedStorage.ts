// App-Group-backed storage shared between the main app and the iOS share
// extension. Because app.json sets the `AppGroup` Info.plist key
// (group.com.dishlist.app), react-native-mmkv places this instance in the
// shared container, and MULTI_PROCESS mode keeps concurrent access from the
// two processes safe.
//
// This module is imported by the share-extension bundle — keep its import
// graph to react-native-mmkv only.

import { MMKV, Mode } from "react-native-mmkv";

export const sharedStorage = new MMKV({
  id: "dishlist-shared",
  mode: Mode.MULTI_PROCESS,
});

const SESSION_KEY = "supabase.sharedSession";
const PENDING_IMPORTS_KEY = "socialImport.pendingIds";

export interface SharedSession {
  accessToken: string;
  refreshToken: string;
  /** Epoch seconds (Supabase session.expires_at). */
  expiresAt: number;
  /** Epoch ms of the last write — newest copy wins between processes. */
  updatedAt: number;
}

export function readSharedSession(): SharedSession | null {
  const raw = sharedStorage.getString(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SharedSession;
    if (
      typeof parsed?.accessToken !== "string" ||
      typeof parsed?.refreshToken !== "string" ||
      typeof parsed?.expiresAt !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeSharedSession(
  session: Omit<SharedSession, "updatedAt">
): void {
  sharedStorage.set(
    SESSION_KEY,
    JSON.stringify({ ...session, updatedAt: Date.now() })
  );
}

export function clearSharedSession(): void {
  sharedStorage.delete(SESSION_KEY);
}

/** Import ids created by the share extension, awaiting main-app reconciliation. */
export function readPendingImportIds(): string[] {
  const raw = sharedStorage.getString(PENDING_IMPORTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export function appendPendingImportId(importId: string): void {
  const ids = readPendingImportIds();
  if (!ids.includes(importId)) {
    // Cap the backlog — anything older is stale far beyond the server's
    // 10-minute processing backstop.
    sharedStorage.set(
      PENDING_IMPORTS_KEY,
      JSON.stringify([...ids, importId].slice(-10))
    );
  }
}

export function removePendingImportId(importId: string): void {
  const ids = readPendingImportIds().filter((id) => id !== importId);
  sharedStorage.set(PENDING_IMPORTS_KEY, JSON.stringify(ids));
}
