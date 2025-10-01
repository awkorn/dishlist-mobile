// ============================================================================
// Firebase Auth Error Mapping
// ============================================================================

interface ErrorMapping {
  message: string;
  action?: string;
}

const authErrorMap: Record<string, ErrorMapping> = {
  'auth/invalid-email': {
    message: 'Please enter a valid email address',
  },
  'auth/user-disabled': {
    message: 'This account has been disabled',
    action: 'Contact support for help',
  },
  'auth/user-not-found': {
    message: 'No account found with this email',
    action: 'Check your email or sign up',
  },
  'auth/wrong-password': {
    message: 'Incorrect password',
    action: 'Try again or reset your password',
  },
  'auth/invalid-credential': {
    message: 'Email or password is incorrect',
    action: 'Please check your credentials and try again',
  },
  'auth/too-many-requests': {
    message: 'Too many failed attempts',
    action: 'Please try again later or reset your password',
  },
  
  // Sign up errors
  'auth/email-already-in-use': {
    message: 'An account with this email already exists',
    action: 'Try logging in instead',
  },
  'auth/weak-password': {
    message: 'Password is too weak',
    action: 'Use at least 6 characters',
  },
  'auth/operation-not-allowed': {
    message: 'Email/password sign-in is not enabled',
    action: 'Contact support',
  },
  
  // Network errors
  'auth/network-request-failed': {
    message: 'Connection error',
    action: 'Check your internet connection and try again',
  },
  'auth/timeout': {
    message: 'Request timed out',
    action: 'Please try again',
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
    action: 'The item you\'re looking for doesn\'t exist',
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
    action: 'We\'re experiencing issues. Please try again soon',
  },
};

// ============================================================================
// Error Extraction Functions
// ============================================================================

/**
 * Extract user-friendly error from Firebase Auth error
 */
export function getAuthErrorMessage(error: any): ErrorMapping {
  // Extract Firebase error code
  const code = error?.code || '';
  
  // Check if we have a mapping for this error
  if (authErrorMap[code]) {
    return authErrorMap[code];
  }
  
  // Check for network errors
  if (error?.message?.includes('network') || error?.message?.includes('connection')) {
    return {
      message: 'Connection error',
      action: 'Check your internet and try again',
    };
  }
  
  // Default fallback
  return {
    message: 'Something went wrong',
    action: 'Please try again',
  };
}

/**
 * Extract user-friendly error from API error
 */
export function getApiErrorMessage(error: any): ErrorMapping {
  // Check for specific error message from backend
  if (error?.response?.data?.error) {
    return {
      message: error.response.data.error,
    };
  }
  
  // Check HTTP status code
  const status = error?.response?.status;
  if (status && apiErrorMap[status]) {
    return apiErrorMap[status];
  }
  
  // Check for network errors
  if (!error?.response) {
    return {
      message: 'No internet connection',
      action: 'Check your connection and try again',
    };
  }
  
  // Default fallback
  return {
    message: 'Something went wrong',
    action: 'Please try again',
  };
}

/**
 * Get a simple error message string (for backward compatibility)
 */
export function getErrorMessage(error: any): string {
  const authError = getAuthErrorMessage(error);
  const apiError = getApiErrorMessage(error);
  
  // Try auth error first, then API error
  if (error?.code?.startsWith('auth/')) {
    return authError.action 
      ? `${authError.message}. ${authError.action}`
      : authError.message;
  }
  
  return apiError.action
    ? `${apiError.message}. ${apiError.action}`
    : apiError.message;
}