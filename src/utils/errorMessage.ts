import axios from "axios";

/**
 * Turns an unknown thrown value into a user-facing message, distinguishing
 * the cases that matter for UX:
 *  - request timed out (slow/flaky connection)
 *  - couldn't reach the server (offline / server down)
 *  - server returned an error message (use it)
 *  - anything else (fall back to the provided default)
 *
 * @param error    the caught value
 * @param fallback default message for unrecognized errors
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    // Timeout: axios aborts with code ECONNABORTED when the request exceeds
    // its configured timeout.
    if (error.code === "ECONNABORTED" || /timeout/i.test(error.message)) {
      return "This is taking longer than expected. Please check your connection and try again.";
    }

    // No response at all means the request never reached the server.
    if (!error.response) {
      return "Can't reach the server. Please check your connection and try again.";
    }

    // Prefer a message the API explicitly returned.
    const serverMessage = error.response.data?.error;
    if (typeof serverMessage === "string" && serverMessage.trim()) {
      return serverMessage;
    }
  }

  return fallback;
}
