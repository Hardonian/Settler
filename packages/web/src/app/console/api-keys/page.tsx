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
import { Key, Plus, Trash2, Copy, Check, CheckCircle2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  const [pendingRevokeId, setPendingRevokeId] = useState<string | null>(null);

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
    try {
      const res = await fetch(`/api/console/api-keys/${keyId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPendingRevokeId(null);
        await fetchKeys();
      }
    } catch (err) {
      console.error("Failed to revoke API key:", err);
      setPendingRevokeId(null);
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
      <div
        className="flex items-center justify-center min-h-[60vh]"
        role="status"
        aria-label="Loading API keys"
      >
        <div
          className="animate-spin rounded-full h-8 w-8 border-2 border-border border-t-primary"
          aria-hidden="true"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between pb-6 border-b border-border">
        <div>
          <p className="section-eyebrow mb-1.5">Developer Console</p>
          <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">API Keys</h1>
          <p className="text-sm text-muted-foreground">
            Manage API keys for authenticating requests to Settler APIs.
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
        <Card className="border-success/30 bg-success/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success">
              <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
              API Key Created
            </CardTitle>
            <CardDescription className="flex items-center gap-1.5 text-warning">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
              Copy this key now — it won&apos;t be shown again.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-card rounded-lg border border-border">
              <code className="flex-1 font-mono text-sm break-all text-foreground">
                {newKey.key}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(newKey.key)}
                className="shrink-0"
                aria-label={copied ? "Copied to clipboard" : "Copy API key"}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" aria-hidden="true" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" aria-hidden="true" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Add this key to your environment variables or SDK initialization before closing this
              dialog.
            </p>
            <Button variant="outline" className="w-full" onClick={() => setNewKey(null)}>
              Done — I&apos;ve saved the key
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
                      <Key
                        className="w-4 h-4 text-muted-foreground flex-shrink-0"
                        aria-hidden="true"
                      />
                      <h3 className="font-semibold text-foreground">{key.name || "Unnamed Key"}</h3>
                      {key.revokedAt && (
                        <Badge variant="destructive" size="sm">
                          Revoked
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground ml-7">
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
                  {!key.revokedAt &&
                    (pendingRevokeId === key.id ? (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-muted-foreground">Revoke key?</span>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRevokeKey(key.id)}
                        >
                          Confirm Revoke
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setPendingRevokeId(null)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPendingRevokeId(key.id)}
                        className="text-destructive hover:bg-destructive/10 hover:border-destructive/50 flex-shrink-0"
                        aria-label={`Revoke key ${key.name || key.keyPrefix}`}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                        Revoke
                      </Button>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
