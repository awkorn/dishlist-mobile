// Extension-side API client: one bare-fetch call. No axios/react-query — the
// extension bundle must stay small and cold-start fast.

import { appendPendingImportId } from "./sharedStorage";
import { shareLog } from "./logger";

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
    shareLog.error(
      "EXPO_PUBLIC_API_URL is undefined in the extension bundle — rebuild the dev client after setting it in .env"
    );
    return { status: "error", message: "API URL not configured" };
  }

  const endpoint = `${apiBaseUrl}/recipes/import-from-social`;
  shareLog.info(`POST ${endpoint}`);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    shareLog.info(`Response status: ${response.status}`);

    if (response.status === 401 || response.status === 403) {
      return { status: "auth-failed" };
    }

    const data = (await response
      .json()
      .catch(() => ({}))) as { importId?: string; error?: string };

    if (response.status === 400) {
      shareLog.warn(`400 from server: ${data?.error ?? "no message"}`);
      return { status: "unsupported-url" };
    }
    if (!response.ok) {
      shareLog.error(
        `Server error ${response.status}: ${data?.error ?? "no message"}`
      );
      return { status: "error", message: data?.error };
    }

    if (data.importId) {
      shareLog.info(`Import accepted: ${data.importId}`);
      // Queue for main-app foreground reconciliation (covers users who
      // declined push permission).
      appendPendingImportId(data.importId);
    }
    return { status: "accepted" };
  } catch (error) {
    // Most commonly: EXPO_PUBLIC_API_URL points at localhost (unreachable from
    // a physical device — use the Mac's LAN IP), the API server isn't running,
    // or the 10s timeout fired.
    const name = (error as Error)?.name;
    const message = (error as Error)?.message ?? String(error);
    if (name === "TimeoutError") {
      shareLog.error(`Request timed out after ${REQUEST_TIMEOUT_MS}ms → ${endpoint}`);
    } else {
      shareLog.error(`Network request failed (${name}): ${message} → ${endpoint}`);
    }
    return { status: "error", message };
  }
}
