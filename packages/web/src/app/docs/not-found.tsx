import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

export default function DocsNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">404</p>
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Documentation not found
        </h2>
        <p className="text-muted-foreground mb-6">
          The documentation page you are looking for does not exist. It may have been moved or
          renamed.
        </p>
        <Button asChild>
          <Link href="/docs">
            <BookOpen className="mr-2 h-4 w-4" aria-hidden="true" />
            Back to documentation
          </Link>
        </Button>
      </div>
    </div>
  );
}
