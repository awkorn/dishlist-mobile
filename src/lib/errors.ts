// ============================================================================
// Supabase Auth Error Mapping
// ============================================================================

interface ErrorMapping {
  message: string;
  action?: string;
}

const authErrorMap: Record<string, ErrorMapping> = {
  "Invalid login credentials": {
    message: "Email or password is incorrect",
    action: "Please check your credentials and try again",
  },
  "Email not confirmed": {
    message: "Please verify your email address",
    action: "Check your inbox for a verification link",
  },
  "User already registered": {
    message: "An account with this email already exists",
    action: "Try logging in instead",
  },
  "Password should be at least 6 characters": {
    message: "Password is too weak",
    action: "Use at least 6 characters",
  },
  "Email rate limit exceeded": {
    message: "Too many attempts",
    action: "Please try again later",
  },
  "For security purposes, you can only request this once every 60 seconds": {
    message: "Please wait before trying again",
    action: "Try again in 60 seconds",
  },
  "Unable to validate email address: invalid format": {
    message: "Please enter a valid email address",
  },
};


// ============================================================================
// API Error Mapping
// ============================================================================

const apiErrorMap: Record<number, ErrorMapping> = {
  400: {
    message: 'Invalid request',
    action: 'Please check your input and try again',
  },
  401: {
    message: 'Session expired',
    action: 'Please log in again',
  },
  403: {
    message: 'Access denied',
    action: "You don't have permission to do this",
  },
  404: {
    message: 'Not found',
    action: "The item you're looking for doesn't exist",
  },
  409: {
    message: 'Conflict',
    action: 'This item already exists',
  },
  422: {
    message: 'Validation failed',
    action: 'Please check your input',
  },
  429: {
    message: 'Too many requests',
    action: 'Please slow down and try again in a moment',
  },
  500: {
    message: 'Server error',
    action: 'Something went wrong on our end. Please try again',
  },
  503: {
    message: 'Service unavailable',
    action: "We're experiencing issues. Please try again soon",
  },
};

// ============================================================================
// Error Extraction Functions
// ============================================================================

/**
 * Get a user-friendly error message from a Supabase auth error.
 * Supabase returns error messages as strings (not codes like Firebase).
 */
export const getAuthErrorMessage = (
  error: { code?: string; message?: string } | string
): ErrorMapping => {
  const errorMessage = typeof error === "string"
    ? error
    : error.message || error.code || "";

  // Check for exact match first
  if (authErrorMap[errorMessage]) {
    return authErrorMap[errorMessage];
  }

  // Check for partial matches (Supabase error messages can vary slightly)
  for (const [key, mapping] of Object.entries(authErrorMap)) {
    if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
      return mapping;
    }
  }

  // Fallback
  return {
    message: "Something went wrong",
    action: "Please try again",
  };
};

export function getApiErrorMessage(error: any): ErrorMapping {
  if (error?.response?.data?.error) {
    return {
      message: error.response.data.error,
    };
  }

  const status = error?.response?.status;
  if (status && apiErrorMap[status]) {
    return apiErrorMap[status];
  }

  if (!error?.response) {
    return {
      message: 'No internet connection',
      action: 'Check your connection and try again',
    };
  }

  return {
    message: 'Something went wrong',
    action: 'Please try again',
  };
}

export function getErrorMessage(error: any): string {
  if (typeof error === "string" || error?.code?.startsWith("auth")) {
    const authError = getAuthErrorMessage(error);
    return authError.action
      ? `${authError.message}. ${authError.action}`
      : authError.message;
  }

  const apiError = getApiErrorMessage(error);
  return apiError.action
    ? `${apiError.message}. ${apiError.action}`
    : apiError.message;
}