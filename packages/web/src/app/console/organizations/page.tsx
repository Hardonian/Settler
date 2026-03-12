import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function OrganizationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Organizations</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Multi-tenant organization management, roles, governance, and operational boundaries.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Tenant Isolation Views</CardTitle>
            <CardDescription>
              Review tenant-level telemetry and operational isolation boundaries.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/console/admin/tenants">Open Tenant Observability</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Roles</CardTitle>
            <CardDescription>Manage RBAC roles and user assignment workflows.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/console/approvals">Open Team & Roles</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit Logs</CardTitle>
            <CardDescription>
              Track governance events, access changes, and administrative actions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/console/audit-trail">Open Audit Logs</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
