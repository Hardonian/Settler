import { Metadata } from "next";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Code,
  Terminal,
  Settings,
  ShieldCheck,
  Zap,
  ArrowRight,
  Search,
  Globe,
  Database,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Documentation | Settler",
  description: "Technical specifications, API reference, and implementation guides for Settler.",
};

const guideCategories = [
  {
    title: "Getting Started",
    icon: Zap,
    description: "Quick start guides for developers and financial operations teams.",
    links: [
      { name: "Pilot guide: first 30 minutes", href: "/docs/pilot" },
      { name: "5-Minute Introduction", href: "/docs/quickstart" },
      { name: "Core Architecture Concepts", href: "/docs/architecture/platform-architecture" },
      { name: "Install the CLI & SDK", href: "/docs/getting-started" },
    ],
  },
  {
    title: "Reconciliation DSL",
    icon: Code,
    description: "Master the TypeScript-based protocol for defining reconciliation logic.",
    links: [
      { name: "Writing your first Policy", href: "/docs/cli" },
      { name: "Invariants & Match Assertions", href: "/docs/errors" },
      { name: "Deterministic Replay Config", href: "/docs/replay-lab" },
    ],
  },
  {
    title: "Infrastructure",
    icon: Settings,
    description: "Connect Settler to your existing data sources and cloud providers.",
    links: [
      { name: "Database Adapters (SQL/NoSQL)", href: "/docs/integrations" },
      { name: "Webhook & Event Sync", href: "/docs/webhooks" },
      { name: "Self-Hosted Deployment", href: "/docs/launch" },
    ],
  },
  {
    title: "Governance & Trust",
    icon: ShieldCheck,
    description: "Operational best practices for auditability and compliance.",
    links: [
      { name: "Proof Graph Integrity", href: "/console/proof-explorer" },
      { name: "Role-Based Access Control", href: "/docs/auth" },
      { name: "Auditor Access Protocol", href: "/security-and-audit" },
    ],
  },
];

export default function DocsLandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero / Search Section */}
      <section className="relative pt-24 pb-20 border-b border-border/40 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:radial-gradient(white,transparent_85%)]" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 text-center space-y-8">
          <div className="flex flex-col items-center space-y-4">
            <Badge
              variant="outline"
              className="px-3 py-1 bg-primary/5 text-primary border-primary/20 text-xs font-bold tracking-widest uppercase"
            >
              Settler Library
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground italic">
              Documentation
            </h1>
            <p className="text-lg text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
              Explore technical specifications, API references, and in-depth guides for
              deterministic financial infrastructure.
            </p>
          </div>

          <div className="max-w-2xl mx-auto relative group">
            <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-xl group-hover:bg-primary/20 transition-all opacity-40" />
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search for concepts, policies, or adapters..."
                className="w-full h-14 pl-12 pr-4 rounded-2xl bg-card border border-border/60 text-base font-medium focus:ring-2 focus:ring-primary shadow-2xl transition-all outline-none"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border border-border/40 bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Guide Grid */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {guideCategories.map((cat) => (
            <Card
              key={cat.title}
              className="border-border/40 bg-card overflow-hidden group hover:border-primary/40 transition-all shadow-sm hover:shadow-xl"
            >
              <CardHeader className="bg-muted/10 pb-6 border-b border-border/40">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    <cat.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">{cat.title}</CardTitle>
                    <CardDescription className="font-medium mt-1 leading-relaxed opacity-70 italic">
                      {cat.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <nav className="space-y-4">
                  {cat.links.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      className="flex items-center justify-between group/link p-2 rounded-lg hover:bg-muted/40 transition-colors"
                    >
                      <span className="text-sm font-bold text-muted-foreground group-hover/link:text-primary transition-colors">
                        {link.name}
                      </span>
                      <ArrowRight
                        size={14}
                        className="text-muted-foreground opacity-0 group-hover/link:opacity-100 group-hover/link:translate-x-1 transition-all"
                      />
                    </Link>
                  ))}
                </nav>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Deep Dive Resources */}
      <section className="py-24 bg-muted/20 border-y border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-black uppercase tracking-widest italic">
                  SDK Reference
                </h3>
              </div>
              <nav className="space-y-3">
                {["C# / .NET", "Java / Spring", "Go SDK"].map((sdk) => (
                  <Link
                    key={sdk}
                    href={`/docs/sdk/${sdk.toLowerCase()}`}
                    className="block text-sm font-bold opacity-60 hover:opacity-100 transition-opacity"
                  >
                    {sdk}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-black uppercase tracking-widest italic">
                  API Endpoints
                </h3>
              </div>
              <nav className="space-y-3">
                {["Management API", "Ingestion API", "Audit Hooks"].map((api) => (
                  <Link
                    key={api}
                    href={`/docs/api/${api.toLowerCase().replace(" ", "-")}`}
                    className="block text-sm font-bold opacity-60 hover:opacity-100 transition-opacity"
                  >
                    {api}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-black uppercase tracking-widest italic">
                  Data Adapters
                </h3>
              </div>
              <nav className="space-y-3">
                {["SQL Mapping", "Object Storage", "Event Queues"].map((item) => (
                  <Link
                    key={item}
                    href={`/docs/adapters/${item.toLowerCase().replace(" ", "-")}`}
                    className="block text-sm font-bold opacity-60 hover:opacity-100 transition-opacity"
                  >
                    {item}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </section>

      {/* Community / Support */}
      <section className="py-32 px-4 text-center space-y-12">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold italic tracking-tight underline underline-offset-8">
            Need Assistance?
          </h2>
          <p className="text-lg text-muted-foreground font-medium italic underline">
            Our engineering team is active on Discord and dedicated support channels for enterprise
            migration.
          </p>
        </div>
        <div className="flex justify-center gap-6">
          <Button size="lg" className="h-14 px-8 font-bold gap-2">
            Join Community
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-14 px-8 font-bold gap-2 italic underline"
          >
            Contact Support
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: string;
  className?: string;
}) {
  const variants: any = {
    default: "bg-primary text-primary-foreground",
    outline: "border border-border",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
