/**
 * Session-scoped API key memory for console playgrounds.
 * Avoids localStorage (XSS-exfiltrable persistence). Survives SPA navigation within the tab.
 */

const STORAGE_KEY = "settler:api-playground:api-key";

let memory: string | null = null;

function readSession(): string | null {
  if (typeof sessionStorage === "undefined") {
    return null;
  }
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeSession(value: string): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }
  try {
    sessionStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Quota or privacy mode — memory-only still works for this tab
  }
}

/** One-time move off legacy localStorage key (then delete local copy). */
export function migrateApiPlaygroundKeyFromLocalStorage(): void {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return;
  }
  try {
    const legacy = localStorage.getItem("api-playground-key");
    if (legacy) {
      setPlaygroundApiKey(legacy);
      localStorage.removeItem("api-playground-key");
    }
  } catch {
    /* ignore */
  }
}

export function getPlaygroundApiKey(): string {
  if (memory !== null) {
    return memory;
  }
  const fromSession = readSession();
  if (fromSession !== null) {
    memory = fromSession;
    return fromSession;
  }
  return "";
}

export function setPlaygroundApiKey(value: string): void {
  memory = value;
  writeSession(value);
}

export function clearPlaygroundApiKey(): void {
  memory = "";
  if (typeof sessionStorage !== "undefined") {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
}
