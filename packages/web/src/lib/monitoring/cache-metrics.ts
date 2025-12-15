/**
 * Cache Metrics Tracking
 */

export async function trackCacheMetric(
  type: 'hit' | 'miss' | 'set' | 'invalidate' | 'error',
  key: string
): Promise<void> {
  // Track cache metrics for monitoring
  // Can integrate with your metrics system (e.g., Datadog, Prometheus)
  
  const metric = {
    type: 'cache',
    operation: type,
    key: key.substring(0, 100), // Limit key length
    timestamp: new Date().toISOString(),
  };

  // Log for now, can be sent to metrics service
  if (type === 'error') {
    console.error('[Cache Metric]', JSON.stringify(metric));
  } else {
    console.debug('[Cache Metric]', JSON.stringify(metric));
  }
}
