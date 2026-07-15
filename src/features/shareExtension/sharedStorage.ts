// App-Group-backed storage shared between the main app and the iOS share
// extension. Because app.json sets the `AppGroup` Info.plist key
// (group.com.dishlist.app), react-native-mmkv places this instance in the
// shared container, and MULTI_PROCESS mode keeps concurrent access from the
// two processes safe.
//
// This module is imported by the share-extension bundle — keep its import
// graph limited to React Native and react-native-mmkv.

import { NativeModules } from "react-native";
import { MMKV, Mode } from "react-native-mmkv";

interface SharedKeyValueStorage {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
}

function isExpoGo(): boolean {
  // Keep this check dependency-free because expo-constants is intentionally
  // excluded from the share-extension target. This is the same ownership
  // signal Expo-aware native libraries use to identify Expo Go.
  return (
    NativeModules.NativeUnimoduleProxy?.modulesConstants?.ExponentConstants
      ?.appOwnership === "expo"
  );
}

function createMemoryStorage(): SharedKeyValueStorage {
  const values = new Map<string, string>();
  return {
    getString: (key) => values.get(key),
    set: (key, value) => values.set(key, value),
    delete: (key) => values.delete(key),
  };
}

// Expo Go cannot load custom native modules such as MMKV or an iOS share
// extension. Keep the main app usable there for ordinary UI development; real
// dev/production builds and the extension continue to use App-Group MMKV.
export const sharedStorage: SharedKeyValueStorage = isExpoGo()
  ? createMemoryStorage()
  : new MMKV({
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
