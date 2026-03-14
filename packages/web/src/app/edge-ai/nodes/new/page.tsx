"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function NewEdgeNodePage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    deviceType: "",
    enrollmentKey: "",
  });
  const [enrollmentResult, setEnrollmentResult] = useState<{
    nodeId: string;
    nodeKey: string;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // In production, call API
    // For now, simulate enrollment
    setTimeout(() => {
      setEnrollmentResult({
        nodeId: "node-" + Date.now(),
        nodeKey: "sk_edge_" + Math.random().toString(36).substring(2, 15),
      });
      setStep(3);
    }, 1000);
  };

  if (step === 3 && enrollmentResult) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <CardTitle>Node Enrolled Successfully!</CardTitle>
            </div>
            <CardDescription>
              Your edge node has been enrolled. Save the credentials below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Node ID</Label>
              <Input value={enrollmentResult.nodeId} readOnly className="font-mono" />
            </div>
            <div>
              <Label>Node Key</Label>
              <Input value={enrollmentResult.nodeKey} readOnly className="font-mono" />
              <p className="text-sm text-red-600 mt-2">
                ⚠️ Save this key securely - it will not be shown again
              </p>
            </div>
            <div className="flex gap-4 pt-4">
              <Button asChild>
                <Link href="/edge-ai/nodes">View All Nodes</Link>
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                Print Credentials
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link href="/edge-ai/nodes" className="flex items-center gap-2 text-slate-600 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Nodes
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Enroll New Edge Node</CardTitle>
          <CardDescription>Connect a new edge node to your Settler account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <>
                <div>
                  <Label htmlFor="name">Node Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Retail Store #1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="deviceType">Device Type</Label>
                  <Select
                    value={formData.deviceType}
                    onValueChange={(value: string) =>
                      setFormData({ ...formData, deviceType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select device type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="server">Server</SelectItem>
                      <SelectItem value="embedded">Embedded Device</SelectItem>
                      <SelectItem value="mobile">Mobile Device</SelectItem>
                      <SelectItem value="edge_gateway">Edge Gateway</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!formData.name || !formData.deviceType}
                  className="w-full"
                >
                  Next: Enter Enrollment Key
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <Label htmlFor="enrollmentKey">Enrollment Key</Label>
                  <Input
                    id="enrollmentKey"
                    type="password"
                    value={formData.enrollmentKey}
                    onChange={(e) => setFormData({ ...formData, enrollmentKey: e.target.value })}
                    placeholder="Enter enrollment key from Settler dashboard"
                    required
                  />
                  <p className="text-sm text-slate-500 mt-2">
                    Get your enrollment key from the Edge Nodes page
                  </p>
                </div>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={!formData.enrollmentKey}>
                    Enroll Node
                  </Button>
                </div>
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
