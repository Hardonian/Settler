/**
 * API Call Logs Page
 * 
 * Developer console page for viewing API call logs and statistics.
 */

import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { requireConsoleAccess } from '@/lib/auth/console-gate';
import { ApiLogsViewer } from '@/components/console/ApiLogsViewer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function ApiLogsContent() {
  // Require console access (auth + subscription)
  await requireConsoleAccess();
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null; // Should not reach here due to requireConsoleAccess
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          API Call Logs
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          View and analyze API requests made to Settler APIs.
        </p>
      </div>
      
      <ApiLogsViewer />
    </div>
  );
}

export default function ApiLogsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-electric-cyan mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading API logs...</p>
          </div>
        </div>
      }
    >
      <ApiLogsContent />
    </Suspense>
  );
}
