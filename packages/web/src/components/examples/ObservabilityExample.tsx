/**
 * Observability Integration Example
 * 
 * Example component demonstrating all observability features.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTrackCTA, useTrackForm } from '@/lib/telemetry/hooks';
import { useAnalytics } from '@/hooks/use-analytics';
import { fetchJSON, fetchWithFallback } from '@/lib/api/client';
import { logger } from '@/lib/logging/logger';
import { ErrorFallback, LoadingFallback } from '@/lib/resilience/fallbacks';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export function ObservabilityExample() {
  const trackCTA = useTrackCTA();
  const { start, submit } = useTrackForm('example_form');
  const { trackEvent, trackError } = useAnalytics();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Track CTA click
  const handleCTAClick = () => {
    trackCTA('Example CTA', { location: 'example_component' });
    trackEvent('example_cta_clicked', { component: 'ObservabilityExample' });
  };

  // Track form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    start();

    try {
      setLoading(true);
      setError(null);

      // Use defensive fetch
      const result = await fetchJSON('/api/example', {
        method: 'POST',
        body: JSON.stringify({ data: 'example' }),
      });

      setData(result);
      submit(true, { success: true });
      logger.info('Form submitted successfully', { form: 'example_form' });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      submit(false, { error: error.message });
      trackError(error, { component: 'ObservabilityExample', form: 'example_form' });
      logger.error('Form submission failed', error, { form: 'example_form' });
    } finally {
      setLoading(false);
    }
  };

  // Example with fallback data
  const handleFetchWithFallback = async () => {
    try {
      const result = await fetchWithFallback(
        '/api/data',
        { default: 'data' },
        { retries: 2 }
      );
      setData(result);
      logger.info('Data fetched with fallback', { hasFallback: true });
    } catch (err) {
      trackError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  return (
    <ErrorBoundary componentName="ObservabilityExample">
      <Card>
        <CardHeader>
          <CardTitle>Observability Example</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* CTA Tracking */}
          <div>
            <Button onClick={handleCTAClick}>
              Track CTA Click
            </Button>
          </div>

          {/* Form Tracking */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input placeholder="Enter data" />
            <Button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Form'}
            </Button>
          </form>

          {/* Defensive Fetching */}
          <div>
            <Button onClick={handleFetchWithFallback} variant="outline">
              Fetch with Fallback
            </Button>
          </div>

          {/* Loading State */}
          {loading && <LoadingFallback count={2} />}

          {/* Error State */}
          {error && (
            <ErrorFallback
              error={error}
              retry={() => {
                setError(null);
                handleSubmit(new Event('submit') as any);
              }}
            />
          )}

          {/* Data Display */}
          {data && (
            <div className="p-4 bg-muted rounded">
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
}
