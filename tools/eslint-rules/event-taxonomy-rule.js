const CANONICAL_EVENT_TYPES = new Set([
  "workflow.triggered",
  "worker.lease.acquired",
  "execution.started",
  "state.persisted",
  "proof.artifact.generated",
  "execution.completed",
  "execution.failed",
  "connector.sync.started",
  "connector.sync.completed",
  "connector.sync.failed",
  "policy.evaluated",
  "trust.node.added",
  "trust.edge.added",
  "ai.suggestion.created",
  "ai.suggestion.accepted",
  "ai.suggestion.rejected",
  "chaos.fault.injected",
  "chaos.invariant.checked",
  "alert.created",
  "alert.status.changed",
  "replay.started",
  "replay.completed",
  "replay.failed",
  "support.issue.created",
  "support.issue.linked",
  "webhook.received",
  "webhook.rejected",
  "operator.action.executed",
  "stream.event.emitted",
  "system.degraded",
  "reconciliation.started",
  "reconciliation.completed",
  "reconciliation.failed",
  "reconciliation.value.realized",
  "reconciliation.errors.prevented",
  "validation.failed",
  "mapping.suggested",
  "drift.detected",
  "workflow.failed",
  "audit.ready",
  "contract.breaking_change",
  "usage.limit_exceeded",
  "agent.fallback",
]);

const ALIAS_EVENT_TYPES = new Set([
  "connector.sync.succeeded",
  "execution.done",
  "recon.completed",
  "recon.failed",
  "value.reconciliation_completed",
  "value.errors_prevented",
]);

function isAllowedEventType(value) {
  return CANONICAL_EVENT_TYPES.has(value) || ALIAS_EVENT_TYPES.has(value);
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "enforce canonical internal event taxonomy",
    },
    schema: [],
    messages: {
      unknownType:
        "Unknown event type '{{eventType}}'. Use canonical taxonomy or registered alias.",
      dynamicType:
        "Dynamic event type construction is not allowed for internal events. Use a string literal from canonical taxonomy.",
    },
  },
  create(context) {
    function reportUnknown(node, eventType) {
      if (!isAllowedEventType(eventType)) {
        context.report({ node, messageId: "unknownType", data: { eventType } });
      }
    }

    return {
      CallExpression(node) {
        if (
          node.callee &&
          node.callee.type === "MemberExpression" &&
          !node.callee.computed &&
          node.callee.property &&
          node.callee.property.type === "Identifier" &&
          node.callee.property.name === "emitEvent" &&
          node.arguments.length > 0
        ) {
          const eventTypeArg = node.arguments[0];
          if (eventTypeArg.type === "Literal" && typeof eventTypeArg.value === "string") {
            reportUnknown(eventTypeArg, eventTypeArg.value);
          } else {
            context.report({ node: eventTypeArg, messageId: "dynamicType" });
          }
        }
      },
      Property(node) {
        if (!context.filename.includes("platform/")) {
          return;
        }

        if (
          node.key &&
          ((node.key.type === "Identifier" && node.key.name === "eventType") ||
            (node.key.type === "Literal" && node.key.value === "eventType"))
        ) {
          const value = node.value;
          if (value.type === "Literal" && typeof value.value === "string") {
            reportUnknown(value, value.value);
          }
        }
      },
    };
  },
};
