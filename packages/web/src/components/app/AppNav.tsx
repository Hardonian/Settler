"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { SettlerLogo } from "@/components/brand/SettlerLogo";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const navSections = [
  {
    label: "Execution Infrastructure",
    items: [
      { name: "Control Plane", href: "/app", exact: true },
      { name: "Run Explorer", href: "/app/runs" },
      { name: "Truth Explorer", href: "/app/proofs" },
      { name: "Replay Lab", href: "/app/replay" },
      { name: "Policy Lab", href: "/app/policies" },
    ],
  },
  {
    label: "Operator Intelligence",
    items: [
      { name: "Live Alerts", href: "/app/alerts" },
      { name: "Runtime Event Signals", href: "/app/metrics" },
      { name: "System Telemetry", href: "/app/system-health" },
      { name: "Evidence Query Surface", href: "/app/evidence" },
      { name: "Integrations", href: "/app/integrations" },
    ],
  },
  {
    label: "Governance",
    items: [
      { name: "Audit Surfaces", href: "/app/audit" },
      { name: "Tenant Isolation Controls", href: "/app/settings" },
    ],
  },
];

interface NavItemProps {
  href: string;
  name: string;
  exact?: boolean;
  onClick?: () => void;
}

function NavItem({ href, name, exact = false, onClick }: NavItemProps) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "block rounded-[var(--sidebar-item-radius,6px)] px-3 py-2 text-sm transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isActive
          ? "bg-primary/10 text-foreground font-medium"
          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
      )}
    >
      {name}
    </Link>
  );
}

function NavSections({ onItemClick }: { onItemClick?: () => void }) {
  return (
    <nav aria-label="App navigation" className="flex-1 space-y-4 overflow-y-auto p-3">
      {navSections.map((section) => (
        <div key={section.label}>
          <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {section.label}
          </p>
          <div className="space-y-0.5">
            {section.items.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                name={item.name}
                exact={item.exact}
                onClick={onItemClick}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

// Sidebar for md+ screens
export function AppSidebar() {
  return (
    <aside className="hidden md:flex w-72 flex-col border-r border-border bg-card dark:bg-card">
      <Link href="/" className="flex border-b border-border p-4">
        <SettlerLogo variant="horizontal" className="h-8 w-auto" priority />
      </Link>
      <NavSections />
    </aside>
  );
}

// Hamburger + Sheet for mobile
export function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className="flex md:hidden items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 flex flex-col">
        <SheetHeader className="border-b border-border p-4">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Link href="/">
            <SettlerLogo variant="horizontal" className="h-8 w-auto" priority />
          </Link>
        </SheetHeader>
        <NavSections />
      </SheetContent>
    </Sheet>
  );
}
