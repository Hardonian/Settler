"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Sparkles, UploadCloud, CheckCircle2, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SchemaMapping {
  date: string;
  amount: string;
  reference: string;
  merchant: string;
}

export function SchemaMapper() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<SchemaMapping | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);

    // Read the first line to get headers
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const firstLine = text.split("\n")[0];
      if (firstLine) {
        const columns = firstLine.split(",").map((h) => h.trim());
        setHeaders(columns);
      }
    };
    reader.readAsText(selected);
  };

  const analyzeSchema = async () => {
    setIsAnalyzing(true);
    // Simulate an AI call to auto-map the schema based on headers
    // In production, this would call a server action running @ai-sdk/openai
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const suggestedMapping: SchemaMapping = {
      date:
        headers.find((h) => h.toLowerCase().includes("date") || h.toLowerCase().includes("time")) ||
        "",
      amount:
        headers.find(
          (h) =>
            h.toLowerCase().includes("amt") ||
            h.toLowerCase().includes("amount") ||
            h.toLowerCase().includes("total")
        ) || "",
      reference:
        headers.find(
          (h) =>
            h.toLowerCase().includes("ref") ||
            h.toLowerCase().includes("id") ||
            h.toLowerCase().includes("transaction")
        ) || "",
      merchant:
        headers.find(
          (h) =>
            h.toLowerCase().includes("desc") ||
            h.toLowerCase().includes("merchant") ||
            h.toLowerCase().includes("payee") ||
            h.toLowerCase().includes("name")
        ) || "",
    };

    setMapping(suggestedMapping);
    setIsAnalyzing(false);
    toast.success("AI Schema Mapping Complete", {
      description: "We've automatically matched your CSV columns to Settler's format.",
    });
  };

  const submitIngestion = async () => {
    if (!file || !mapping) return;
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("columnMapping", JSON.stringify(mapping));

      const res = await fetch("/api/v1/ingestion/csv", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to ingest CSV");
      }

      toast.success("Ingestion Started", {
        description: "Your data has been queued for processing.",
      });

      // Reset state
      setFile(null);
      setHeaders([]);
      setMapping(null);
    } catch (err) {
      toast.error("Ingestion Failed", {
        description: err instanceof Error ? err.message : "Unknown error occurred.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/40 glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-primary" />
            Upload Financial Data
          </CardTitle>
          <CardDescription>
            Upload a CSV bank statement or ledger. Our AI will automatically map your custom columns
            to Settler&apos;s immutable ledger schema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Label htmlFor="csv-upload" className="sr-only">
              Upload CSV
            </Label>
            <Input
              id="csv-upload"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="max-w-md bg-muted/40"
            />
          </div>

          {headers.length > 0 && !mapping && (
            <div className="pt-4 flex gap-3">
              <Button onClick={analyzeSchema} disabled={isAnalyzing} className="gap-2">
                {isAnalyzing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {isAnalyzing ? "Analyzing Schema..." : "Auto-Map with AI"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {mapping && (
        <Card className="border-border/40 glass animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              Schema Mapping Validation
            </CardTitle>
            <CardDescription>
              Review the AI&apos;s column mapping before executing the ingestion job.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-md border border-border/40 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20">
                    <TableHead className="w-1/2">Settler Schema Field</TableHead>
                    <TableHead>Your CSV Column</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(mapping).map(([field, mappedHeader]) => (
                    <TableRow key={field}>
                      <TableCell className="font-medium capitalize">{field}</TableCell>
                      <TableCell>
                        <select
                          className="w-full bg-muted/40 border-none rounded p-1 text-sm focus:ring-1 focus:ring-primary"
                          value={mappedHeader}
                          onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
                        >
                          <option value="">-- Ignore --</option>
                          {headers.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setMapping(null)}>
                Cancel
              </Button>
              <Button
                onClick={submitIngestion}
                disabled={isUploading}
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Confirm & Ingest
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
