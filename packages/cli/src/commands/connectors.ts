import { Command } from "commander";
import {
  ConnectorExecutionRequest,
  ConnectorMetadata,
  ConnectorRegistry,
  normalizeConnectorFailure,
  normalizeConnectorOutput,
} from "../lib/platform-extension";

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

function buildMetadata(options: {
  name: string;
  version: string;
  type: ConnectorMetadata["connectorType"];
  operations: string;
  auth: ConnectorMetadata["authenticationScheme"];
  determinism: ConnectorMetadata["determinismClassification"];
  timeoutMs: string;
  retries: string;
  backoffMs: string;
  memoryMb: string;
  network: ConnectorMetadata["sandbox"]["networkEgress"];
  execMs: string;
}): ConnectorMetadata {
  return {
    name: options.name,
    version: options.version,
    connectorType: options.type,
    supportedOperations: options.operations
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
    authenticationScheme: options.auth,
    determinismClassification: options.determinism,
    timeoutMs: Number(options.timeoutMs),
    retryPolicy: {
      maxRetries: Number(options.retries),
      backoffMs: Number(options.backoffMs),
    },
    sandbox: {
      maxMemoryMb: Number(options.memoryMb),
      networkEgress: options.network,
      maxExecutionMs: Number(options.execMs),
      retryIsolation: true,
    },
  };
}

function getRequest(connectorName: string, operation: string): ConnectorExecutionRequest {
  return {
    connector: connectorName,
    operation,
    payload: { sample: true, timestamp: "1970-01-01T00:00:00.000Z" },
    idempotencyKey: `idem_${connectorName}_${operation}`,
  };
}

export const connectorCommand = new Command("connector").description(
  "Connector ecosystem management"
);

connectorCommand
  .command("install")
  .requiredOption("--name <name>", "Connector name")
  .option("--version <version>", "Version", "1.0.0")
  .option(
    "--type <type>",
    "financial|database|api|message_queue|cloud_storage|internal_service",
    "api"
  )
  .option("--operations <ops>", "Comma separated operations", "read,write")
  .option("--auth <scheme>", "oauth2|api_key|service_account|none", "api_key")
  .option("--determinism <class>", "deterministic|bounded_nondeterministic", "deterministic")
  .option("--timeout-ms <ms>", "Execution timeout", "2000")
  .option("--retries <count>", "Retry count", "2")
  .option("--backoff-ms <ms>", "Retry backoff", "100")
  .option("--memory-mb <mb>", "Sandbox max memory", "256")
  .option("--network <mode>", "deny_all|allowlisted", "allowlisted")
  .option("--exec-ms <ms>", "Sandbox max execution", "3000")
  .action((options) => {
    const registry = new ConnectorRegistry();
    const installed = registry.install(buildMetadata(options));
    printJson(installed);
  });

connectorCommand
  .command("list")
  .description("List installed connectors")
  .action(() => {
    printJson(new ConnectorRegistry().list());
  });

connectorCommand
  .command("test")
  .requiredOption("--name <name>", "Connector name")
  .option("--operation <operation>", "Operation to test", "read")
  .option("--simulate-failure", "Emit deterministic failure artifact", false)
  .action((options: { name: string; operation: string; simulateFailure?: boolean }) => {
    const registry = new ConnectorRegistry();
    const connector = registry.get(options.name);
    if (!connector) {
      throw new Error(`connector not installed: ${options.name}`);
    }

    const request = getRequest(options.name, options.operation);
    if (options.simulateFailure) {
      printJson(
        normalizeConnectorFailure(request, { code: "TIMEOUT", message: "execution timeout" })
      );
      return;
    }

    printJson(
      normalizeConnectorOutput(
        request,
        { ok: true, records: [{ externalId: "1", amount: 100.5 }] },
        connector
      )
    );
  });

connectorCommand
  .command("create")
  .requiredOption("--name <name>", "Connector name")
  .description("Create connector starter metadata in the registry")
  .action((options: { name: string }) => {
    const registry = new ConnectorRegistry();
    const template = registry.install({
      name: options.name,
      version: "0.1.0",
      connectorType: "internal_service",
      supportedOperations: ["healthcheck"],
      authenticationScheme: "service_account",
      determinismClassification: "deterministic",
      timeoutMs: 1000,
      retryPolicy: {
        maxRetries: 1,
        backoffMs: 50,
      },
      sandbox: {
        maxMemoryMb: 128,
        networkEgress: "deny_all",
        maxExecutionMs: 1500,
        retryIsolation: true,
      },
    });

    printJson({ created: template.name, metadata: template });
  });
