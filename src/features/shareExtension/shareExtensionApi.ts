// Extension-side API client: one bare-fetch call. No axios/react-query — the
// extension bundle must stay small and cold-start fast.

import { appendPendingImportId } from "./sharedStorage";

const REQUEST_TIMEOUT_MS = 10_000;

const SUPPORTED_HOST_PATTERN =
  /(^|\.)(tiktok\.com|instagram\.com|instagr\.am|facebook\.com|fb\.com|fb\.watch)$/i;

/** Mirror of the server's platform allowlist for a fast local rejection. */
export function isSupportedSocialUrl(url: string): boolean {
  try {
    return SUPPORTED_HOST_PATTERN.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

export function extractSharedUrl(initialProps: {
  url?: string;
  text?: string;
}): string | null {
  if (initialProps.url) return initialProps.url;
  const match = initialProps.text?.match(/https?:\/\/[^\s"'<>]+/i);
  return match ? match[0] : null;
}

export type StartImportResult =
  | { status: "accepted" }
  | { status: "auth-failed" }
  | { status: "unsupported-url" }
  | { status: "error"; message?: string };

export async function startSocialImport(
  url: string,
  accessToken: string
): Promise<StartImportResult> {
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!apiBaseUrl) {
    return { status: "error" };
  }

  try {
    const response = await fetch(`${apiBaseUrl}/recipes/import-from-social`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (response.status === 401 || response.status === 403) {
      return { status: "auth-failed" };
    }

    const data = (await response
      .json()
      .catch(() => ({}))) as { importId?: string; error?: string };

    if (response.status === 400) {
      return { status: "unsupported-url" };
    }
    if (!response.ok) {
      return { status: "error", message: data?.error };
    }

    if (data.importId) {
      // Queue for main-app foreground reconciliation (covers users who
      // declined push permission).
      appendPendingImportId(data.importId);
    }
    return { status: "accepted" };
  } catch {
    return { status: "error" };
  }
}
