/**
 * Console API Keys Page
 *
 * Manage API keys: list, create, revoke.
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Key, Plus, Trash2, Copy, Check, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { MilestoneCelebration, MilestoneType } from "@/components/milestones/MilestoneCelebration";

interface ApiKey {
  id: string;
  name?: string;
  keyPrefix: string;
  createdAt: Date;
  lastUsedAt?: Date;
  revokedAt?: Date;
  expiresAt?: Date;
  scopes: string[];
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState<{ key: string; id: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [milestone, setMilestone] = useState<MilestoneType | null>(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const res = await fetch("/api/console/api-keys");
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      }
    } catch (err) {
      console.error("Failed to fetch API keys:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    try {
      const res = await fetch("/api/console/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: keyName || undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewKey({ key: data.key, id: data.id });
        setKeyName("");
        await fetchKeys();

        // Check if this is the first API key (milestone)
        if (keys.length === 0) {
          setMilestone("first_api_key");
        }
      }
    } catch (err) {
      console.error("Failed to create API key:", err);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) {
      return;
    }
    try {
      const res = await fetch(`/api/console/api-keys/${keyId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchKeys();
      }
    } catch (err) {
      console.error("Failed to revoke API key:", err);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">API Keys</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your API keys for authenticating requests to Settler APIs.
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create API Key
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
              <DialogDescription>
                Give your key a name to help you identify it later.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="key-name">Key Name (optional)</Label>
                <Input
                  id="key-name"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g., Production API Key"
                />
              </div>
              <Button onClick={handleCreateKey} className="w-full">
                Create Key
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Milestone Celebration */}
      {milestone && (
        <MilestoneCelebration milestone={milestone} onDismiss={() => setMilestone(null)} />
      )}

      {/* New Key Display */}
      {newKey && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-900/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-green-900 dark:text-green-300 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              API Key Created Successfully
            </CardTitle>
            <CardDescription className="text-green-800 dark:text-green-400">
              ⚠️ Copy this key now. You won't be able to see it again!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 p-4 bg-white dark:bg-slate-800 rounded-lg border-2 border-green-200 dark:border-green-800">
              <code className="flex-1 font-mono text-sm break-all">{newKey.key}</code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(newKey.key)}
                className="shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Next steps:</strong> Add this key to your environment variables or use it in
                your SDK initialization.
              </p>
            </div>
            <Button variant="outline" className="w-full" onClick={() => setNewKey(null)}>
              I've copied the key
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Keys List */}
      {keys.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={Key}
              title="No API keys yet"
              description="Create your first API key to start using Settler APIs."
              action={{
                label: "Create API Key",
                onClick: () => setCreateDialogOpen(true),
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {keys.map((key) => (
            <Card key={key.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Key className="w-5 h-5 text-slate-400" />
                      <h3 className="font-semibold">{key.name || "Unnamed Key"}</h3>
                      {key.revokedAt && (
                        <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          Revoked
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400 ml-8">
                      <p>
                        <code className="font-mono">{key.keyPrefix}...</code>
                      </p>
                      <p>Created: {format(new Date(key.createdAt), "PPp")}</p>
                      {key.lastUsedAt && (
                        <p>Last used: {format(new Date(key.lastUsedAt), "PPp")}</p>
                      )}
                      {key.scopes.length > 0 && <p>Scopes: {key.scopes.join(", ")}</p>}
                    </div>
                  </div>
                  {!key.revokedAt && (
                    <Button variant="outline" size="sm" onClick={() => handleRevokeKey(key.id)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Revoke
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
