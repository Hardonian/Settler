import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ConsolePageHeaderProps {
  title: string;
  description: string;
  /** Only shown when scope is "admin" or "global" — tenant scope is the default and not labeled. */
  scope?: "tenant" | "global" | "admin";
  className?: string;
}

export function ConsolePageHeader({
  title,
  description,
  scope = "tenant",
  className,
}: ConsolePageHeaderProps) {
  const scopeLabel = scope === "admin" ? "Admin scope" : scope === "global" ? "Global scope" : null;

  return (
    <header className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
        {scopeLabel && (
          <Badge variant="outline" className="text-xs font-medium">
            {scopeLabel}
          </Badge>
        )}
      </div>
      <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">{description}</p>
    </header>
  );
}
