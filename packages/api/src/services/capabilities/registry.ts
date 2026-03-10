import { logWarn } from "../../utils/logger";
import type { CapabilityRegistry, CapabilityStatus } from "./types";
import {
  OssOperatorIntelligenceProvider,
  UnavailableOperatorIntelligenceProvider,
  type OperatorIntelligenceProvider,
} from "./providers/operator-intelligence-provider";
import {
  OssAlertRoutingProvider,
  type AlertRoutingProvider,
} from "./providers/alert-routing-provider";
import {
  OssUsageMeteringProvider,
  type UsageMeteringProvider,
} from "./providers/usage-metering-provider";
import {
  OssSupportIntakeProvider,
  type SupportIntakeProvider,
} from "./providers/support-intake-provider";
import {
  OssEnterpriseAnalyticsProvider,
  type EnterpriseAnalyticsProvider,
} from "./providers/enterprise-analytics-provider";

interface PrivateOperatorIntelligenceProviderModule {
  createOperatorIntelligenceProvider: () => OperatorIntelligenceProvider;
}

class InMemoryCapabilityRegistry implements CapabilityRegistry {
  public constructor(private readonly statuses: CapabilityStatus[]) {}

  public list(): CapabilityStatus[] {
    return this.statuses;
  }

  public get(key: string): CapabilityStatus | undefined {
    return this.statuses.find((s) => s.key === key);
  }
}

let operatorIntelligenceProvider: OperatorIntelligenceProvider | null = null;
let alertRoutingProvider: AlertRoutingProvider | null = null;
let usageMeteringProvider: UsageMeteringProvider | null = null;
let supportIntakeProvider: SupportIntakeProvider | null = null;
let enterpriseAnalyticsProvider: EnterpriseAnalyticsProvider | null = null;

async function loadPrivateOperatorIntelligenceProvider(): Promise<OperatorIntelligenceProvider | null> {
  const modulePath = process.env.SETTLER_OPERATOR_INTELLIGENCE_PROVIDER_MODULE;
  if (!modulePath) {
    return null;
  }

  try {
    const loadedModule = (await import(
      modulePath
    )) as Partial<PrivateOperatorIntelligenceProviderModule>;
    if (typeof loadedModule.createOperatorIntelligenceProvider !== "function") {
      logWarn("Private operator intelligence module loaded without provider factory", {
        modulePath,
      });
      return null;
    }

    const provider = loadedModule.createOperatorIntelligenceProvider();
    return {
      ...provider,
      status: () => ({ ...provider.status(), source: "private" }),
    };
  } catch (error) {
    logWarn("Unable to load private operator intelligence provider; falling back to OSS", {
      modulePath,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function getOperatorIntelligenceProvider(): Promise<OperatorIntelligenceProvider> {
  if (operatorIntelligenceProvider) {
    return operatorIntelligenceProvider;
  }

  operatorIntelligenceProvider =
    (await loadPrivateOperatorIntelligenceProvider()) ?? new OssOperatorIntelligenceProvider();

  return operatorIntelligenceProvider;
}

export function getAlertRoutingProvider(): AlertRoutingProvider {
  if (!alertRoutingProvider) {
    alertRoutingProvider = new OssAlertRoutingProvider();
  }
  return alertRoutingProvider;
}

export function getUsageMeteringProvider(): UsageMeteringProvider {
  if (!usageMeteringProvider) {
    usageMeteringProvider = new OssUsageMeteringProvider();
  }
  return usageMeteringProvider;
}

export function getSupportIntakeProvider(): SupportIntakeProvider {
  if (!supportIntakeProvider) {
    supportIntakeProvider = new OssSupportIntakeProvider();
  }
  return supportIntakeProvider;
}

export function getEnterpriseAnalyticsProvider(): EnterpriseAnalyticsProvider {
  if (!enterpriseAnalyticsProvider) {
    enterpriseAnalyticsProvider = new OssEnterpriseAnalyticsProvider();
  }
  return enterpriseAnalyticsProvider;
}

export async function getCapabilityRegistry(): Promise<CapabilityRegistry> {
  const operatorIntelligence = await getOperatorIntelligenceProvider();
  const alertRouting = getAlertRoutingProvider();
  const usageMetering = getUsageMeteringProvider();
  const supportIntake = getSupportIntakeProvider();
  const enterpriseAnalytics = getEnterpriseAnalyticsProvider();

  return new InMemoryCapabilityRegistry([
    operatorIntelligence.status(),
    alertRouting.status(),
    usageMetering.status(),
    supportIntake.status(),
    enterpriseAnalytics.status(),
    {
      key: "enterprise_surface",
      available: false,
      state: "unavailable",
      source: "oss",
      reason: "Enterprise routes are disabled until private enterprise backends are configured",
    },
  ]);
}

export function getUnavailableOperatorIntelligenceProvider(
  reason: string
): OperatorIntelligenceProvider {
  return new UnavailableOperatorIntelligenceProvider(reason);
}
