"use client";

import { useState } from "react";
import { User, Search, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function UserImpersonation() {
  const [searchQuery, setSearchQuery] = useState("");
  const [impersonating, setImpersonating] = useState<string | null>(null);

  // const _handleImpersonate = async (userId: string) => {
  //   try {
  //     const response = await fetch("/api/admin/impersonate", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ userId }),
  //     });

  //     if (response.ok) {
  //       setImpersonating(userId);
  //       // In production, redirect to user's dashboard
  //       window.location.href = "/dashboard";
  //     }
  //   } catch (error) {
  //     console.error("Failed to impersonate user:", error);
  //   }
  // };

  const handleStopImpersonating = async () => {
    try {
      await fetch("/api/admin/impersonate/stop", { method: "POST" });
      setImpersonating(null);
      window.location.reload();
    } catch (error) {
      console.error("Failed to stop impersonation:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          User Impersonation
        </CardTitle>
        <CardDescription>Admin-only: Impersonate users for support</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {impersonating && (
          <Alert>
            <AlertDescription>
              You are currently impersonating user: {impersonating}
              <Button
                size="sm"
                variant="outline"
                className="ml-4"
                onClick={handleStopImpersonating}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Stop Impersonating
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search users by email or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="text-sm text-slate-500 dark:text-slate-400">
          Search for a user and click "Impersonate" to view their dashboard as them.
        </div>
      </CardContent>
    </Card>
  );
}
