import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto max-w-3xl px-4 py-24 text-center" id="main-content">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-4">404</p>
        <h1 className="text-fluid-3xl font-bold tracking-tight text-foreground">
          Page not found
        </h1>
        <p className="mt-4 text-muted-foreground max-w-md mx-auto leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Use the navigation to find what you need.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              Back to home
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/docs">Documentation</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
