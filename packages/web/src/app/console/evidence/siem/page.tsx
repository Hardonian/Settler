"use client";

import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Server, ShieldAlert, Key } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion/variants";

export default function SIEMExportPage() {
  return (
    <div className="space-y-6">
      <ConsolePageHeader
        title="SIEM & Audit Log Export"
        description="Stream immutable audit trails and security events directly to your centralized logging infrastructure."
        breadcrumbs={[{ label: "Evidence", href: "/console/evidence" }, { label: "SIEM Export" }]}
      />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="grid gap-6 max-w-3xl"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-primary" />
              <CardTitle>Log Streaming Configuration</CardTitle>
            </div>
            <CardDescription>
              Configure an endpoint to receive JSON-formatted audit events via HTTP POST.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select defaultValue="datadog">
                <SelectTrigger>
                  <SelectValue placeholder="Select SIEM Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="datadog">Datadog</SelectItem>
                  <SelectItem value="splunk">Splunk HEC</SelectItem>
                  <SelectItem value="aws_s3">AWS S3 (Firehose)</SelectItem>
                  <SelectItem value="custom">Custom Webhook</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Endpoint URL</Label>
              <Input placeholder="https://http-intake.logs.datadoghq.com/api/v2/logs" />
            </div>
            <div className="space-y-2">
              <Label>API Key / Authentication Token</Label>
              <Input type="password" placeholder="Enter API Key" />
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <div className="space-y-0.5">
                <Label>Enable Streaming</Label>
                <p className="text-xs text-muted-foreground">
                  Logs will be sent in near real-time.
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
          <CardFooter className="bg-muted/20 flex justify-end gap-2">
            <Button variant="outline">Send Test Event</Button>
            <Button>Save Configuration</Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
