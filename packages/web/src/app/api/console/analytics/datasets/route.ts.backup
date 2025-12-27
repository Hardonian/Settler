/**
 * Analytics Datasets API
 * 
 * Get available datasets and their schemas
 */

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth-gate';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DATASET_SCHEMAS = {
  usage: {
    name: 'Usage',
    description: 'API usage, jobs, events, and errors',
    dimensions: [
      { name: 'date', type: 'date', description: 'Event date' },
      { name: 'org', type: 'string', description: 'Organization ID' },
      { name: 'route', type: 'string', description: 'API route' },
      { name: 'user', type: 'string', description: 'User ID' },
      { name: 'category', type: 'string', description: 'Event category' },
    ],
    measures: [
      { name: 'requests', type: 'number', description: 'Number of requests' },
      { name: 'jobs', type: 'number', description: 'Number of jobs' },
      { name: 'events', type: 'number', description: 'Number of events' },
      { name: 'errors', type: 'number', description: 'Number of errors' },
      { name: 'response_time', type: 'number', description: 'Response time in ms' },
    ],
  },
  support: {
    name: 'Support',
    description: 'Support tickets and triage data',
    dimensions: [
      { name: 'date', type: 'date', description: 'Ticket creation date' },
      { name: 'org', type: 'string', description: 'Organization ID' },
      { name: 'severity', type: 'string', description: 'Ticket severity' },
      { name: 'status', type: 'string', description: 'Ticket status' },
      { name: 'category', type: 'string', description: 'Ticket category' },
    ],
    measures: [
      { name: 'tickets', type: 'number', description: 'Number of tickets' },
      { name: 'triage_score', type: 'number', description: 'Triage priority score' },
      { name: 'resolution_time', type: 'number', description: 'Time to resolution in hours' },
    ],
  },
  cost: {
    name: 'Cost',
    description: 'Infrastructure and operational costs (derived)',
    dimensions: [
      { name: 'date', type: 'date', description: 'Cost date' },
      { name: 'source', type: 'string', description: 'Cost source (vercel, supabase, etc.)' },
      { name: 'org', type: 'string', description: 'Organization ID' },
    ],
    measures: [
      { name: 'total_cost', type: 'number', description: 'Total cost estimate (USD)' },
      { name: 'infra_cost', type: 'number', description: 'Infrastructure cost (USD)' },
      { name: 'data_cost', type: 'number', description: 'Data storage/query cost (USD)' },
      { name: 'messaging_cost', type: 'number', description: 'Email/webhook cost (USD)' },
    ],
    confidence: true, // This dataset includes confidence indicators
  },
  revenue: {
    name: 'Revenue',
    description: 'Revenue from Stripe or manual inputs',
    dimensions: [
      { name: 'date', type: 'date', description: 'Revenue date' },
      { name: 'org', type: 'string', description: 'Organization ID' },
      { name: 'source', type: 'string', description: 'Revenue source' },
    ],
    measures: [
      { name: 'amount', type: 'number', description: 'Revenue amount (USD)' },
      { name: 'mrr', type: 'number', description: 'Monthly recurring revenue' },
      { name: 'arr', type: 'number', description: 'Annual recurring revenue' },
    ],
  },
  efficiency: {
    name: 'Efficiency',
    description: 'Cost per unit metrics (derived)',
    dimensions: [
      { name: 'date', type: 'date', description: 'Metric date' },
      { name: 'org', type: 'string', description: 'Organization ID' },
    ],
    measures: [
      { name: 'cost_per_org', type: 'number', description: 'Cost per organization (USD)' },
      { name: 'cost_per_user', type: 'number', description: 'Cost per active user (USD)' },
      { name: 'cost_per_request', type: 'number', description: 'Cost per 1k requests (USD)' },
      { name: 'tickets_per_org', type: 'number', description: 'Support tickets per organization' },
    ],
    confidence: true,
  },
};

export async function GET() {
  const adminCheck = await requireAdmin({} as any);
  if (!adminCheck.isAdmin) {
    return adminCheck.error!;
  }

  return NextResponse.json({
    datasets: DATASET_SCHEMAS,
  });
}
