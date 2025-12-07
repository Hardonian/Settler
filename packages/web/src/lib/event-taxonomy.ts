/**
 * Event Taxonomy System
 * Defines all events tracked across the application
 */

export type EventCategory = "user" | "billing" | "integration" | "job" | "system" | "marketing";

export type EventAction =
  | "signup"
  | "login"
  | "logout"
  | "page_view"
  | "button_click"
  | "form_submit"
  | "integration_connected"
  | "integration_disconnected"
  | "job_created"
  | "job_completed"
  | "job_failed"
  | "subscription_created"
  | "subscription_updated"
  | "subscription_cancelled"
  | "payment_succeeded"
  | "payment_failed"
  | "upgrade"
  | "downgrade"
  | "trial_started"
  | "trial_ended"
  | "churn_risk_detected"
  | "milestone_achieved";

export interface Event {
  category: EventCategory;
  action: EventAction;
  label?: string;
  value?: number;
  properties?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
}

/**
 * Event taxonomy definitions
 */
export const EVENT_TAXONOMY: Record<EventAction, { category: EventCategory; description: string }> = {
  // User events
  signup: { category: "user", description: "User signed up for account" },
  login: { category: "user", description: "User logged in" },
  logout: { category: "user", description: "User logged out" },
  page_view: { category: "user", description: "User viewed a page" },
  button_click: { category: "user", description: "User clicked a button" },
  form_submit: { category: "user", description: "User submitted a form" },

  // Integration events
  integration_connected: { category: "integration", description: "Integration connected" },
  integration_disconnected: { category: "integration", description: "Integration disconnected" },

  // Job events
  job_created: { category: "job", description: "Reconciliation job created" },
  job_completed: { category: "job", description: "Reconciliation job completed" },
  job_failed: { category: "job", description: "Reconciliation job failed" },

  // Billing events
  subscription_created: { category: "billing", description: "Subscription created" },
  subscription_updated: { category: "billing", description: "Subscription updated" },
  subscription_cancelled: { category: "billing", description: "Subscription cancelled" },
  payment_succeeded: { category: "billing", description: "Payment succeeded" },
  payment_failed: { category: "billing", description: "Payment failed" },
  upgrade: { category: "billing", description: "User upgraded plan" },
  downgrade: { category: "billing", description: "User downgraded plan" },
  trial_started: { category: "billing", description: "Trial started" },
  trial_ended: { category: "billing", description: "Trial ended" },

  // System events
  churn_risk_detected: { category: "system", description: "Churn risk detected for user" },
  milestone_achieved: { category: "system", description: "User milestone achieved" },
};

/**
 * Track event
 */
export async function trackEvent(event: Omit<Event, "timestamp">): Promise<void> {
  const fullEvent: Event = {
    ...event,
    timestamp: new Date(),
  };

  // Send to analytics endpoint
  try {
    await fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fullEvent),
    });
  } catch (error) {
    console.error("Failed to track event:", error);
  }
}

/**
 * Get event taxonomy documentation
 */
export function getEventTaxonomyDoc(): string {
  let doc = "# Event Taxonomy\n\n";
  doc += "Complete list of all events tracked in Settler.\n\n";

  const byCategory = Object.entries(EVENT_TAXONOMY).reduce((acc, [action, data]) => {
    if (!acc[data.category]) {
      acc[data.category] = [];
    }
    acc[data.category].push({ action, ...data });
    return acc;
  }, {} as Record<EventCategory, Array<{ action: string; category: EventCategory; description: string }>>);

  for (const [category, events] of Object.entries(byCategory)) {
    doc += `## ${category.charAt(0).toUpperCase() + category.slice(1)} Events\n\n`;
    for (const event of events) {
      doc += `- **${event.action}**: ${event.description}\n`;
    }
    doc += `\n`;
  }

  return doc;
}
