"use client";

import { useState } from "react";
import { Download, Upload, Database, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function DataExportImport() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = async (type: "all" | "jobs" | "integrations" | "settings") => {
    setExporting(true);
    try {
      const response = await fetch(`/api/data/export?type=${type}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `settler-export-${type}-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error: unknown) {
      console.error("Failed to export:", error);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (file: File) => {
    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const response = await fetch("/api/data/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert("Data imported successfully!");
        window.location.reload();
      }
    } catch (error: unknown) {
      console.error("Failed to import:", error);
      alert("Failed to import data. Please check the file format.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Data Export & Import
        </CardTitle>
        <CardDescription>Export or import your Settler data</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="export">
          <TabsList>
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4 mt-4">
            <Alert>
              <AlertDescription>
                Export your data in JSON format. This includes all your jobs, integrations, and
                settings.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => handleExport("all")}
                disabled={exporting}
                variant="outline"
                className="h-24 flex-col"
              >
                <Download className="w-6 h-6 mb-2" />
                Export All Data
              </Button>
              <Button
                onClick={() => handleExport("jobs")}
                disabled={exporting}
                variant="outline"
                className="h-24 flex-col"
              >
                <FileText className="w-6 h-6 mb-2" />
                Export Jobs Only
              </Button>
              <Button
                onClick={() => handleExport("integrations")}
                disabled={exporting}
                variant="outline"
                className="h-24 flex-col"
              >
                <Database className="w-6 h-6 mb-2" />
                Export Integrations
              </Button>
              <Button
                onClick={() => handleExport("settings")}
                disabled={exporting}
                variant="outline"
                className="h-24 flex-col"
              >
                <FileText className="w-6 h-6 mb-2" />
                Export Settings
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-4 mt-4">
            <Alert>
              <AlertDescription>
                Import data from a previous export. This will merge with your existing data.
              </AlertDescription>
            </Alert>

            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <input
                type="file"
                accept=".json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImport(file);
                }}
                disabled={importing}
                className="hidden"
                id="import-file"
              />
              <label htmlFor="import-file" className="cursor-pointer">
                <Button disabled={importing} variant="outline" type="button">
                  {importing ? "Importing..." : "Choose File"}
                </Button>
              </label>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Select a JSON file from a previous export
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
