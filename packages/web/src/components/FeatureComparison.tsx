import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/site/primitives";

interface Feature {
  name: string;
  oss: boolean | string;
  cloud: boolean | string;
  managed: boolean | string;
  enterprise: boolean | string;
}

const features: Feature[] = [
  {
    name: "Monthly Reconciliations",
    oss: "10,000",
    cloud: "100,000",
    managed: "1,000,000+",
    enterprise: "Contractual",
  },
  {
    name: "Exception supervision",
    oss: "Self-run",
    cloud: "Usage-based",
    managed: "Operator-assisted",
    enterprise: "Custom policy",
  },
  {
    name: "Deployment model",
    oss: "Self-hosted",
    cloud: "Multi-tenant cloud",
    managed: "Cloud + managed operator",
    enterprise: "Dedicated/VPC/on-prem",
  },
  {
    name: "Evidence retention",
    oss: "Local",
    cloud: "Hosted",
    managed: "Hosted + monthly packets",
    enterprise: "Custom retention",
  },
  { name: "API access", oss: true, cloud: true, managed: true, enterprise: true },
  { name: "Escalation queue", oss: false, cloud: false, managed: true, enterprise: true },
  { name: "SLA", oss: false, cloud: false, managed: "Business-hours", enterprise: "Contractual" },
  {
    name: "SSO / policy controls",
    oss: false,
    cloud: false,
    managed: "Optional",
    enterprise: true,
  },
  { name: "Audit export support", oss: false, cloud: true, managed: true, enterprise: true },
  { name: "Named operator coverage", oss: false, cloud: false, managed: true, enterprise: "Optional" },
];

export function FeatureComparison() {
  const renderValue = (value: boolean | string) => {
    if (value === true) {
      return <span className="text-green-600 dark:text-green-400">✓</span>;
    }
    if (value === false) {
      return <span className="text-muted-foreground">—</span>;
    }
    return <span className="text-foreground">{value}</span>;
  };

  return (
    <section className="border-t border-border/40 bg-muted/15 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Compare plans"
          description="Canonical offer coverage across OSS, Cloud API, Managed Operations, and Enterprise Dedicated."
        />
        <Card className="mt-10 overflow-x-auto border-border/60 bg-card">
          <CardContent className="p-0">
            <div className="overflow-x-auto" role="region" aria-label="Feature comparison table">
              <table className="w-full" role="table" aria-label="Pricing plan feature comparison">
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className="p-4 text-left font-semibold text-foreground">
                      Feature
                    </th>
                    <th scope="col" className="p-4 text-center font-semibold text-foreground">
                      <div>Open Source</div>
                      <Badge variant="secondary" className="mt-2">
                        OSS
                      </Badge>
                    </th>
                    <th scope="col" className="p-4 text-center font-semibold text-foreground">
                      <div>Cloud API</div>
                      <Badge variant="secondary" className="mt-2">
                        Usage-based
                      </Badge>
                    </th>
                    <th scope="col" className="p-4 text-center font-semibold text-foreground">
                      <div>Managed Ops</div>
                      <Badge variant="secondary" className="mt-2">
                        Operator-led
                      </Badge>
                    </th>
                    <th scope="col" className="p-4 text-center font-semibold text-foreground">
                      <div>Enterprise Dedicated</div>
                      <Badge variant="secondary" className="mt-2">
                        Custom
                      </Badge>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, index) => (
                    <tr
                      key={index}
                      className="border-b border-border transition-colors last:border-b-0 hover:bg-muted/40"
                    >
                      <th scope="row" className="p-4 font-medium text-foreground">
                        {feature.name}
                      </th>
                      <td className="p-4 text-center">{renderValue(feature.oss)}</td>
                      <td className="p-4 text-center">{renderValue(feature.cloud)}</td>
                      <td className="p-4 text-center">{renderValue(feature.managed)}</td>
                      <td className="p-4 text-center">{renderValue(feature.enterprise)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
