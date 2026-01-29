/**
 * Component Input Validation
 *
 * Client-side validation for console components.
 */

/**
 * Validate API key format
 */
export function validateApiKeyFormat(key: string): {
  valid: boolean;
  error?: string;
} {
  if (!key || typeof key !== "string") {
    return { valid: false, error: "API key is required" };
  }

  if (!key.startsWith("rk_")) {
    return { valid: false, error: "API key must start with rk_" };
  }

  if (key.length < 20) {
    return { valid: false, error: "API key is too short" };
  }

  if (key.length > 200) {
    return { valid: false, error: "API key is too long" };
  }

  return { valid: true };
}

/**
 * Validate webhook URL
 */
export function validateWebhookUrl(url: string): {
  valid: boolean;
  error?: string;
} {
  if (!url || typeof url !== "string") {
    return { valid: false, error: "URL is required" };
  }

  try {
    const parsed = new URL(url);

    // Only allow HTTPS in production
    if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") {
      return { valid: false, error: "Webhook URLs must use HTTPS" };
    }

    // Validate length
    if (url.length > 2048) {
      return { valid: false, error: "URL is too long (max 2048 characters)" };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: "Invalid URL format" };
  }
}

/**
 * Validate support ticket input
 */
export function validateTicketInput(input: {
  subject: string;
  description: string;
  category: string;
}): {
  valid: boolean;
  errors?: string[];
} {
  const errors: string[] = [];

  if (!input.subject || input.subject.trim().length === 0) {
    errors.push("Subject is required");
  } else if (input.subject.length > 200) {
    errors.push("Subject must be 200 characters or less");
  }

  if (!input.description || input.description.trim().length === 0) {
    errors.push("Description is required");
  } else if (input.description.length > 5000) {
    errors.push("Description must be 5000 characters or less");
  }

  const validCategories = ["technical", "billing", "feature_request", "bug", "other"];
  if (!input.category || !validCategories.includes(input.category)) {
    errors.push(`Category must be one of: ${validCategories.join(", ")}`);
  }

  return {
    valid: errors.length === 0,
    ...(errors.length > 0 ? { errors } : {}),
  };
}
