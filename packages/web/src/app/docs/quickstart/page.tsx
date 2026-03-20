import { Metadata } from "next";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Terminal,
  Code,
  CheckCircle2,
  Copy,
  Command,
  Monitor,
  Rocket,
  ShieldCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Quickstart | Settler Docs",
  description: "Get your first reconciliation policy running on Settler in under 5 minutes.",
};

const steps = [
  {
    title: "Project Initialization",
    icon: Terminal,
    command: "npx @settler/cli init",
    description:
      "Initialize a new Settler project structure with a default TypeScript environment.",
  },
  {
    title: "Configure Primary Adapter",
    icon: Command,
    command: "settler auth stripe --id=sk_test_...",
    description:
      "Link your first data source. Settler automatically discovers schemas and matches patterns.",
  },
  {
    title: "Deploy Test Policy",
    icon: Code,
    command: "settler deploy ./policies/standard.ts",
    description:
      "Push your reconciliation logic to the isolated worker pool for deterministic execution.",
  },
  {
    title: "Inspect Results",
    icon: ShieldCheck,
    command: "settler run --inspect",
    description: "Execute a match batch and view the resulting cryptographic proof capsule.",
  },
];

export default function QuickstartPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero / Header */}
      <section className="relative pt-32 pb-24 border-b border-border/40 overflow-hidden bg-muted/10 dark:bg-card/20 shadow-2xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 space-y-8 text-center">
          <div className="flex flex-col items-center space-y-6">
            <Badge
              variant="outline"
              className="px-4 py-1.5 bg-primary/10 text-primary border-primary/20 text-xs font-black tracking-[0.2em] uppercase"
            >
              Step-by-Step Guide
            </Badge>
            <h1 className="text-4xl md:text-7xl font-bold tracking-tight text-foreground italic">
              Quickstart
            </h1>
            <p className="text-xl text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed underline-offset-8 italic underline">
              Go from zero to a cryptographically verified reconciliation outcome in less than five
              minutes. No complex infrastructure setup required.
            </p>
          </div>
        </div>
      </section>

      {/* Modern Step Timeline */}
      <section className="py-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-32">
        {steps.map((step, idx) => (
          <div key={step.title} className="flex flex-col md:flex-row gap-12 group">
            {/* Timeline Indicator */}
            <div className="flex items-center md:flex-col gap-6 md:gap-0 flex-shrink-0">
              <div className="h-16 w-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center text-2xl font-black group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-2xl relative z-10">
                {idx + 1}
              </div>
              {idx !== steps.length - 1 && (
                <div className="flex-1 w-px bg-border group-hover:bg-primary/20 transition-colors hidden md:block" />
              )}
            </div>

            {/* Step Content */}
            <div className="flex-1 space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3 italic underline underline-offset-8 decoration-primary/20">
                  {step.title}
                  <div className="h-2 w-2 rounded-full bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h2>
                <p className="text-lg text-muted-foreground font-medium leading-relaxed italic border-l-2 border-primary/20 pl-6 bg-primary/5 py-4 rounded-r-2xl pr-8 max-w-2xl">
                  {step.description}
                </p>
              </div>

              {/* Interactive CLI Card */}
              <Card className="bg-card border-white/5 shadow-2xl overflow-hidden glass group/cli ring-1 ring-white/5">
                <CardHeader className="bg-white/5 border-b border-white/5 p-4 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Terminal size={14} className="text-muted-foreground" />
                    <span className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.2em] font-black italic">
                      SHELL_EXEC
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-white group-hover/cli:bg-primary/20 group-hover/cli:text-primary transition-all"
                  >
                    <Copy size={14} />
                  </Button>
                </CardHeader>
                <CardContent className="p-8 font-mono text-base text-muted-foreground/40 leading-relaxed overflow-x-auto whitespace-pre">
                  <span className="text-primary mr-3 opacity-60">$</span>
                  <span className="group-hover/cli:text-white transition-colors">
                    {step.command}
                  </span>
                </CardContent>
              </Card>
            </div>
          </div>
        ))}
      </section>

      {/* Troubleshooting / Next Steps */}
      <section className="py-32 px-4 bg-card text-white border-y border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-20 opacity-[0.03]">
          <Rocket className="h-96 w-96 text-primary" />
        </div>
        <div className="max-w-4xl mx-auto space-y-12 text-center relative z-10">
          <CheckCircle2 size={80} className="text-success mx-auto mb-8 opacity-40 shadow-2xl" />
          <div className="space-y-6">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight italic underline underline-offset-8">
              You&apos;re Officially Onboarded
            </h2>
            <p className="text-xl text-muted-foreground/60 font-medium italic underline">
              Now that you&apos;ve run your first reconciliation, it&apos;s time to dig into the DSL
              patterns and build production-grade invariants.
            </p>
          </div>
          <div className="pt-8 flex flex-col sm:flex-row justify-center gap-6">
            <Button
              size="lg"
              className="h-14 px-8 font-extrabold gap-2 shadow-2xl ring-1 ring-primary/40"
            >
              <Code size={20} />
              DSL Deep-Dive
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="h-14 px-8 font-bold text-muted-foreground/40 hover:text-white border border-white/10 hover:bg-white/5"
            >
              <Monitor size={20} className="mr-2" />
              View Console
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
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline:
      "border border-border bg-background hover:bg-accent hover:text-accent-foreground shadow-sm",
    ghost: "hover:bg-accent hover:text-accent-foreground font-black",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
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
