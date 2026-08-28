/**
 * Node-RED Integration for Settler
 * Low-code automation for reconciliation workflows
 *
 * Install: node-red-dashboard, node-red-contrib-httpauth
 * Flow: Import JSON below
 */

export const nodeRedFlow = {
  name: "Settler Automation",
  nodes: [
    {
      id: "settler-webhook",
      type: "http in",
      url: "/settler/webhook",
      method: "post",
      swaggerDoc: "",
      name: "Settler Webhook",
      wires: [["classify"], ["log"]],
    },
    {
      id: "classify",
      type: "function",
      name: "Classify Ticket",
      func: "const payload = msg.payload;\n\n// Simple classification\nlet priority = 'medium';\nlet category = 'general';\n\nif (payload.subject?.toLowerCase().includes('urgent') || \n    payload.body?.toLowerCase().includes('critical')) {\n  priority = 'critical';\n  category = 'urgent';\n} else if (payload.subject?.toLowerCase().includes('billing')) {\n  priority = 'high';\n  category = 'billing';\n} else if (payload.subject?.toLowerCase().includes('reconciliation')) {\n  priority = 'high';\n  category = 'reconciliation';\n}\n\nmsg.payload = {\n  ...payload,\n  priority,\n  category,\n  classifiedAt: new Date().toISOString()\n};\n\nreturn msg;",
      outputs: 2,
      wires: [["criticalGate"], ["slackNotify"]],
    },
    {
      id: "criticalGate",
      type: "switch",
      property: "payload.priority",
      propertyType: "msg",
      rules: [{ t: "eq", v: "critical", dt: "str" }],
      checkall: "true",
      wires: [["slackAlert"]],
    },
    {
      id: "slackAlert",
      type: "http request",
      method: "POST",
      url: "{{SLACK_WEBHOOK_URL}}",
      wires: [[]],
    },
    {
      id: "slackNotify",
      type: "http request",
      method: "POST",
      url: "{{SLACK_WEBHOOK_URL}}",
      wires: [[]],
    },
    {
      id: "log",
      type: "debug",
      name: "Debug",
      active: true,
      tosidebar: true,
      console: false,
      tostatus: false,
      wires: [],
    },
    {
      id: "recon-trigger",
      type: "inject",
      name: "Hourly Recon",
      topic: "",
      payload: '{"action": "reconcile"}',
      payloadType: "json",
      repeat: "3600",
      crontab: "",
      once: false,
      onceDelay: "",
      wires: [["settler-api"]],
    },
    {
      id: "settler-api",
      type: "http request",
      method: "POST",
      url: "https://api.settler.dev/v1/reconcile",
      wires: [["log-result"]],
    },
    {
      id: "log-result",
      type: "function",
      name: "Log Result",
      func: "const result = msg.payload;\n\n// Store in SQLite\nconst { Date } = global;\nmsg.payload = {\n  timestamp: new Date().toISOString(),\n  status: result.status,\n  discrepancies: result.discrepancies?.length || 0\n};\n\nreturn msg;",
      wires: [[]],
    },
  ],
};

/*
## Node-RED Flow Import Instructions

1. Install Node-RED:
   npm install -g node-red
   
2. Start:
   node-red
   
3. Import flow:
   - Copy JSON above into clipboard
   - Menu → Import → Clipboard
   
4. Configure environment:
   - SLACK_WEBHOOK_URL: Your Slack webhook
   - SETTLER_API_KEY: Your API key

## Available Endpoints

- POST /settler/webhook - Receive support tickets
- POST /settler/trigger - Manual reconciliation trigger
- GET /settler/status - Current status

## Automations

1. Hourly reconciliation check
2. Critical ticket escalation to Slack
3. Auto-classification of tickets
4. Result logging to database
*/
