/**
 * Small API-side environment accessor for services that must avoid importing
 * build-time validation modules at module initialization.
 */
export function getEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}
