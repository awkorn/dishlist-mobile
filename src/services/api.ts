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

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  
  return config;
});

export default api;
export { api };