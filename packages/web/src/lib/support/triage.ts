/**
 * Support Ticket Auto-Triage Engine
 * 
 * Deterministic rule-based triage (no paid APIs)
 */

interface TriageContext {
  route?: string;
  userAgent?: string;
  timestamp?: string;
  url?: string;
  referrer?: string;
}

interface TriageResult {
  status: 'open' | 'triaged' | 'in_progress';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string | null;
  suggestedActions?: string[];
  confidence: number;
}

/**
 * Auto-triage a support ticket based on content and context
 */
export async function autoTriageTicket(
  ticket: {
    subject: string;
    description: string;
    context: TriageContext;
  }
): Promise<TriageResult> {
  const { subject, description, context } = ticket;
  const text = `${subject} ${description}`.toLowerCase();

  // Determine priority based on keywords
  let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  if (
    text.includes('critical') ||
    text.includes('down') ||
    text.includes('broken') ||
    text.includes('error 500') ||
    text.includes('cannot access')
  ) {
    priority = 'critical';
  } else if (
    text.includes('urgent') ||
    text.includes('important') ||
    text.includes('not working') ||
    text.includes('bug')
  ) {
    priority = 'high';
  } else if (
    text.includes('question') ||
    text.includes('how to') ||
    text.includes('documentation')
  ) {
    priority = 'low';
  }

  // Determine category based on keywords and route
  let category: string | null = null;
  const categories = {
    billing: ['billing', 'payment', 'invoice', 'charge', 'subscription', 'plan'],
    api: ['api', 'endpoint', 'request', 'response', 'integration'],
    authentication: ['login', 'auth', 'sign in', 'password', 'account'],
    performance: ['slow', 'performance', 'timeout', 'lag'],
    bug: ['bug', 'error', 'crash', 'broken', 'not working'],
    feature: ['feature', 'request', 'suggestion', 'enhancement'],
    documentation: ['docs', 'documentation', 'guide', 'tutorial'],
  };

  for (const [cat, keywords] of Object.entries(categories)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      category = cat;
      break;
    }
  }

  // Check route context for additional clues
  if (context.route) {
    if (context.route.includes('/billing')) {
      category = category || 'billing';
    } else if (context.route.includes('/api')) {
      category = category || 'api';
    } else if (context.route.includes('/console')) {
      category = category || 'bug';
    }
  }

  // Determine status
  let status: 'open' | 'triaged' | 'in_progress' = 'open';
  if (priority === 'critical' || priority === 'high') {
    status = 'triaged'; // Auto-triage high priority issues
  }

  // Suggested actions based on category
  const suggestedActions: string[] = [];
  if (category === 'billing') {
    suggestedActions.push('Check Stripe webhook logs');
    suggestedActions.push('Verify billing account status');
  } else if (category === 'api') {
    suggestedActions.push('Check API error logs');
    suggestedActions.push('Review request/response patterns');
  } else if (category === 'bug') {
    suggestedActions.push('Check error logs for route');
    suggestedActions.push('Review recent deployments');
  }

  // Calculate confidence (simple heuristic)
  let confidence = 0.5;
  if (category && priority !== 'medium') {
    confidence = 0.8;
  }
  if (context.route && category) {
    confidence = Math.min(confidence + 0.1, 0.9);
  }

  return {
    status,
    priority,
    category,
    suggestedActions: suggestedActions.length > 0 ? suggestedActions : undefined,
    confidence,
  };
}

/**
 * Correlate ticket with ops events
 */
export async function correlateTicketWithOpsEvents(
  _ticketId: string,
  _context: TriageContext
): Promise<{
  relatedErrors: number;
  relatedJobs: number;
  relatedWebhooks: number;
}> {
  // This would query ops_errors, ops_jobs, ops_webhooks
  // For now, return placeholder
  return {
    relatedErrors: 0,
    relatedJobs: 0,
    relatedWebhooks: 0,
  };
}
