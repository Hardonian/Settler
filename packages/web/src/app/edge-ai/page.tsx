import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Cpu,
  Cloud,
  Zap,
  Shield,
  TrendingUp,
  Activity,
  Brain,
  Lock,
  ExternalLink,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Edge AI - Settler",
  description:
    "Dual-layer Cloud + Edge AI reconciliation platform for real-time, local processing with AI-powered matching",
};

// AIAS Edge Studio URL - external service for model optimization
const AIAS_STUDIO_URL = process.env.NEXT_PUBLIC_AIAS_STUDIO_URL || "https://aias.studio";

export default function EdgeAIPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Edge AI Reconciliation Platform
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Dual-layer architecture combining cloud intelligence with local edge processing for
            webhook-based reconciliation with near-real-time results, reduced latency, and enhanced
            privacy.
          </p>
        </div>

        {/* Architecture Diagram */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Cloud className="w-6 h-6 text-blue-600" />
                <CardTitle>Cloud Core</CardTitle>
              </div>
              <CardDescription>
                Central reconciliation engine with advanced matching algorithms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  Multi-tenant SaaS architecture
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  AI-powered matching & break detection
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  Audit logs & ledger parity
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  API + webhook orchestration
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="w-6 h-6 text-purple-600" />
                <CardTitle>Edge Node</CardTitle>
              </div>
              <CardDescription>
                Local processing with optimized AI models for instant reconciliation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                  Local ingestion & schema inference
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                  On-device fuzzy matching & scoring
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                  Real-time anomaly detection
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                  PII redaction & offline mode
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Key Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card>
            <CardHeader>
              <Zap className="w-8 h-8 text-yellow-500 mb-2" />
              <CardTitle>Ultra-Low Latency</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Process reconciliation locally with &lt;10ms latency. No round-trip to cloud for
                critical operations.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="w-8 h-8 text-green-500 mb-2" />
              <CardTitle>Privacy-First</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                PII redaction and tokenization before cloud sync. Keep sensitive data local while
                leveraging cloud intelligence.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Brain className="w-8 h-8 text-purple-500 mb-2" />
              <CardTitle>AI-Optimized Models</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Quantized models (int4/int8) optimized via{" "}
                <a
                  href={AIAS_STUDIO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-purple-600 hover:underline inline-flex items-center gap-1"
                >
                  AIAS Edge Studio
                  <ExternalLink className="w-3 h-3" />
                </a>{" "}
                for your specific device architecture.
              </p>
              <p className="text-xs text-muted-foreground">
                Model optimization powered by AIAS Edge Studio — a separate service for Edge AI
                model optimization
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Activity className="w-8 h-8 text-blue-500 mb-2" />
              <CardTitle>Offline Capable</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Continue processing during network outages. Automatic sync when connectivity is
                restored.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="w-8 h-8 text-orange-500 mb-2" />
              <CardTitle>Scalable Architecture</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Deploy edge nodes across multiple locations. Fleet management and centralized
                monitoring.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Lock className="w-8 h-8 text-red-500 mb-2" />
              <CardTitle>Compliance Ready</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                GDPR, HIPAA, and SOC 2 compliant. Data residency controls and audit trails.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Get Started with Edge AI</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Deploy your first edge node in minutes. Start with our free tier and scale as you grow.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600">
              <Link href="/edge-ai/nodes">Deploy Edge Node</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/docs">View Documentation</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="container mx-auto px-4 py-12 bg-muted/10">
        <h2 className="text-2xl font-bold mb-6 text-center">Explore Edge AI</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <Link href="/edge-ai/nodes">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg">Edge Nodes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Manage and monitor your edge node deployments
                </p>
              </CardContent>
            </Card>
          </Link>

          <a href={AIAS_STUDIO_URL} target="_blank" rel="noopener noreferrer" className="block">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-purple-200 hover:border-purple-400">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Model Optimization
                  <ExternalLink className="w-4 h-4 text-purple-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  Optimize models via{" "}
                  <span className="font-semibold text-purple-600">AIAS Edge Studio</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  External service for Edge AI model optimization
                </p>
              </CardContent>
            </Card>
          </a>

          <Link href="/edge-ai">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg">Anomaly Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">View real-time anomaly detection insights</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/edge-ai">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg">Benchmark Results</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Performance metrics and optimization results
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>
    </div>
  );
}
