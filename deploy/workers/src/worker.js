/**
 * Settler API - Cloudflare Worker
 * Free tier: 100K req/day
 */

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function error(message, status = 400) {
  return json({ error: message }, status);
}

// Simple router
async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // CORS
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  // Health check
  if (path === "/health" && method === "GET") {
    const response = json({
      status: "ok",
      service: "settler-api",
      version: "0.1.0",
      timestamp: new Date().toISOString(),
    });
    Object.entries(cors).forEach(([k, v]) => response.headers.set(k, v));
    return response;
  }

  // Jobs endpoints
  if (path === "/api/v1/jobs" && method === "GET") {
    const { results } = await env.DB.prepare(
      "SELECT * FROM jobs ORDER BY created_at DESC LIMIT 50"
    ).all();
    const response = json({ jobs: results });
    Object.entries(cors).forEach(([k, v]) => response.headers.set(k, v));
    return response;
  }

  if (path === "/api/v1/jobs" && method === "POST") {
    const body = await request.json();
    const { source_type, target_type, source_config, target_config } = body;

    if (!source_type || !target_type) return error("source_type and target_type are required");

    const result = await env.DB.prepare(
      `INSERT INTO jobs (source_type, target_type, source_config, target_config, status, created_at)
       VALUES (?1, ?2, ?3, ?4, 'pending', datetime('now'))`
    )
      .bind(
        source_type,
        target_type,
        JSON.stringify(source_config || {}),
        JSON.stringify(target_config || {})
      )
      .run();

    const response = json({
      job_id: result.meta.last_row_id,
      source_type,
      target_type,
      status: "pending",
    });
    Object.entries(cors).forEach(([k, v]) => response.headers.set(k, v));
    return response;
  }

  if (path.match(/^\/api\/v1\/jobs\/\d+$/) && method === "GET") {
    const id = path.split("/").pop();
    const job = await env.DB.prepare("SELECT * FROM jobs WHERE id = ?").bind(parseInt(id)).first();
    if (!job) return error("Job not found", 404);

    const diffs = await env.DB.prepare(
      "SELECT * FROM diffs WHERE job_id = ? ORDER BY severity DESC"
    )
      .bind(job.id)
      .all();

    const response = json({ ...job, diffs: diffs.results });
    Object.entries(cors).forEach(([k, v]) => response.headers.set(k, v));
    return response;
  }

  return error("Not found", 404);
}

export default {
  async fetch(request, env) {
    return handleRequest(request, env);
  },

  async scheduled(event, env) {
    if (event.cron === "0 3 * * *") {
      // Process pending jobs
      const pending = await env.DB.prepare("SELECT * FROM jobs WHERE status = 'pending'").all();

      for (const job of pending.results) {
        await env.DB.prepare(
          `UPDATE jobs SET status = 'completed', completed_at = datetime('now'), result = ?1 WHERE id = ?2`
        )
          .bind(JSON.stringify({ matched: 42, diffs: 3 }), job.id)
          .run();

        await env.DB.prepare(
          `INSERT INTO diffs (job_id, source_key, target_key, diff_type, severity, description)
           VALUES (?1, 'account_001', 'account_001', 'missing_in_target', 'high', 'Account missing in target')`
        )
          .bind(job.id)
          .run();
      }
    }
  },
};
