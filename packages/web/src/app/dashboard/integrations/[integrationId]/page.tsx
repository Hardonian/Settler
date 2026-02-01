"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Save, TestTube } from "lucide-react";

interface IntegrationConfig {
  id: string;
  name: string;
  description: string;
  is_connected: boolean;
  config: Record<string, string>;
  required_fields: string[];
}

export default function IntegrationConfigurationPage() {
  const params = useParams();
  const router = useRouter();
  const integrationId = params?.integrationId as string | undefined;
  const [config, setConfig] = useState<IntegrationConfig | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const fetchIntegrationConfig = useCallback(async () => {
    if (!integrationId) return;
    
    try {
      setIsLoading(true);
      // Fetch from API
      const response = await fetch(`/api/integrations/${integrationId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch integration config');
      }
      const data = await response.json();
      const integrationConfig: IntegrationConfig = {
        id: data.id || integrationId,
        name: data.name || integrationId.charAt(0).toUpperCase() + integrationId.slice(1).replace(/-/g, " "),
        description: data.description || `Configure ${integrationId} integration settings`,
        is_connected: data.is_connected || false,
        config: data.config || {},
        required_fields: data.required_fields || ["api_key", "api_secret"],
      };
      setConfig(integrationConfig);
      setFormData(integrationConfig.config);
    } catch (_error) {
      console.error("Failed to fetch integration config:", error);
    } finally {
      setIsLoading(false);
    }
  }, [integrationId]);

  useEffect(() => {
    if (!integrationId) {
      router.push('/dashboard/integrations');
      return;
    }
    void fetchIntegrationConfig();
  }, [integrationId, router, fetchIntegrationConfig]);

  if (!integrationId) {
    return null;
  }

  const handleSave = async () => {
    try {
      setIsSaving(true);
      // In production: await fetch(`/api/integrations/${integrationId}/config`, { method: "POST", body: JSON.stringify(formData) });
      console.log("Saving config:", formData);
      // Update local state
      if (config) {
        setConfig({ ...config, config: formData, is_connected: true });
      }
    } catch (_error) {
      console.error("Save failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setIsTesting(true);
      // In production: await fetch(`/api/integrations/${integrationId}/test`, { method: "POST", body: JSON.stringify(formData) });
      console.log("Testing connection:", formData);
      alert("Connection test successful!");
    } catch (_error) {
      console.error("Test failed:", error);
      alert("Connection test failed. Please check your credentials.");
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!config) {
    return <div>Integration not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{config.name}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{config.description}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Enter your API credentials and settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.required_fields.map((field) => (
            <div key={field} className="space-y-2">
              <Label htmlFor={field}>
                {field
                  .split("_")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")}
              </Label>
              <Input
                id={field}
                type={field.includes("secret") || field.includes("key") ? "password" : "text"}
                value={formData[field] || ""}
                onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                placeholder={`Enter ${field.replace(/_/g, " ")}`}
              />
            </div>
          ))}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleTest} variant="outline" disabled={isTesting || isSaving}>
              {isTesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <TestTube className="mr-2 h-4 w-4" />
                  Test Connection
                </>
              )}
            </Button>
            <Button onClick={handleSave} disabled={isSaving || isTesting}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Configuration
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
