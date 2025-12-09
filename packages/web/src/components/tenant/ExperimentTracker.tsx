/**
 * Experiment Tracker Client Component
 * 
 * Tracks experiment views client-side.
 */

'use client';

import { useEffect } from 'react';

interface ExperimentTrackerProps {
  experimentId: string;
  variantKey: string | null;
}

export function ExperimentTrackerClient({
  experimentId,
  variantKey,
}: ExperimentTrackerProps) {
  useEffect(() => {
    if (!variantKey) return;
    
    // Track view event
    fetch('/api/experiments/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        experimentId,
        variantKey,
        eventType: 'view',
      }),
    }).catch(console.error);
  }, [experimentId, variantKey]);
  
  return null;
}
