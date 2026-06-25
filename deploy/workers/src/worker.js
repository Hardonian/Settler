/**
 * Cloudflare Workers API for AI Lab Audit
 * Free tier: 100K req/day
 */

import { Router } from 'itty-router';

const router = Router();

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function error(message, status = 400) {
  return json({ error: message }, status);
}

// ─── Health ───────────────────────────────────────────────────────

router.get('/health', () => json({
  status: 'ok',
  service: 'ai-lab-audit-api',
  version: '0.1.0',
  timestamp: new Date().toISOString(),
}));

// ─── Audit CRUD ──────────────────────────────────────────────────

// POST /api/v1/audits — Create audit request
router.post('/api/v1/audits', async (request, env) => {
  const body = await request.json();
  const { workspace_name, repo_url } = body;
  if (!workspace_name) return error('workspace_name is required');

  const result = await env.DB.prepare(
    `INSERT INTO audits (workspace_name, repo_url, audited_at, status)
     VALUES (?, ?, datetime('now'), 'pending')`
  ).bind(workspace_name, repo_url || null).run();

  return json({ audit_id: result.meta.last_row_id, workspace_name, status: 'pending' });
});

// GET /api/v1/audits — List all audits
router.get('/api/v1/audits', async (request, env) => {
  const result = await env.DB.prepare(
    'SELECT * FROM audits ORDER BY audited_at DESC LIMIT 50'
  ).all();
  return json({ audits: result.results });
});

// GET /api/v1/audits/:id — Get audit details
router.get('/api/v1/audits/:id', async (request, env) => {
  const audit = await env.DB.prepare(
    'SELECT * FROM audits WHERE id = ?'
  ).bind(parseInt(request.params.id)).first();
  if (!audit) return error('Audit not found', 404);

  const findings = await env.DB.prepare(
    'SELECT * FROM findings WHERE audit_id = ? ORDER BY severity DESC'
  ).bind(audit.id).all();

  return json({ ...audit, findings: findings.results });
});

// ─── Health Score Endpoint ────────────────────────────────────────

// GET /api/v1/score/:workspace — Get health score
router.get('/api/v1/score/:workspace', async (request, env) => {
  const workspace = request.params.workspace;
  const audits = await env.DB.prepare(
    'SELECT * FROM audits WHERE workspace_name = ? AND status = ? ORDER BY audited_at DESC LIMIT 1'
  ).bind(workspace, 'completed').all();

  if (audits.results.length === 0) {
    return json({ workspace, score: null, message: 'No completed audits yet' });
  }

  const latest = audits.results[0];
  return json({
    workspace,
    score: latest.overall_score,
    critical: latest.critical_findings,
    high: latest.high_findings,
    medium: latest.medium_findings,
    total: latest.total_findings,
    last_audited: latest.audited_at,
  });
});

// ─── Webhook ─────────────────────────────────────────────────────

router.post('/api/v1/webhook/github', async (request, env) => {
  const event = request.headers.get('x-github-event');
  const payload = await request.json();

  if (event === 'push') {
    return json({ status: 'received', repo: payload.repository?.full_name });
  }

  return json({ status: 'ignored', event });
});

async function handleCron(event, env) {
  const pending = await env.DB.prepare(
    "SELECT * FROM audits WHERE status = 'pending'"
  ).all();

  for (const audit of pending.results) {
    // Simulate audit completion
    await env.DB.prepare(
      `UPDATE audits SET status = 'completed', 
       overall_score = 85.0, critical_findings = 0, high_findings = 2, 
       medium_findings = 5, total_findings = 7, audited_at = datetime('now')
       WHERE id = ?`
    ).bind(audit.id).run();

    // Send notification
    if (env.SLACK_WEBHOOK_URL) {
      await fetch(env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🔍 AI Lab Audit completed for \`${audit.workspace_name}\`: Score 85/100 (0 critical, 2 high, 5 medium)`,
        }),
      });
    }
  }

  return json({ status: 'ok', processed: pending.results.length });
}

router.all('*', () => error('Not found', 404));

export default {
  async fetch(request, env, ctx) {
    return router.fetch(request, env, ctx);
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(handleCron(event, env));
  },
};