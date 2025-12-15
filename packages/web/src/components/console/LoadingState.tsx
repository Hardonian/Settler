/**
 * Loading State Component
 * 
 * Consistent loading UI across console pages.
 */

import { Card, CardContent } from '@/components/ui/card';

interface LoadingStateProps {
  message?: string;
  fullHeight?: boolean;
}

export function LoadingState({ message = 'Loading...', fullHeight = false }: LoadingStateProps) {
  return (
    <div className={fullHeight ? 'flex items-center justify-center min-h-[60vh]' : ''}>
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-electric-cyan mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">{message}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
