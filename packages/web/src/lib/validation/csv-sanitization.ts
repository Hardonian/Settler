/**
 * Sanitizes a string to prevent CSV Formula Injection.
 * If the value starts with '=', '+', '-', or '@', it prepends a single quote.
 */
export function sanitizeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";

  let strValue = typeof value === "object" ? JSON.stringify(value) : String(value);

  if (/^[=+\-@]/.test(strValue)) {
    strValue = "'" + strValue;
  }

  // Escape double quotes by doubling them, and wrap in double quotes if there are commas or quotes
  if (strValue.includes('"') || strValue.includes(",")) {
    strValue = `"${strValue.replace(/"/g, '""')}"`;
  }

  return strValue;
}
