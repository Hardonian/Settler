import { Metadata } from "next";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Terminal,
  Code,
  Lock,
  Globe,
  RefreshCw,
  Download,
  ArrowRight,
  Copy,
  Zap,
  Search,
  BookOpen,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "API Reference | Settler Docs",
  description:
    "Comprehensive API reference for integrating Settler into your financial infrastructure.",
};

const endpoints = [
  {
    method: "POST",
    path: "/v1/ingest",
    title: "Batch Ingestion",
    description: "Accepts a signed array of transaction objects for cryptographic matching.",
  },
  {
    method: "GET",
    path: "/v1/audit/{run_id}",
    title: "Retrieve Audit Bundle",
    description: "Exports a full deterministic proof capsule for a specific reconciliation run.",
  },
  {
    method: "PATCH",
    path: "/v1/policies",
    title: "Update Policy Version",
    description: "Deploy a new reconciliation DSL snapshot to active worker nodes.",
  },
];

export default function DocsApiPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 border-b border-border/40 overflow-hidden bg-slate-900 text-white shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/[0.05] [mask-image:radial-gradient(white,transparent_85%)]" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 space-y-10">
          <div className="flex flex-col items-center text-center space-y-6">
            <Badge className="bg-primary/20 text-primary border-primary/40 text-xs font-black tracking-[0.2em] uppercase px-4 py-1.5 h-auto">
              Developer Reference
            </Badge>
            <h1 className="text-4xl md:text-7xl font-bold tracking-tight italic">
              API Documentation
            </h1>
            <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed italic underline italic">
              Interact with the Settler control plane and ingestion layers programmatically. Built
              on REST and secured with HMAC-SHA256 signatures.
            </p>
          </div>

          <div className="flex justify-center gap-6">
            <Button
              size="lg"
              className="h-14 px-8 font-extrabold shadow-2xl ring-1 ring-primary/40"
            >
              Download OpenAPI Spec
            </Button>
            <Button
              variant="ghost"
              className="h-14 px-8 font-bold text-slate-300 hover:text-white border border-white/10 hover:bg-white/5"
            >
              View Postman Collection
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col lg:flex-row gap-16">
        {/* Table of Contents / Sidebar */}
        <aside className="lg:w-64 space-y-8 flex-shrink-0 relative">
          <div className="sticky top-32 space-y-10">
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Getting Started
              </h3>
              <nav className="space-y-2">
                {["Authentication", "Error Codes", "Rate Limits", "Versioning"].map((item) => (
                  <Link
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    className="block text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors italic"
                  >
                    {item}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Endpoints
              </h3>
              <nav className="space-y-2">
                {endpoints.map((ep) => (
                  <Link
                    key={ep.path}
                    href={`#${ep.title.toLowerCase().replace(/ /g, "-")}`}
                    className="block text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors italic"
                  >
                    {ep.title}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="p-6 rounded-2xl bg-muted/20 border border-border/40 text-center space-y-3">
              <Zap size={24} className="text-primary opacity-40 mx-auto" strokeWidth={3} />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 leading-tight">
                Current Engine Version
              </p>
              <p className="text-xs font-bold text-foreground italic border-b border-primary/20 pb-2 italic">
                settler-core-v2.4.1
              </p>
            </div>
          </div>
        </aside>

        {/* Technical Spec Flow */}
        <main className="flex-1 space-y-32">
          {/* Auth Section */}
          <section id="authentication" className="space-y-10">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold tracking-tight italic underline italic underline-offset-8">
                Authentication
              </h2>
              <p className="text-lg text-muted-foreground font-medium italic">
                Every request to the Settler API must include a valid authentication header
                generated from your API key secret.
              </p>
            </div>
            <Card className="bg-slate-950 border-white/5 shadow-2xl overflow-hidden glass">
              <CardHeader className="bg-white/5 border-b border-white/5 p-4 flex flex-row items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 tracking-widest font-black">
                  X-SETTLER-SIGNATURE HEADER
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-500 hover:text-white"
                >
                  <Copy size={14} />
                </Button>
              </CardHeader>
              <CardContent className="p-8 font-mono text-sm text-slate-300 leading-relaxed overflow-x-auto text-nowrap">
                <span className="text-indigo-400">Authorization:</span> Bearer{" "}
                <span className="text-teal-400">set_prod_821sL...</span>
                <br />
                <span className="text-indigo-400">X-Settler-Timestamp:</span> 1710921405
                <br />
                <span className="text-indigo-400">X-Settler-Signature:</span>{" "}
                <span className="text-amber-200">sha256(secret, payload)</span>
              </CardContent>
            </Card>
          </section>

          {/* Endpoints Loop */}
          <section className="space-y-24">
            {endpoints.map((ep) => (
              <div
                key={ep.path}
                id={ep.title.toLowerCase().replace(/ /g, "-")}
                className="space-y-10 border-t border-border/20 pt-24 first:border-0 first:pt-0"
              >
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`px-4 py-1 rounded-lg text-xs font-black h-auto ${ep.method === "POST" ? "bg-indigo-600 text-white" : ep.method === "GET" ? "bg-teal-600 text-white" : "bg-amber-600 text-white"}`}
                      >
                        {ep.method}
                      </div>
                      <code className="text-xl font-bold font-mono tracking-tight text-foreground">
                        {ep.path}
                      </code>
                    </div>
                    <h2 className="text-3xl font-bold italic underline underline-offset-8 tracking-tight italic">
                      {ep.title}
                    </h2>
                  </div>
                  <Button
                    variant="outline"
                    className="h-10 font-bold gap-2 italic underline italic underline-offset-4 border-primary/20 bg-primary/5 text-primary"
                  >
                    Try in Playground
                    <ArrowRight size={14} />
                  </Button>
                </div>

                <p className="text-lg text-muted-foreground font-medium max-w-2xl leading-relaxed italic border-l-2 border-primary/20 pl-6 shadow-sm shadow-primary/5">
                  {ep.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                      Request Body
                    </h4>
                    <div className="p-6 rounded-2xl bg-card border border-border/40 shadow-sm space-y-4">
                      {[
                        { name: "tenant_id", type: "UUID", req: true },
                        { name: "payload", type: "Array<Item>", req: true },
                        { name: "tags", type: "Map<string, string>", req: false },
                      ].map((p) => (
                        <div
                          key={p.name}
                          className="flex items-center justify-between border-b last:border-0 border-border/20 pb-3 last:pb-0"
                        >
                          <div className="flex flex-col">
                            <span className="text-xs font-bold font-mono">{p.name}</span>
                            <span className="text-[10px] text-muted-foreground font-black uppercase">
                              {p.type}
                            </span>
                          </div>
                          {p.req && (
                            <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[9px] font-black h-4 uppercase">
                              Required
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                      Success Response
                    </h4>
                    <Card className="bg-slate-900 border-white/5 h-full flex flex-col glass">
                      <CardContent className="flex-1 p-6 font-mono text-sm text-slate-400 overflow-hidden text-nowrap">
                        {`{`}
                        <br />
                        &nbsp;&nbsp;<span className="text-teal-400">&quot;status&quot;</span>:{" "}
                        <span className="text-amber-200">&quot;ok&quot;</span>,<br />
                        &nbsp;&nbsp;<span className="text-teal-400">&quot;run_id&quot;</span>:{" "}
                        <span className="text-amber-200">&quot;uuid-v4&quot;</span>,<br />
                        &nbsp;&nbsp;<span className="text-teal-400">
                          &quot;proof_hash&quot;
                        </span>: <span className="text-amber-200">&quot;sha3_256...&quot;</span>
                        <br />
                        {`}`}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            ))}
          </section>
        </main>
      </div>

      {/* Support / Help */}
      <section className="py-32 px-4 border-t border-border/40 text-center space-y-12">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold tracking-tight italic underline-offset-8 italic underline">
            Have Complex Integration Needs?
          </h2>
          <p className="text-lg text-muted-foreground font-medium italic underline italic">
            Our SDK engineers can assist with custom adapter development and performance tuning.
            Reach out via our developer relations portal.
          </p>
        </div>
        <div className="flex justify-center gap-6">
          <Button className="h-14 px-8 font-extrabold shadow-2xl ring-1 ring-primary/40">
            Developer Discord
          </Button>
          <Button
            variant="outline"
            className="h-14 px-8 font-bold border-l border-primary/20 bg-primary/5 text-primary italic underline"
          >
            Contact DevRel
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
