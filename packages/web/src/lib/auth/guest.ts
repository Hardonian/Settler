/**
 * Guest Session Management
 * 
 * Provides instant access without signup friction.
 * Uses Supabase anonymous auth if available, otherwise falls back to session storage.
 */

import { createClient } from '@/lib/supabase/client';
import { safeAsync } from '@/lib/safe';

export interface GuestSession {
  id: string;
  createdAt: string;
  isAnonymous: boolean;
}

const GUEST_SESSION_KEY = 'settler_guest_session';

/**
 * Initialize guest session
 * Attempts anonymous auth, falls back to local session if unavailable
 */
export async function initGuestSession(): Promise<GuestSession> {
  // Check for existing session
  const existing = getGuestSession();
  if (existing) {
    return existing;
  }
  
  // Try Supabase anonymous auth
  const supabaseResult = await safeAsync(async () => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInAnonymously();
    
    if (error) {
      throw error;
    }
    
    return {
      id: data.user?.id || generateGuestId(),
      createdAt: new Date().toISOString(),
      isAnonymous: true,
    } as GuestSession;
  });
  
  if (supabaseResult) {
    // Store session
    if (typeof window !== 'undefined') {
      localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(supabaseResult));
    }
    return supabaseResult;
  }
  
  // Fallback to local session
  const guestSession: GuestSession = {
    id: generateGuestId(),
    createdAt: new Date().toISOString(),
    isAnonymous: false,
  };
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(guestSession));
  }
  
  return guestSession;
}

/**
 * Get current guest session
 */
export function getGuestSession(): GuestSession | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    const stored = localStorage.getItem(GUEST_SESSION_KEY);
    if (stored) {
      return JSON.parse(stored) as GuestSession;
    }
  } catch {
    // Ignore parse errors
  }
  
  return null;
}

/**
 * Check if user has guest session
 */
export function hasGuestSession(): boolean {
  return getGuestSession() !== null;
}

/**
 * Clear guest session
 */
export function clearGuestSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(GUEST_SESSION_KEY);
  }
}

/**
 * Generate a unique guest ID
 */
function generateGuestId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}
