import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function AppNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">404</p>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Page not found</h2>
        <p className="text-muted-foreground mb-6">
          The page you are looking for does not exist within the app. Use the sidebar navigation to
          continue.
        </p>
        <Button asChild>
          <Link href="/app">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Back to app
          </Link>
        </Button>
      </div>
    </div>
  );
}
