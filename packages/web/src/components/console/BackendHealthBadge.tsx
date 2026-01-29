/**
 * Backend Health Badge
 * 
 * Shows backend connectivity status in the Console.
 * Calls authenticated healthcheck RPC when user is logged in.
 * Never throws from render path - always shows UI state.
 */

'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

interface HealthStatus {
  status: 'checking' | 'connected' | 'disconnected' | 'error';
  error?: string;
  details?: string;
}

export function BackendHealthBadge() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    status: 'checking',
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkHealth() {
      try {
        const supabase = createClient();
        
        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          // User not authenticated - don't show badge or show "not checked" state
          if (mounted) {
            setHealthStatus({
              status: 'disconnected',
              error: 'Not authenticated',
            });
          }
          return;
        }

        // User is authenticated - try healthcheck RPC
        try {
          const { error } = await supabase.rpc('healthcheck');
          
          if (error) {
            // RPC failed - could be RLS or backend issue
            if (mounted) {
              setHealthStatus({
                status: 'error',
                error: error.message || 'Healthcheck failed',
                details: `Code: ${error.code || 'unknown'}`,
              });
            }
          } else {
            // RPC succeeded
            if (mounted) {
              setHealthStatus({
                status: 'connected',
              });
            }
          }
        } catch (rpcError) {
          // RPC call threw an exception
          if (mounted) {
            setHealthStatus({
              status: 'error',
              error: rpcError instanceof Error ? rpcError.message : 'RPC call failed',
            });
          }
        }
      } catch (error: unknown) {
        // Top-level error - log but don't crash
        console.error('[BackendHealthBadge] Health check failed:', error);
        if (mounted) {
          setHealthStatus({
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    // Check health on mount
    checkHealth();

    // Poll every 30 seconds
    const interval = setInterval(() => {
      if (mounted) {
        checkHealth();
      }
    }, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Don't render if not authenticated or checking
  if (healthStatus.status === 'checking') {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Checking backend...</span>
      </div>
    );
  }

  if (healthStatus.status === 'disconnected') {
    return null; // Don't show badge if not authenticated
  }

  const isConnected = healthStatus.status === 'connected';
  const isError = healthStatus.status === 'error';

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 ${
          isConnected
            ? 'text-green-600 dark:text-green-400'
            : isError
            ? 'text-red-600 dark:text-red-400'
            : 'text-slate-600 dark:text-slate-400'
        }`}
      >
        {isConnected ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            <span>Backend Connected</span>
          </>
        ) : isError ? (
          <>
            <XCircle className="w-4 h-4" />
            <span>Backend Issue</span>
            {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </>
        ) : (
          <>
            <AlertCircle className="w-4 h-4" />
            <span>Backend Unknown</span>
          </>
        )}
      </Button>
      {isError && isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm shadow-lg min-w-[300px]">
          <p className="font-medium text-red-800 dark:text-red-200 mb-1">
            Backend Connection Error
          </p>
          <p className="text-red-700 dark:text-red-300 text-xs mb-2">
            {healthStatus.error}
          </p>
          {healthStatus.details && (
            <p className="text-red-600 dark:text-red-400 text-xs font-mono">
              {healthStatus.details}
            </p>
          )}
          <p className="text-red-600 dark:text-red-400 text-xs mt-2">
            This may affect some Console features. Please check your Supabase configuration.
          </p>
        </div>
      )}
    </div>
  );
}
