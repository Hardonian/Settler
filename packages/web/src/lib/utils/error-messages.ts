/**
 * Error Message Utilities
 *
 * Converts technical error messages into user-friendly, actionable messages.
 */

export interface ErrorMessage {
  message: string;
  field?: string;
  actionable?: boolean;
}

/**
 * Convert Supabase auth errors to user-friendly messages
 */
export function getAuthErrorMessage(error: string | Error): string {
  const errorMessage = typeof error === "string" ? error : error.message;

  // Common Supabase auth errors
  const errorMap: Record<string, string> = {
    "User already registered": "An account with this email already exists. Please sign in instead.",
    "Email already exists": "An account with this email already exists. Please sign in instead.",
    "Invalid email": "Please enter a valid email address.",
    "Password should be at least 6 characters": "Password must be at least 8 characters long.",
    "Password is too weak":
      "Password is too weak. Please use a stronger password with at least 8 characters.",
    "Invalid login credentials":
      "Invalid email or password. Please check your credentials and try again.",
    "Email not confirmed": "Please check your email and confirm your account before signing in.",
    "Too many requests": "Too many attempts. Please wait a moment and try again.",
    "Network request failed": "Network error. Please check your connection and try again.",
    "Failed to create user": "Unable to create your account. Please try again or contact support.",
  };

  // Check for exact matches first
  if (errorMap[errorMessage]) {
    return errorMap[errorMessage];
  }

  // Check for partial matches (case-insensitive)
  const lowerError = errorMessage.toLowerCase();
  for (const [key, value] of Object.entries(errorMap)) {
    if (lowerError.includes(key.toLowerCase())) {
      return value;
    }
  }

  // Check for common patterns
  if (lowerError.includes("email")) {
    return "There was an issue with your email address. Please check it and try again.";
  }
  if (lowerError.includes("password")) {
    return "There was an issue with your password. Please ensure it's at least 8 characters long.";
  }
  if (lowerError.includes("network") || lowerError.includes("fetch")) {
    return "Network error. Please check your connection and try again.";
  }

  // Default fallback
  return "Something went wrong. Please try again or contact support if the problem persists.";
}

/**
 * Get field-specific validation error message
 */
export function getFieldErrorMessage(field: string, error: string): string {
  const fieldErrorMap: Record<string, Record<string, string>> = {
    email: {
      required: "Email is required",
      invalid: "Please enter a valid email address",
      exists: "An account with this email already exists",
    },
    password: {
      required: "Password is required",
      minLength: "Password must be at least 8 characters long",
      weak: "Password is too weak. Use a mix of letters, numbers, and symbols.",
    },
    name: {
      required: "Name is required",
      invalid: "Please enter a valid name",
    },
  };

  return fieldErrorMap[field]?.[error] || error;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email) {
    return { valid: false, error: "Email is required" };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: "Please enter a valid email address" };
  }
  return { valid: true };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  valid: boolean;
  error?: string;
  strength?: "weak" | "medium" | "strong";
} {
  if (!password) {
    return { valid: false, error: "Password is required" };
  }
  if (password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters long" };
  }

  // Calculate strength
  let strength: "weak" | "medium" | "strong" = "weak";
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score >= 5) strength = "strong";
  else if (score >= 3) strength = "medium";

  return { valid: true, strength };
}
