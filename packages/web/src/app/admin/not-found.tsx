/**
 * Admin Not Found Page
 *
 * 404 page for admin routes.
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSearch, Home } from "lucide-react";

export default function AdminNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileSearch className="w-6 h-6 text-muted-foreground" aria-hidden="true" />
            <CardTitle>Page Not Found</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The admin page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <div className="flex gap-2">
            <Link href="/admin">
              <Button variant="default">
                <Home className="w-4 h-4 mr-2" aria-hidden="true" />
                Go to Admin
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
