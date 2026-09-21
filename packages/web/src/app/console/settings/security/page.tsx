import Link from "next/link";
import { AlertTriangle, CheckCircle2, ExternalLink, Shield, Users } from "lucide-react";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ENTERPRISE_CAPABILITY_TRUTH,
  getCapabilityStateBadgeClass,
  getCapabilityStateLabel,
} from "@/lib/enterprise/capabilityTruth";

const identityCapabilities = ENTERPRISE_CAPABILITY_TRUTH.filter(
  ({ capability }) => capability === "SSO (OIDC)" || capability === "SCIM lifecycle provisioning"
);

const capabilityIcons = {
  "SSO (OIDC)": Shield,
  "SCIM lifecycle provisioning": Users,
} as const;

export default function SecuritySettingsPage() {
  return (
    <div className="space-y-6">
      <ConsolePageHeader
        title="Enterprise Identity"
        description="Review the verified availability of tenant identity controls before configuring a deployment."
        breadcrumbs={[{ label: "Settings", href: "/console/settings" }, { label: "Identity" }]}
      />

      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="flex gap-3 py-5">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div className="space-y-1">
            <p className="font-medium text-foreground">Deployment validation is required</p>
            <p className="text-sm text-muted-foreground">
              Identity features stay disabled until their environment contract and provider-specific
              runtime checks pass. This page does not generate credentials or activate unverified
              integrations.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {identityCapabilities.map((capability) => {
          const Icon = capabilityIcons[capability.capability as keyof typeof capabilityIcons];

          return (
            <Card key={capability.capability} className="border-border/70">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-muted p-2">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{capability.capability}</CardTitle>
                      <CardDescription className="mt-1">{capability.customerLabel}</CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={getCapabilityStateBadgeClass(capability.state)}
                  >
                    {getCapabilityStateLabel(capability.state)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-sm leading-6 text-muted-foreground">
                  {capability.operatorBoundary}
                </p>
                <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Verification required
                  </div>
                  <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                    {capability.verificationPath.map((path) => (
                      <li key={path} className="font-mono">
                        {path}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plan an enterprise identity rollout</CardTitle>
          <CardDescription>
            Validate your identity provider, provisioning requirements, and deployment boundary with
            the Settler team before making a production commitment.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/contact">
              Discuss requirements <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/enterprise">Review enterprise capability truth</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
