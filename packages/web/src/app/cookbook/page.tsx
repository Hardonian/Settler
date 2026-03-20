import { Metadata } from "next";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Copy } from "lucide-react";

  Terminal,
  Search,
  ArrowRight,
  Zap,
  ShieldCheck,
  Database,
  Filter,
export const metadata: Metadata = {
  title: "Policy Cookbook | Settler",
  description:
    "A library of battle-tested reconciliation policies and patterns for various financial data sources.",
};

const recipes = [
  {
    title: "Stripe to internal Ledger",
    difficulty: "Beginner",
    time: "5 min",
    category: "Payment Processing",
    icon: Database,
    description:
      "Standard pattern for matching Stripe Charge objects against a custom internal accounting table.",
  },
  {
    title: "Adyen Cross-Region Settlement",
    difficulty: "Intermediate",
    time: "15 min",
    category: "Settlement",
    icon: Zap,
    description:
      "Handle multi-currency payouts with automated fx-rate parity checks and tolerance thresholds.",
  },
  {
    title: "TigerBeetle Dual-Entry Verify",
    difficulty: "Advanced",
    time: "10 min",
    category: "Core Banking",
    icon: ShieldCheck,
    description:
      "Implement strict double-entry invariants using the Settler DSL for high-frequency financial ledgers.",
  },
  {
    title: "Shopify Orders to Warehouse",
    difficulty: "Beginner",
    time: "4 min",
    category: "E-Commerce",
    icon: Filter,
    description:
      "Validate that order fulfilling events match original captured payment amounts across systems.",
  },
];

export default function CookbookPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 border-b border-border/40 overflow-hidden bg-slate-50 dark:bg-slate-950/20">
        <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:radial-gradient(white,transparent_85%)]" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 space-y-10 text-center">
          <div className="flex flex-col items-center space-y-6">
            <Badge
              variant="outline"
              className="px-4 py-1.5 bg-primary/10 text-primary border-primary/20 text-xs font-black tracking-[0.2em] uppercase"
            >
              Solution Library
            </Badge>
            <h1 className="text-4xl md:text-7xl font-bold tracking-tight text-foreground italic">
              Policy Cookbook
            </h1>
            <p className="text-xl text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed">
              Browse a repository of production-ready reconciliation snippets. Don&apos;t reinvent
              the wheel—copy and adapt these patterns for your specific data infrastructure.
            </p>
          </div>

          <div className="max-w-2xl mx-auto relative group">
            <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-xl group-hover:bg-primary/20 transition-all opacity-40" />
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by vendor (Stripe, Adyen, ...) or pattern..."
                className="w-full h-16 pl-16 pr-4 rounded-3xl bg-background border border-border/80 text-lg font-medium focus:ring-2 focus:ring-primary shadow-2xl transition-all"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories / Navigation Pills */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-wrap gap-4 justify-center border-b border-border/20">
        {["All Recipes", "Payments", "Settlements", "Banking", "Audits", "Migrations"].map(
          (cat) => (
            <Button
              key={cat}
              variant="outline"
              className="h-10 px-6 rounded-full font-bold text-xs uppercase tracking-widest hover:border-primary/40"
            >
              {cat}
            </Button>
          )
        )}
      </div>

      {/* Recipe Grid */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {recipes.map((recipe) => (
            <Card
              key={recipe.title}
              className="border-border/40 bg-card overflow-hidden hover:border-primary/40 transition-all hover:shadow-2xl group border-l-4 border-l-primary/40"
            >
              <CardHeader className="p-8 pb-4">
                <div className="flex items-start justify-between">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                    <recipe.icon size={28} />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge
                      className={`text-[9px] font-black uppercase tracking-widest h-5 px-3 ${recipe.difficulty === "Beginner" ? "bg-success/10 text-success border-success/20" : recipe.difficulty === "Advanced" ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-warning/10 text-warning border-warning/20"}`}
                    >
                      {recipe.difficulty}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-1">
                      <Terminal size={12} />
                      {recipe.time}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] text-primary font-black uppercase tracking-widest">
                    {recipe.category}
                  </p>
                  <CardTitle className="text-2xl font-bold italic group-hover:underline underline-offset-8 transition-all">
                    {recipe.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <p className="text-muted-foreground font-medium mb-8 leading-relaxed italic border-l-2 border-primary/20 pl-6">
                  {recipe.description}
                </p>
                <div className="flex items-center justify-between pt-6 border-t border-border/20">
                  <Button
                    variant="ghost"
                    className="h-10 px-4 font-bold text-primary gap-2 p-0 hover:bg-transparent"
                  >
                    <Copy size={16} />
                    View Source Code
                  </Button>
                  <Button className="h-10 px-6 font-bold gap-2">
                    Adapt this Recipe
                    <ArrowRight size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Contributions Section */}
      <section className="py-32 px-4 border-y border-border/40 bg-muted/20">
        <div className="max-w-4xl mx-auto space-y-12 text-center">
          <div className="h-20 w-20 rounded-3xl bg-slate-900 mx-auto flex items-center justify-center text-white rotate-12 group-hover:rotate-0 transition-all shadow-2xl">
            <BookOpen size={40} />
          </div>
          <div className="space-y-6">
            <h2 className="text-3xl font-bold italic tracking-tight underline underline-offset-8">
              Contribute a Pattern
            </h2>
            <p className="text-xl text-muted-foreground font-medium italic underline">
              Have a reconciliation policy that the world should see? Join our open-source
              contributor program and help build the global standard for deterministic financial
              infrastructure.
            </p>
          </div>
          <Button size="lg" className="h-14 px-8 font-extrabold shadow-2xl ring-1 ring-primary/40">
            Open a PR on GitHub
          </Button>
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
    outline: "border border-border bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
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
