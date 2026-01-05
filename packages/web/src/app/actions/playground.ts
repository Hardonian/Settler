'use server';

export interface DemoSummary {
  totalSource: number;
  totalTarget: number;
  matched: number;
  unmatchedSource: number;
  unmatchedTarget: number;
  matchRate: string;
}

export interface DemoMatch {
  id: string;
  sourceId: string;
  targetId: string;
  confidence: number;
  amount: number;
  currency: string;
  matchedFields: Record<string, any>;
  metadata: Record<string, any>;
}

export interface DemoUnmatched {
  id: string;
  externalId: string;
  source: string;
  occurredAt: string;
  amount: number;
  currency: string;
  description: string;
  type: string;
}

export interface DemoResult {
  runId: string;
  timestamp: string;
  summary: DemoSummary;
  matches: DemoMatch[];
  unmatchedSource: DemoUnmatched[];
  unmatchedTarget: DemoUnmatched[];
}

export async function runDemoSimulation(): Promise<DemoResult> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  // Try to hit the API. In dev, if API is on 3001, we might need to adjust.
  // We'll try a few common ports if localhost.
  const ports = [3000, 3001, 3002, 8080];
  
  for (const port of ports) {
    try {
      const baseUrl = API_URL.includes('localhost') ? `http://localhost:${port}` : API_URL;
      const response = await fetch(`${baseUrl}/api/v1/playground/demo-run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
        cache: 'no-store'
      });

      if (response.ok) {
        return await response.json() as DemoResult;
      }
    } catch (e) {
      // Continue to next port
    }
  }

  throw new Error('Could not connect to Settler API. Please ensure the backend is running.');
}
