/**
 * Local Development Banner
 * 
 * Shows a subtle banner when running in development mode to help
 * users understand they're in a local environment.
 */

'use client';

import { Terminal, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function LocalDevBanner() {
  const [dismissed, setDismissed] = useState(false);
  
  if (dismissed) return null;
  
  return (
    <div className="bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800 px-4 py-2">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-sm">
          <Terminal className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span className="text-amber-800 dark:text-amber-200">
            <span className="font-medium">Local Development</span>
            {' '}- Changes here won't affect production. 
            <Link 
              href="/console/setup-check" 
              className="underline hover:text-amber-900 dark:hover:text-amber-100 ml-1"
            >
              Setup check
            </Link>
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDismissed(true)}
          className="h-6 px-2 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
