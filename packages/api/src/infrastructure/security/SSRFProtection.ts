/**
 * SSRF Protection
 * Prevents Server-Side Request Forgery attacks
 */

import dns from 'dns';
import { promisify } from 'util';

const dnsLookup = promisify(dns.lookup);

// Private IP ranges (RFC 1918, RFC 4193, etc.)
const PRIVATE_IP_RANGES = [
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^127\./,
  /^::1$/,
  /^fc00:/,
  /^fe80:/,
];

// Reserved/localhost domains
const RESERVED_DOMAINS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
];

/**
 * Check if hostname is an internal IP
 */
export function isInternalIP(hostname: string): boolean {
  // Check if it's a reserved domain
  if (RESERVED_DOMAINS.includes(hostname.toLowerCase())) {
    return true;
  }

  // Check private IP ranges
  return PRIVATE_IP_RANGES.some((range) => range.test(hostname));
}

/**
 * Validate URL is safe for external requests
 */
export async function validateExternalUrl(url: string): Promise<boolean> {
  try {
    const parsed = new URL(url);

    // Must use HTTPS (except for localhost in dev)
    if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost') {
      return false;
    }

    // Check if hostname is internal
    if (isInternalIP(parsed.hostname)) {
      return false;
    }

    // Resolve DNS to check for internal IPs
    try {
      const { address } = await dnsLookup(parsed.hostname);
      if (isInternalIP(address)) {
        return false;
      }
    } catch (error) {
      // DNS lookup failed - reject to be safe
      return false;
    }

    return true;
  } catch (error) {
    // Invalid URL
    return false;
  }
}

/**
 * Check if URL is allowed (whitelist approach)
 */
export function isAllowedUrl(url: string, allowedDomains: string[] = []): boolean {
  try {
    const parsed = new URL(url);

    // If allowlist is empty, use general validation
    if (allowedDomains.length === 0) {
      return parsed.protocol === 'https:' && !isInternalIP(parsed.hostname);
    }

    // Check if hostname is in allowlist
    return allowedDomains.some((domain) => {
      return parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`);
    });
  } catch (error) {
    return false;
  }
}
