import { NextResponse } from 'next/server';

export async function POST() {
  // Simulate job start
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return NextResponse.json({
    jobId: `job_${Date.now()}`,
    status: 'running',
    progress: 0
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');
  
  if (!jobId) {
    return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
  }

  // Deterministic simulation based on time elapsed since job creation
  const parts = jobId.split('_');
  if (parts.length < 2) {
     return NextResponse.json({ error: 'Invalid Job ID' }, { status: 400 });
  }
  
  const startTime = parseInt(parts[1], 10);
  const elapsed = Date.now() - startTime;
  
  // Simulation duration: 3 seconds
  const duration = 3000;
  const progress = Math.min(100, Math.floor((elapsed / duration) * 100));
  
  if (progress < 100) {
    return NextResponse.json({
      jobId,
      status: 'running',
      progress,
      logs: [
        elapsed > 500 && "Fetching source data from Stripe...",
        elapsed > 1000 && "Fetching target data from Database...",
        elapsed > 1500 && "Running matching rules...",
        elapsed > 2000 && "Identifying conflicts...",
      ].filter(Boolean)
    });
  }

  return NextResponse.json({
    jobId,
    status: 'completed',
    progress: 100,
    result: {
      matched: 142,
      unmatched: 3,
      conflicts: 1,
      accuracy: "97.9%"
    }
  });
}
