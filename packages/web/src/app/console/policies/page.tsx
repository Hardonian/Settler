import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PoliciesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Policies</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Policy enforcement dashboards, simulation, and control-plane policy operations.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Policy Enforcement Dashboard</CardTitle>
            <CardDescription>
              Monitor policy actions and enforcement outcomes across tenants.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/console/control-plane">Open Control Plane</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Policy Rule Configuration</CardTitle>
            <CardDescription>
              Manage feature and runtime policy settings with explicit environments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/console/feature-flags-policy">Open Policy Rules</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
