/**
 * Global type declarations for adapters package
 * Relaxes strict typing for third-party API responses
 */

// Override Response.json() to return any instead of unknown
interface Response {
  json(): Promise<any>;
}

// Override Body.json() as well for completeness
interface Body {
  json(): Promise<any>;
}
