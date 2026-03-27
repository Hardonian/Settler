import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/site/primitives";

interface Feature {
  name: string;
  free: boolean | string;
  commercial: boolean | string;
  enterprise: boolean | string;
}

const features: Feature[] = [
  { name: "Monthly Reconciliations", free: "1,000", commercial: "100,000", enterprise: "Unlimited" },
  { name: "Platform Adapters", free: "2", commercial: "Unlimited", enterprise: "Unlimited" },
  { name: "Log Retention", free: "7 days", commercial: "30 days", enterprise: "Unlimited" },
  { name: "Real-time Webhooks", free: false, commercial: true, enterprise: true },
  { name: "API Access", free: true, commercial: true, enterprise: true },
  { name: "Community Support", free: true, commercial: false, enterprise: false },
  { name: "Email Support", free: false, commercial: true, enterprise: false },
  { name: "Priority Support", free: false, commercial: false, enterprise: true },
  { name: "SSO / SAML", free: false, commercial: false, enterprise: true },
  { name: "RBAC", free: false, commercial: false, enterprise: true },
  { name: "White-label", free: false, commercial: false, enterprise: true },
  { name: "On-premise Deployment", free: false, commercial: false, enterprise: true },
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
          description="Feature coverage across OSS, Commercial, and Enterprise."
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
                      <div>Free</div>
                      <Badge variant="secondary" className="mt-2">
                        OSS
                      </Badge>
                    </th>
                    <th scope="col" className="p-4 text-center font-semibold text-foreground">
                      <div>Commercial</div>
                      <Badge variant="secondary" className="mt-2">
                        $99/mo
                      </Badge>
                    </th>
                    <th scope="col" className="p-4 text-center font-semibold text-foreground">
                      <div>Enterprise</div>
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
                      <td className="p-4 text-center">{renderValue(feature.free)}</td>
                      <td className="p-4 text-center">{renderValue(feature.commercial)}</td>
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
