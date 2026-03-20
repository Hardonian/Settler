import { Metadata } from "next";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Rocket,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe,
  Lock,
  Search,
  History,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Launch Status | Settler Docs",
  description: "Real-time roadmap and feature availability status for the Settler platform.",
};

const roadmap = [
  {
    phase: "Current Status (v2.4)",
    title: "Production Ready",
    items: [
      { name: "Deterministic Replay VM", status: "Shipped", icon: CheckCircle2 },
      { name: "Merkle-Proof Generation", status: "Shipped", icon: CheckCircle2 },
      { name: "Global Control Plane", status: "Shipped", icon: CheckCircle2 },
      { name: "Stripe/Adyen Adapters", status: "Shipped", icon: CheckCircle2 },
    ],
  },
  {
    phase: "Q2 2024",
    title: "Advanced Observability",
    items: [
      { name: "AI-Powered Anomaly Tracing", status: "In Beta", icon: Clock },
      { name: "Self-Healing Worker Fleet", status: "Planned", icon: Zap },
      { name: "TigerBeetle Native Sync", status: "Prototyping", icon: Search },
    ],
  },
  {
    phase: "Q3 2024",
    title: "Enterprise Governance",
    items: [
      { name: "Delegated Auditor Access", status: "Backlog", icon: Lock },
      { name: "Multi-Tenant Policy Sync", status: "Backlog", icon: Globe },
      { name: "Hardware Security Modules", status: "Research", icon: ShieldCheck },
    ],
  },
];

export default function LaunchStatusPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 border-b border-border/40 overflow-hidden bg-slate-50 dark:bg-slate-950/20 shadow-2xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 space-y-8 text-center">
          <div className="flex flex-col items-center space-y-6">
            <Badge
              variant="outline"
              className="px-4 py-1.5 bg-primary/10 text-primary border-primary/20 text-xs font-black tracking-[0.2em] uppercase"
            >
              Development Roadmap
            </Badge>
            <h1 className="text-4xl md:text-7xl font-bold tracking-tight text-foreground italic">
              Launch Status
            </h1>
            <p className="text-xl text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed italic underline italic">
              Track the shipping velocity of the Settler platform. We believe in total transparency
              regarding what is production-ready today and what is currently being prioritized.
            </p>
          </div>
        </div>
      </section>

      {/* Roadmap Timeline */}
      <section className="py-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
        {roadmap.map((phase, idx) => (
          <div key={phase.phase} className="space-y-12 relative group">
            {idx !== roadmap.length - 1 && (
              <div className="absolute left-8 top-16 bottom-0 w-px bg-border group-hover:bg-primary/20 transition-colors hidden md:block" />
            )}

            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="bg-primary/10 text-primary h-16 w-16 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-all shadow-xl">
                {idx === 0 ? (
                  <Rocket size={32} />
                ) : idx === 1 ? (
                  <Clock size={32} />
                ) : (
                  <History size={32} />
                )}
              </div>
              <div className="space-y-4 pt-2">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-primary/70">
                  {phase.phase}
                </span>
                <h2 className="text-3xl font-bold tracking-tight italic underline underline-offset-8">
                  {phase.title}
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pl-0 md:pl-24">
              {phase.items.map((item) => (
                <Card
                  key={item.name}
                  className="border-border/40 bg-card hover:border-primary/40 transition-all hover:shadow-xl group/item"
                >
                  <CardHeader className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <item.icon
                        size={18}
                        className={`${item.status === "Shipped" ? "text-success" : "text-slate-400"}`}
                      />
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-black uppercase tracking-widest h-5 px-3 border-transparent bg-muted/40`}
                      >
                        {item.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-bold italic group-hover/item:text-primary transition-colors">
                      {item.name}
                    </CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Release Notes CTA */}
      <section className="py-32 bg-slate-950 text-white overflow-hidden relative border-t border-white/5 shadow-2xl">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-12 relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight italic underline italic underline-offset-8 italic underline-offset-8">
            Subcribe to System Updates
          </h2>
          <p className="text-xl text-slate-400 font-medium italic underline italic">
            Get technical deep-dives on new feature releases and cryptographic enhancements
            delivered directly to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <input
              type="email"
              placeholder="engineering@company.com"
              className="h-14 px-6 rounded-xl bg-white/5 border border-white/10 text-white text-lg font-bold focus:ring-2 focus:ring-primary w-full sm:w-80 transition-all"
            />
            <Button
              size="lg"
              className="h-14 px-8 font-extrabold shadow-2xl ring-1 ring-primary/40"
            >
              Join Changelog
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Button({
  children,
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: any) {
  const Comp = asChild ? "div" : "button";
  const variants: any = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
    outline:
      "border border-border bg-background hover:bg-accent hover:text-accent-foreground shadow-sm",
    ghost: "hover:bg-accent hover:text-accent-foreground font-black",
  };
  const sizes: any = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
  };
  return (
    <Comp
      className={`inline-flex items-center justify-center rounded-xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </Comp>
  );
}
