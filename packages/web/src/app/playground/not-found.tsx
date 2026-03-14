/**
 * Playground Not Found Page
 *
 * Shows when a playground route is not found.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function PlaygroundNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <CardTitle>Page Not Found</CardTitle>
          </div>
          <CardDescription>
            The playground page you're looking for doesn't exist.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The page you requested could not be found in the Playground.
          </p>
          <div className="flex gap-2">
            <Button asChild variant="default">
              <Link href="/playground">Go to Playground</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/console">Go to Console</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Go Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
