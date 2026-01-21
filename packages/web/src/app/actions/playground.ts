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
  matchedFields: Record<string, unknown>;
  metadata: Record<string, unknown>;
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === 'string';

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isDemoSummary = (value: unknown): value is DemoSummary =>
  isRecord(value) &&
  isNumber(value.totalSource) &&
  isNumber(value.totalTarget) &&
  isNumber(value.matched) &&
  isNumber(value.unmatchedSource) &&
  isNumber(value.unmatchedTarget) &&
  isString(value.matchRate);

const isDemoMatch = (value: unknown): value is DemoMatch =>
  isRecord(value) &&
  isString(value.id) &&
  isString(value.sourceId) &&
  isString(value.targetId) &&
  isNumber(value.confidence) &&
  isNumber(value.amount) &&
  isString(value.currency) &&
  isRecord(value.matchedFields) &&
  isRecord(value.metadata);

const isDemoUnmatched = (value: unknown): value is DemoUnmatched =>
  isRecord(value) &&
  isString(value.id) &&
  isString(value.externalId) &&
  isString(value.source) &&
  isString(value.occurredAt) &&
  isNumber(value.amount) &&
  isString(value.currency) &&
  isString(value.description) &&
  isString(value.type);

const isDemoResult = (value: unknown): value is DemoResult =>
  isRecord(value) &&
  isString(value.runId) &&
  isString(value.timestamp) &&
  isDemoSummary(value.summary) &&
  Array.isArray(value.matches) &&
  value.matches.every(isDemoMatch) &&
  Array.isArray(value.unmatchedSource) &&
  value.unmatchedSource.every(isDemoUnmatched) &&
  Array.isArray(value.unmatchedTarget) &&
  value.unmatchedTarget.every(isDemoUnmatched);

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
        const payload: unknown = await response.json();
        if (isDemoResult(payload)) {
          return payload;
        }
        throw new Error('Unexpected demo response payload');
      }
    } catch (e) {
      // Continue to next port
    }
  }

  throw new Error('Could not connect to Settler API. Please ensure the backend is running.');
}
