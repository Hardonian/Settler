// XXE Prevention utilities
// Use these if XML parsing is added in the future

import { parseString } from "xml2js";

/**
 * Safely parse XML with XXE prevention
 *
 * IMPORTANT: Never enable external entities (noEnt: false)
 * This prevents XXE attacks that could read local files or perform SSRF
 *
 * @param xml - XML string to parse
 * @returns Parsed XML object (structure depends on input)
 */
export function safeParseXML(xml: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    parseString(
      xml,
      {
        explicitArray: false,
        mergeAttrs: true,
        explicitCharkey: false,
        trim: true,
        // CRITICAL: Disable external entities to prevent XXE
        // This is the default, but explicitly set for security
        // noEnt: false, // Must be false (default)
      },
      (err: Error | null, result: unknown) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });
}

/**
 * Validate XML before parsing to detect XXE attempts
 */
export function validateXMLForXXE(xml: string): { safe: boolean; reason?: string } {
  // Check for external entity declarations
  const externalEntityPattern = /<!ENTITY\s+\S+\s+SYSTEM\s+["']/i;
  if (externalEntityPattern.test(xml)) {
    return { safe: false, reason: "External entity declarations detected" };
  }

  // Check for file:// protocol
  if (xml.includes("file://")) {
    return { safe: false, reason: "file:// protocol detected" };
  }

  // Check for local file paths
  const localPathPattern = /(\.\.\/|\.\.\\|C:\\|\\etc\\|\\windows\\)/i;
  if (localPathPattern.test(xml)) {
    return { safe: false, reason: "Local file path detected" };
  }

  return { safe: true };
}

/**
 * Sanitize XML by removing dangerous patterns
 */
export function sanitizeXML(xml: string): string {
  // Remove DOCTYPE declarations (they can contain entity definitions)
  let sanitized = xml.replace(/<!DOCTYPE[^>]*>/gi, "");

  // Remove entity declarations
  sanitized = sanitized.replace(/<!ENTITY[^>]*>/gi, "");

  return sanitized;
}
