// Extension-side API client: one bare-fetch call. No axios/react-query — the
// extension bundle must stay small and cold-start fast.

import { appendPendingImportId } from "./sharedStorage";
import { shareLog } from "./logger";

const REQUEST_TIMEOUT_MS = 10_000;

const SUPPORTED_HOST_PATTERN =
  /(^|\.)(tiktok\.com|instagram\.com|instagr\.am|facebook\.com|fb\.com|fb\.watch|youtube\.com|youtu\.be|pinterest\.com|pin\.it)$/i;

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
  const candidates = [
    ...(initialProps.url ? [initialProps.url] : []),
    ...[...(initialProps.text ?? "").matchAll(/https?:\/\/[^\s"'<>]+/gi)].map(
      (match) => match[0].replace(/[).,!?]+$/, "")
    ),
  ];
  return candidates.find(isSupportedSocialUrl) ?? null;
}

export type StartImportResult =
  | { status: "accepted"; importId: string }
  | { status: "already-saved"; importId: string; recipeId: string }
  | { status: "rate-limited"; message: string; retryAfterSeconds?: number }
  | { status: "auth-failed" }
  | { status: "unsupported-url" }
  | { status: "error"; message: string; kind: "network" | "server" | "config" };

export async function startSocialImport(
  url: string,
  accessToken: string
): Promise<StartImportResult> {
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!apiBaseUrl) {
    shareLog.error(
      "EXPO_PUBLIC_API_URL is undefined in the extension bundle — rebuild the dev client after setting it in .env"
    );
    return { status: "error", message: "DishList needs to be rebuilt before sharing.", kind: "config" };
  }

  const endpoint = `${apiBaseUrl}/recipes/import-from-social`;
  shareLog.info(`POST ${endpoint}`);

  // Manual AbortController + setTimeout instead of AbortSignal.timeout, which
  // is undefined in React Native's Hermes runtime.
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ url }),
      signal: controller.signal,
    });

    shareLog.info(`Response status: ${response.status}`);

    if (response.status === 401 || response.status === 403) {
      return { status: "auth-failed" };
    }

    const data = (await response
      .json()
      .catch(() => ({}))) as {
        importId?: string;
        recipeId?: string;
        alreadySaved?: boolean;
        error?: string;
        code?: string;
        retryAfterSeconds?: number;
      };

    if (response.status === 400) {
      shareLog.warn(`400 from server: ${data?.error ?? "no message"}`);
      return { status: "unsupported-url" };
    }
    if (response.status === 429) {
      return {
        status: "rate-limited",
        message: data.error ?? "Too many imports. Please try again later.",
        retryAfterSeconds: data.retryAfterSeconds,
      };
    }
    if (!response.ok) {
      shareLog.error(
        `Server error ${response.status}: ${data?.error ?? "no message"}`
      );
      return {
        status: "error",
        message: data?.error ?? "DishList couldn't start this import.",
        kind: "server",
      };
    }

    if (!data.importId) {
      return {
        status: "error",
        message: "DishList returned an incomplete response. Please try again.",
        kind: "server",
      };
    }
    shareLog.info(`Import accepted: ${data.importId}`);
    if (data.alreadySaved && data.recipeId) {
      return {
        status: "already-saved",
        importId: data.importId,
        recipeId: data.recipeId,
      };
    }
    appendPendingImportId(data.importId);
    return { status: "accepted", importId: data.importId };
  } catch (error) {
    // Most commonly: the API server isn't running/reachable at that LAN IP,
    // or the request exceeded REQUEST_TIMEOUT_MS (controller.abort → AbortError).
    const name = (error as Error)?.name;
    const message = (error as Error)?.message ?? String(error);
    if (timedOut) {
      shareLog.error(`Request timed out after ${REQUEST_TIMEOUT_MS}ms → ${endpoint}`);
    } else {
      shareLog.error(`Network request failed (${name}): ${message} → ${endpoint}`);
    }
    return {
      status: "error",
      message: timedOut
        ? "The connection timed out. Please try again."
        : "DishList couldn't connect. Check your connection and try again.",
      kind: "network",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
