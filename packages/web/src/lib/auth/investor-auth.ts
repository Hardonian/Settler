/**
 * Investor Metrics API Authentication
 * Protects investor metrics endpoints
 */

import { NextRequest } from 'next/server';
// TODO: Install next-auth package or use alternative auth
// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/lib/auth/next-auth-config';

export interface AuthResult {
  authorized: boolean;
  userId?: string;
  error?: string;
}

/**
 * Check if request is authorized for investor metrics
 */
export async function checkInvestorAuth(request: NextRequest): Promise<AuthResult> {
  // Option 1: Check for API key in header
  const apiKey = request.headers.get('x-investor-api-key');
  const validApiKey = process.env.INVESTOR_API_KEY;
  
  if (apiKey && validApiKey && apiKey === validApiKey) {
    return {
      authorized: true,
    };
  }

  // Option 2: Check for authenticated session with admin role
  // TODO: Re-enable when next-auth is installed
  // try {
  //   const session = await getServerSession(authOptions);
  //   
  //   if (session?.user) {
  //     // Check if user has investor/admin role
  //     // TODO: Implement role checking based on your auth system
  //     const userRoles = (session.user as any).roles || [];
  //     
  //     if (userRoles.includes('admin') || userRoles.includes('investor')) {
  //       return {
  //         authorized: true,
  //         userId: session.user.id || session.user.email,
  //       };
  //     }
  //   }
  // } catch (error) {
  //   // Session check failed, continue to API key check
  // }

  return {
    authorized: false,
    error: 'Unauthorized. Valid API key or admin session required.',
  };
}

/**
 * Require investor auth (throws if not authorized)
 */
export async function requireInvestorAuth(request: NextRequest): Promise<void> {
  const auth = await checkInvestorAuth(request);
  
  if (!auth.authorized) {
    throw new Error(auth.error || 'Unauthorized');
  }
}
