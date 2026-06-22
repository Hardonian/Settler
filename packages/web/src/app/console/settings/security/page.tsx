"use client";

import { useState } from "react";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Shield, Users, Copy, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion/variants";

export default function SecuritySettingsPage() {
  const [ssoEnabled, setSsoEnabled] = useState(false);
  const [scimEnabled, setScimEnabled] = useState(false);

  return (
    <div className="space-y-6">
      <ConsolePageHeader
        title="Enterprise Security"
        description="Configure Identity Provider (IdP) integrations, SSO, and SCIM directory syncing."
        breadcrumbs={[{ label: "Settings", href: "/console/settings" }, { label: "Security" }]}
      />

      <motion.div initial="hidden" animate="visible" variants={fadeUp} className="grid gap-6">
        {/* SSO Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <CardTitle>Single Sign-On (SSO)</CardTitle>
              </div>
              <Switch checked={ssoEnabled} onCheckedChange={setSsoEnabled} />
            </div>
            <CardDescription>
              Allow users to authenticate using your organization's SAML or OIDC Identity Provider
              (e.g., Okta, Azure AD, Google Workspace).
            </CardDescription>
          </CardHeader>
          {ssoEnabled && (
            <CardContent className="space-y-4 pt-4 border-t border-border/50">
              <div className="space-y-2">
                <Label>IdP Metadata URL</Label>
                <Input placeholder="https://your-idp.com/metadata.xml" />
                <p className="text-xs text-muted-foreground">
                  Or upload your IdP metadata XML file directly.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Required Domains</Label>
                <Input placeholder="acme.com, acme.org" />
                <p className="text-xs text-muted-foreground">
                  Users with these email domains will be required to sign in via SSO.
                </p>
              </div>
              <div className="pt-2">
                <h4 className="text-sm font-medium mb-2">Settler Service Provider Details</h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between items-center p-2 bg-muted/30 rounded border border-border">
                    <span className="text-muted-foreground">Entity ID</span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs">urn:settler:enterprise:sso</code>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted/30 rounded border border-border">
                    <span className="text-muted-foreground">ACS URL</span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs">https://app.settler.com/api/auth/saml/acs</code>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
          {ssoEnabled && (
            <CardFooter className="bg-muted/20 border-t border-border/50 pt-4 flex justify-end gap-2">
              <Button variant="outline">Test Connection</Button>
              <Button>Save SSO Configuration</Button>
            </CardFooter>
          )}
        </Card>

        {/* SCIM Provisioning */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <CardTitle>Directory Sync (SCIM 2.0)</CardTitle>
              </div>
              <Switch checked={scimEnabled} onCheckedChange={setScimEnabled} />
            </div>
            <CardDescription>
              Automatically provision, update, and de-provision user accounts and group memberships
              from your Identity Provider.
            </CardDescription>
          </CardHeader>
          {scimEnabled && (
            <CardContent className="space-y-4 pt-4 border-t border-border/50">
              <div className="rounded-lg border border-success/30 bg-success/5 p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-success-foreground">
                    SCIM is ready for integration
                  </p>
                  <p className="text-muted-foreground text-success-foreground/80">
                    Use the credentials below to configure SCIM provisioning in your Identity
                    Provider.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>SCIM Base URL</Label>
                  <div className="flex items-center gap-2">
                    <Input readOnly value="https://api.settler.com/scim/v2/tenant_xyz123" />
                    <Button variant="outline" size="icon">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Bearer Token</Label>
                  <div className="flex items-center gap-2">
                    <Input readOnly type="password" value="scim_secret_token_xxxxxxxxxxxx" />
                    <Button variant="outline" size="icon">
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="outline">Rotate</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Treat this token like a password. It grants full access to user management.
                  </p>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
