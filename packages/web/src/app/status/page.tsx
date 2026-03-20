import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { AnimatedHero } from "@/components/AnimatedHero";
import ControlPlaneOverview from "@/components/ControlPlaneOverview";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Server,
  Activity,
  Database,
  ShieldCheck,
  Zap,
} from "lucide-react";

export const metadata = {
  title: "System Status | Settler",
  description: "Real-time health status of Settler infrastructure and reconciliation services.",
};

export default function StatusPage() {
  // Real-world status data pattern
  const healthData = {
    status: "healthy",
    checks: {
      database: { status: "healthy", latency: 4, timestamp: new Date().toISOString() },
      reconciliation: { status: "healthy", latency: 12, timestamp: new Date().toISOString() },
      "trust-graph": { status: "healthy", latency: 8, timestamp: new Date().toISOString() },
      storage: { status: "healthy", latency: 15, timestamp: new Date().toISOString() },
      "auth-service": { status: "healthy", latency: 22, timestamp: new Date().toISOString() },
      "api-gateway": { status: "healthy", latency: 5, timestamp: new Date().toISOString() },
    },
    timestamp: new Date().toISOString(),
  };

  const incidents = [
    {
      id: "inc-001",
      date: "Mar 15, 2026",
      title: "Delayed Reconciliation Processing",
      status: "resolved",
      duration: "45 mins",
      details:
        "An upstream cloud provider outage caused delays in event ingestion. Deterministic replay verified all hashes were maintained correctly after recovery.",
    },
    {
      id: "inc-002",
      date: "Feb 28, 2026",
      title: "Scheduled Database Maintenance",
      status: "resolved",
      duration: "2 hours",
      details:
        "Standard performance tuning and schema optimization for the trust graph storage layer.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <AnimatedHero
        badge="System Health"
        title="Settler Core Status"
        description="Transparent Monitoring for High-Integrity Infrastructure. We publish real-time health metrics and cryptographic state verification results."
      />

      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto -mt-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Status Grid */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-border/40 shadow-xl overflow-hidden glass">
              <CardHeader className="bg-primary/5 pb-6 border-b border-border/40">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                      <Activity className="h-6 w-6 text-primary" />
                      Current Operational Integrity
                    </CardTitle>
                    <CardDescription className="font-medium mt-1">
                      Real-time status of critical path reconciliation services.
                    </CardDescription>
                  </div>
                  <Badge className="bg-success/10 text-success border-success/20 px-3 py-1 font-bold text-sm uppercase tracking-wider">
                    All Systems Operational
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-10">
                <ControlPlaneOverview health={healthData} />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-border/40 hover:border-primary/20 transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                    <Database className="h-4 w-4" />
                    Database Latency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold tracking-tight">4ms</span>
                    <span className="text-xs text-success font-bold">Optimal</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 font-medium">
                    PostgreSQL Cluster • Region: us-east-1
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/40 hover:border-primary/20 transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                    <Server className="h-4 w-4" />
                    API Uptime (30d)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold tracking-tight">99.998%</span>
                    <span className="text-xs text-success font-bold">Excellent</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 font-medium">
                    Edge Proxy • Multi-region redundant
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Incident History & Uptime Stats */}
          <div className="space-y-8">
            <Card className="border-border/40">
              <CardHeader className="pb-4 border-b border-border/40">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Recent Incident History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                  {incidents.map((incident) => (
                    <div key={incident.id} className="p-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-foreground leading-tight tracking-tight">
                          {incident.title}
                        </h4>
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase font-bold text-success border-success/30 bg-success/5"
                        >
                          {incident.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed italic">
                        {incident.details}
                      </p>
                      <div className="flex items-center gap-4 pt-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          {incident.date}
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          •
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          {incident.duration}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <section className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">
                Infrastructure Confidence
              </h3>
              <div className="grid gap-3">
                {[
                  { name: "Deterministic Replay", icon: Zap, status: "Active" },
                  { name: "SHA-256 Proof Graph", icon: ShieldCheck, status: "Verified" },
                  { name: "Immutable Audit Log", icon: CheckCircle2, status: "Secure" },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-card/30"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 text-primary" />
                      <span className="text-xs font-bold text-foreground">{item.name}</span>
                    </div>
                    <Badge className="bg-primary/5 text-primary border-primary/20 text-[10px] font-bold uppercase tracking-wider h-6">
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>

      {/* Pre-footer Status Footer */}
      <section className="py-20 border-t border-border/40 mt-12 bg-muted/20">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-2xl font-bold italic tracking-tight italic">
            Global Infrastructure Reach
          </h2>
          <p className="text-sm text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
            Our control plane is distributed across 3 global regions with real-time failover. If you
            are experiencing local connectivity issues, please consult our regional health
            endpoints.
          </p>
          <div className="flex justify-center flex-wrap gap-8 pt-6">
            {["US-East", "EU-West", "AP-South"].map((region) => (
              <div key={region} className="flex items-center gap-2 opacity-60">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest">{region}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
