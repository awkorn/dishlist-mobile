import axios from "axios";
import { supabase } from "@services/supabase";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: API_BASE_URL,
  // Keep this short enough that a dead/flaky connection surfaces a retryable
  // error quickly instead of hanging the UI. 15s comfortably covers normal
  // requests on slow mobile networks.
  timeout: 15000,
});

// AI endpoints (image import, recipe generation) run LLM inference and can
// legitimately take much longer than a normal request. Pass this as a
// per-request timeout override for those calls only.
export const AI_REQUEST_TIMEOUT = 60000;

// Keep the access token in memory so requests don't pay an AsyncStorage
// read (supabase.auth.getSession) on every call. Supabase auto-refreshes
// the token and reports it through onAuthStateChange.
let cachedToken: string | null = null;
let tokenInitialized = false;

supabase.auth.onAuthStateChange((_event, session) => {
  cachedToken = session?.access_token ?? null;
  tokenInitialized = true;
});

api.interceptors.request.use(async (config) => {
  if (!tokenInitialized) {
    // First request(s) before the auth listener has fired: fall back to a
    // storage read once so early requests are still authenticated.
    const { data: { session } } = await supabase.auth.getSession();
    cachedToken = session?.access_token ?? null;
    tokenInitialized = true;
  }

  if (cachedToken) {
    config.headers.Authorization = `Bearer ${cachedToken}`;
  }

  return config;
});

export default api;
export { api };