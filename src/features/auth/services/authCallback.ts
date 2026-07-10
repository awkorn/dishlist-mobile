export type AuthCallback =
  | { kind: "none" }
  | { kind: "error"; message: string; isRecovery: boolean }
  | { kind: "code"; code: string; isRecovery: boolean }
  | {
      kind: "tokens";
      accessToken: string;
      refreshToken: string;
      isRecovery: boolean;
    };

const RESET_PASSWORD_PATH = "reset-password";

const readParam = (
  query: URLSearchParams,
  fragment: URLSearchParams,
  name: string
) => query.get(name) ?? fragment.get(name);

const isResetPasswordUrl = (url: URL, type: string | null) => {
  const pathParts = [url.hostname, ...url.pathname.split("/")].filter(Boolean);
  return type === "recovery" || pathParts.includes(RESET_PASSWORD_PATH);
};

/**
 * Parse an auth callback delivered by Expo Linking. Supabase's implicit flow
 * returns tokens in the URL fragment, while PKCE returns a query-string code.
 * Supporting both keeps existing links valid and makes the callback resilient
 * if the project changes auth flow later.
 */
export const parseAuthCallback = (url: string): AuthCallback => {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    return { kind: "none" };
  }

  const query = new URLSearchParams(parsed.search);
  const fragment = new URLSearchParams(parsed.hash.replace(/^#/, ""));
  const type = readParam(query, fragment, "type");
  const isRecovery = isResetPasswordUrl(parsed, type);
  const error =
    readParam(query, fragment, "error_description") ??
    readParam(query, fragment, "error");

  if (error) {
    return { kind: "error", message: error, isRecovery };
  }

  const code = readParam(query, fragment, "code");
  if (code) {
    return { kind: "code", code, isRecovery };
  }

  const accessToken = readParam(query, fragment, "access_token");
  const refreshToken = readParam(query, fragment, "refresh_token");

  if (accessToken && refreshToken) {
    return {
      kind: "tokens",
      accessToken,
      refreshToken,
      isRecovery,
    };
  }

  if (accessToken || refreshToken || isRecovery) {
    return {
      kind: "error",
      message: "Email link is invalid or has expired",
      isRecovery,
    };
  }

  return { kind: "none" };
};
