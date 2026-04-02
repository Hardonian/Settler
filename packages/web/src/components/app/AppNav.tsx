"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  LayoutDashboard,
  Play,
  ShieldCheck,
  RefreshCcw,
  FlaskConical,
  Bell,
  BarChart2,
  Activity,
  Search,
  Plug,
  FileSearch,
  Settings,
  Database,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SettlerLogo } from "@/components/brand/SettlerLogo";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const navSections = [
  {
    label: "Execution Infrastructure",
    items: [
      { name: "Control Plane", href: "/app", exact: true, icon: LayoutDashboard },
      { name: "Run Explorer", href: "/app/runs", icon: Play },
      { name: "Truth Explorer", href: "/app/proofs", icon: ShieldCheck },
      { name: "Replay Lab", href: "/app/replay", icon: RefreshCcw },
      { name: "Policy Lab", href: "/app/policies", icon: FlaskConical },
    ],
  },
  {
    label: "Operator Intelligence",
    items: [
      { name: "Live Alerts", href: "/app/alerts", icon: Bell },
      { name: "Runtime Event Signals", href: "/app/metrics", icon: BarChart2 },
      { name: "System Telemetry", href: "/app/system-health", icon: Activity },
      { name: "Evidence Query Surface", href: "/app/evidence", icon: Search },
      { name: "Integrations", href: "/app/integrations", icon: Plug },
    ],
  },
  {
    label: "Governance",
    items: [
      { name: "Audit Surfaces", href: "/app/audit", icon: FileSearch },
      { name: "Tenant Isolation Controls", href: "/app/settings", icon: Settings },
    ],
  },
];

interface NavItemProps {
  href: string;
  name: string;
  icon: LucideIcon;
  exact?: boolean;
  onClick?: () => void;
}

function NavItem({ href, name, icon: Icon, exact = false, onClick }: NavItemProps) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-[var(--sidebar-item-radius,6px)] px-3 py-2 text-sm transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isActive
          ? "bg-primary/10 text-primary font-semibold"
          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          isActive ? "text-primary" : "text-muted-foreground/70"
        )}
        aria-hidden="true"
      />
      <span className="truncate">{name}</span>
      {isActive && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shrink-0" aria-hidden="true" />
      )}
    </Link>
  );
}

function NavSections({ onItemClick }: { onItemClick?: () => void }) {
  return (
    <nav aria-label="App navigation" className="flex-1 space-y-5 overflow-y-auto p-3">
      {navSections.map((section) => (
        <div key={section.label}>
          <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            {section.label}
          </p>
          <div className="space-y-0.5">
            {section.items.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                name={item.name}
                icon={item.icon}
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
    <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card/80 backdrop-blur-sm">
      <div className="flex h-14 shrink-0 items-center border-b border-border px-4">
        <Link href="/" className="flex items-center" aria-label="Settler home">
          <SettlerLogo variant="horizontal" className="h-7 w-auto" priority />
        </Link>
      </div>
      <NavSections />
      <div className="border-t border-border/60 p-3">
        <div className="flex items-center gap-2 rounded-md px-3 py-2">
          <Database className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" aria-hidden="true" />
          <span className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-wide">
            Settler v2
          </span>
        </div>
      </div>
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
      <SheetContent side="left" className="w-64 p-0 flex flex-col bg-card/95 backdrop-blur-sm">
        <SheetHeader className="h-14 flex-row items-center border-b border-border px-4">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Link href="/">
            <SettlerLogo variant="horizontal" className="h-7 w-auto" priority />
          </Link>
        </SheetHeader>
        <NavSections />
      </SheetContent>
    </Sheet>
  );
}
