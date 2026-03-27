import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface ConsolePageHeaderProps {
  title: string;
  description: string;
  /** Only shown when scope is "admin" or "global" — tenant scope is the default and not labeled. */
  scope?: "tenant" | "global" | "admin";
  /** Breadcrumb trail above the title */
  breadcrumbs?: BreadcrumbItem[];
  /** React node rendered in the top-right actions area */
  actions?: React.ReactNode;
  className?: string;
}

export function ConsolePageHeader({
  title,
  description,
  scope = "tenant",
  breadcrumbs,
  actions,
  className,
}: ConsolePageHeaderProps) {
  const scopeLabel = scope === "admin" ? "Admin scope" : scope === "global" ? "Global scope" : null;

  return (
    <header className={cn("space-y-3", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted-foreground">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.label} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="w-3 h-3 flex-shrink-0" aria-hidden="true" />}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-foreground font-medium">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
            {scopeLabel && (
              <Badge variant="outline" className="text-xs font-medium">
                {scopeLabel}
              </Badge>
            )}
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
    </header>
  );
}
