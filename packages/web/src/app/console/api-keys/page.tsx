import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Key,
  Plus,
  Copy,
  Trash2,
  ShieldCheck,
  History,
  Globe,
  Search,
  ExternalLink,
  Code,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = {
  title: "API Keys | Settler",
  description: "Manage your programmatic access to the Settler reconciliation engine.",
};

const keys = [
  {
    id: "key_9281X",
    name: "Production Ingestion",
    prefix: "sk_prod_",
    created: "2026-03-15",
    lastUsed: "2 mins ago",
    status: "active",
    scopes: ["write:ingestion", "read:runs"],
  },
  {
    id: "key_4b52M",
    name: "Staging Pipeline",
    prefix: "sk_test_",
    created: "2026-03-10",
    lastUsed: "Yesterday",
    status: "active",
    scopes: ["full_access"],
  },
];

export default function ApiKeysPage() {
  return (
    <div className="space-y-8 pb-8">
      <div className="flex items-end justify-between">
        <div className="max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70 mb-2">
            Developer Infrastructure
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">API Access</h1>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            Generate and manage cryptographic keys for programmatic access to the Settler
            Reconciliation Engine. Use these keys to trigger ingestion jobs and retrieve verified
            proof capsules.
          </p>
        </div>
        <Button className="h-12 font-bold gap-2 shadow-xl ring-1 ring-primary/20">
          <Plus className="h-5 w-5" />
          Create New Key
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Keys List */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/40 overflow-hidden glass">
            <CardHeader className="border-b border-border/40 pb-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Key className="h-5 w-5 text-primary" />
                    Active Secret Keys
                  </CardTitle>
                  <CardDescription className="font-medium mt-1">
                    Direct programmatic access to your tenant resources.
                  </CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search keys..."
                    className="h-9 pl-9 pr-4 rounded-lg bg-muted/40 border-none text-xs font-medium focus:ring-1 focus:ring-primary w-48"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/10 hover:bg-transparent">
                    <TableHead className="w-[180px]">Key Name</TableHead>
                    <TableHead>Preview</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.map((key) => (
                    <TableRow
                      key={key.id}
                      className="group border-b border-border/20 last:border-0 hover:bg-primary/5 transition-colors"
                    >
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                            {key.name}
                          </span>
                          <div className="flex gap-1.5 pt-1">
                            {key.scopes.map((scope) => (
                              <Badge
                                key={scope}
                                variant="outline"
                                className="text-[8px] font-black uppercase tracking-wider text-muted-foreground/80 border-border/60"
                              >
                                {scope}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs opacity-70">
                        {key.prefix}••••••••
                      </TableCell>
                      <TableCell className="text-xs font-medium text-muted-foreground">
                        {new Date(key.created).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-muted-foreground">
                        {key.lastUsed}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                          >
                            <Copy size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <section className="space-y-6">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">
              Implementation Documentation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/docs/api-guide" className="group">
                <Card className="border-border/40 hover:border-primary/40 hover:shadow-lg transition-all">
                  <CardHeader className="pb-2">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary w-fit mb-2 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      <Code className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-sm font-bold flex items-center justify-between">
                      API Client Guide
                      <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                      Integration patterns for Node.js, Python, and Go.
                    </p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/docs/webhooks" className="group">
                <Card className="border-border/40 hover:border-primary/40 hover:shadow-lg transition-all">
                  <CardHeader className="pb-2">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary w-fit mb-2 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      <Globe className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-sm font-bold flex items-center justify-between">
                      Webhook Webhooks
                      <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                      Configure real-time notifications for run completion.
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </section>
        </div>

        {/* Security / Sidebar */}
        <div className="space-y-8">
          <Card className="border-primary/20 bg-primary/5 shadow-none overflow-hidden relative group">
            <div className="absolute -right-8 -top-8 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <ShieldCheck className="h-32 w-32 text-primary" />
            </div>
            <CardHeader className="relative z-10 pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                Security Posture
              </CardTitle>
              <CardDescription className="font-bold text-primary italic underline underline-offset-4">
                Hardness Multiplier
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 space-y-6 pt-4">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <History className="h-4 w-4 text-primary opacity-60" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-foreground">Automatic Key Rotation</p>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      Active (90-day cycle)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-4 w-4 text-primary opacity-60" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-foreground">AES-256 Storage</p>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      Standard Enforced
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-primary/20">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold mb-6">
                  Protect your keys. They grant broad access to your reconciliation flows. Never
                  commit keys to source control.
                </p>
                <Button variant="default" className="w-full h-11 font-bold shadow-lg gap-2" asChild>
                  <Link href="/docs/security">
                    Security Policy
                    <ExternalLink size={14} />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/30">
            <CardHeader className="pb-4 border-b border-border/40">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-widest">
                Quick Connect
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-8 space-y-6">
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  Node.js Fragment
                </p>
                <div className="p-3 rounded-lg bg-slate-950 text-[10px] font-mono leading-relaxed text-slate-400 overflow-hidden relative">
                  <div className="absolute top-2 right-2 p-1 rounded bg-white/5 opacity-40 hover:opacity-100 cursor-pointer transition-opacity">
                    <Copy size={10} />
                  </div>
                  <p className="text-primary font-bold">
                    const{` { `}Settler{` } `} = require(&quot;@settler/sdk&quot;);
                  </p>
                  <p className="mt-1">const client = new Settler({`{`}</p>
                  <p className="pl-4">apiKey: process.env.SETTLER_KEY</p>
                  <p>{`});`}</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground text-center font-medium italic">
                All SDKs support deterministic replay by default.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
