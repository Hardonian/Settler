/**
 * Node Version Check
 * 
 * Boot-time check that ensures Node version matches requirements.
 * Prevents runtime mismatches between local/CI/Vercel.
 */

const REQUIRED_NODE_VERSION = '24.0.0';
const REQUIRED_NODE_MAJOR = 24;

/**
 * Check Node version and return friendly error if mismatch
 */
export function checkNodeVersion(): { valid: boolean; error?: string } {
  // process.version is always defined in Node.js, but TypeScript types may not reflect this
  const nodeVersionRaw = process.version;
  if (!nodeVersionRaw || typeof nodeVersionRaw !== 'string') {
    return {
      valid: false,
      error: `Node.js version ${REQUIRED_NODE_VERSION} or higher is required. Unable to detect current version.`,
    };
  }
  const nodeVersion: string = nodeVersionRaw;
  const versionParts = nodeVersion.slice(1).split('.');
  const majorVersionStr = versionParts[0];
  if (!majorVersionStr || typeof majorVersionStr !== 'string') {
    return {
      valid: false,
      error: `Node.js version ${REQUIRED_NODE_VERSION} or higher is required. Unable to parse current version: ${nodeVersion}`,
    };
  }
  const majorVersion: number = parseInt(majorVersionStr, 10);
  if (isNaN(majorVersion)) {
    return {
      valid: false,
      error: `Node.js version ${REQUIRED_NODE_VERSION} or higher is required. Unable to parse major version from: ${nodeVersion}`,
    };
  }

  if (majorVersion < REQUIRED_NODE_MAJOR) {
    return {
      valid: false,
      error: `Node.js version ${REQUIRED_NODE_VERSION} or higher is required. Current version: ${nodeVersion}. Please upgrade Node.js.`,
    };
  }

  return { valid: true };
}

/**
 * Check Node version and throw if invalid
 * Call this at app startup
 */
export function requireNodeVersion(): void {
  const check = checkNodeVersion();
  if (!check.valid) {
    console.error('[Node Version Check]', check.error);
    throw new Error(check.error);
  }
}
