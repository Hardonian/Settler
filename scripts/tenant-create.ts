import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

type Args = {
  name: string;
  slug: string;
  ownerEmail: string;
  baseUrl: string;
  apiKey?: string;
  execute: boolean;
  writeEnv: boolean;
};

type StepResult = {
  step: string;
  status: "completed" | "degraded";
  detail: string;
};

function parseArgs(argv: string[]): Args {
  const out: Args = {
    name: "Pilot Workspace",
    slug: "pilot-workspace",
    ownerEmail: "operator@example.com",
    baseUrl: process.env.SETTLER_API_BASE_URL ?? "http://localhost:4000",
    apiKey: process.env.SETTLER_OPERATOR_API_KEY,
    execute: false,
    writeEnv: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];
    if (token === "--execute") out.execute = true;
    else if (token === "--write-env") out.writeEnv = true;
    else if (token === "--name" && next) {
      out.name = next;
      i += 1;
    } else if (token === "--slug" && next) {
      out.slug = next;
      i += 1;
    } else if (token === "--owner-email" && next) {
      out.ownerEmail = next;
      i += 1;
    } else if (token === "--base-url" && next) {
      out.baseUrl = next;
      i += 1;
    } else if (token === "--api-key" && next) {
      out.apiKey = next;
      i += 1;
    } else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  return out;
}

function printHelp(): void {
  console.log(
    `\nUsage: pnpm tenant:create [options]\n\nOptions:\n  --name <name>             Workspace display name\n  --slug <slug>             Workspace slug\n  --owner-email <email>     Owner operator email\n  --base-url <url>          API base URL (default: $SETTLER_API_BASE_URL or http://localhost:4000)\n  --api-key <key>           Operator API key (default: $SETTLER_OPERATOR_API_KEY)\n  --execute                 Execute API calls (default is dry-run plan only)\n  --write-env               Persist .env.tenant.<slug> file\n  -h, --help                Show help\n`
  );
}

async function postJson(
  baseUrl: string,
  path: string,
  body: Record<string, unknown>,
  apiKey?: string
): Promise<{ ok: boolean; body: unknown; status: number }> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let payload: unknown = text;
  try {
    payload = text ? (JSON.parse(text) as unknown) : null;
  } catch {
    payload = text;
  }

  return {
    ok: response.ok,
    status: response.status,
    body: payload,
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const results: StepResult[] = [];

  const plan = {
    tenant: {
      name: args.name,
      slug: args.slug,
      ownerEmail: args.ownerEmail,
    },
    steps: [
      "tenant_registration",
      "environment_configuration",
      "api_key_generation",
      "source_connection_setup",
      "first_reconciliation_run",
    ],
    executionMode: args.execute ? "execute" : "dry-run",
  };

  if (!args.execute) {
    results.push({
      step: "tenant_registration",
      status: "degraded",
      detail: "Dry-run mode: no API calls made.",
    });
  }

  let workspaceId = `ws_${args.slug}`;
  let generatedKey = args.apiKey ?? "<generated-operator-key>";

  if (args.execute) {
    const workspaceResponse = await postJson(
      args.baseUrl,
      "/api/v1/workspaces",
      {
        name: args.name,
        slug: args.slug,
        ownerEmail: args.ownerEmail,
      },
      args.apiKey
    );

    if (workspaceResponse.ok) {
      const payload = workspaceResponse.body as { id?: string };
      workspaceId = payload?.id ?? workspaceId;
      results.push({
        step: "tenant_registration",
        status: "completed",
        detail: `Workspace created (${workspaceId}).`,
      });
    } else {
      results.push({
        step: "tenant_registration",
        status: "degraded",
        detail: `Workspace creation failed with status ${workspaceResponse.status}.`,
      });
    }

    const keyResponse = await postJson(
      args.baseUrl,
      `/api/v1/workspaces/${workspaceId}/api-keys`,
      {
        label: "pilot-operator",
        scopes: ["workspace:read", "workspace:write", "reconciliation:run", "alerts:read"],
      },
      args.apiKey
    );

    if (keyResponse.ok) {
      const payload = keyResponse.body as { token?: string };
      generatedKey = payload?.token ?? generatedKey;
      results.push({
        step: "api_key_generation",
        status: "completed",
        detail: "Operator API key issued.",
      });
    } else {
      results.push({
        step: "api_key_generation",
        status: "degraded",
        detail: `API key creation failed with status ${keyResponse.status}.`,
      });
    }

    for (const source of ["csv", "webhook", "rest"]) {
      const connectorResponse = await postJson(
        args.baseUrl,
        "/api/v1/connectors",
        {
          workspaceId,
          type: source,
          name: `pilot-${source}`,
          config: { mode: "sample", source },
        },
        generatedKey
      );

      results.push({
        step: "source_connection_setup",
        status: connectorResponse.ok ? "completed" : "degraded",
        detail: connectorResponse.ok
          ? `Connector provisioned (${source}).`
          : `Connector (${source}) failed with status ${connectorResponse.status}.`,
      });
    }

    const runResponse = await postJson(
      args.baseUrl,
      "/api/v1/reconciliations/runs",
      {
        workspaceId,
        mode: "pilot_bootstrap",
        sourceRefs: ["pilot-csv", "pilot-webhook", "pilot-rest"],
      },
      generatedKey
    );

    results.push({
      step: "first_reconciliation_run",
      status: runResponse.ok ? "completed" : "degraded",
      detail: runResponse.ok
        ? "Initial reconciliation run created."
        : `Initial reconciliation run failed with status ${runResponse.status}.`,
    });
  }

  results.push({
    step: "environment_configuration",
    status: "completed",
    detail: "Generated tenant-scoped environment payload.",
  });

  const envPayload = [
    `SETTLER_WORKSPACE_ID=${workspaceId}`,
    `SETTLER_WORKSPACE_SLUG=${args.slug}`,
    `SETTLER_OPERATOR_EMAIL=${args.ownerEmail}`,
    `SETTLER_OPERATOR_API_KEY=${generatedKey}`,
    `SETTLER_API_BASE_URL=${args.baseUrl}`,
  ].join("\n");

  if (args.writeEnv) {
    const envPath = resolve(process.cwd(), `.env.tenant.${args.slug}`);
    writeFileSync(envPath, `${envPayload}\n`, "utf8");
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    plan,
    workspaceId,
    env: envPayload,
    results,
  };

  console.log(JSON.stringify(summary, null, 2));
}

void main();
