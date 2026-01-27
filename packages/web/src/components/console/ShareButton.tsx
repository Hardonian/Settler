/**
 * Share Button Component
 * Creates shareable links for reports, dashboards, etc.
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Check, Copy, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ShareButtonProps {
  artifactType: "reconciliation_report" | "receipt" | "dashboard";
  artifactId: string;
  artifactName?: string;
}

export function ShareButton({
  artifactType,
  artifactId,
  artifactName,
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artifactType,
          artifactId,
          public: isPublic,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create shareable link");
      }

      const data = await response.json();
      setShareUrl(data.shareUrl);
    } catch {
      setError("Failed to create shareable link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Share2 className="h-4 w-4" />
        Share
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share {artifactName || "Artifact"}</DialogTitle>
            <DialogDescription>
              Create a shareable link for this {artifactType.replace("_", " ")}.
            </DialogDescription>
          </DialogHeader>

          {!shareUrl ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="public">Make public</Label>
                <Switch
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
              </div>
              <p className="text-sm text-slate-500">
                {isPublic
                  ? "Anyone with the link can view this artifact."
                  : "Only you and people you share the link with can view this artifact."}
              </p>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleShare}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600"
              >
                {loading ? "Creating link..." : "Create Shareable Link"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>Shareable Link</Label>
                <div className="flex gap-2 mt-2">
                  <Input value={shareUrl} readOnly className="flex-1" />
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  asChild
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsOpen(false)}
                >
                  <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Link
                  </a>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShareUrl(null);
                    setIsPublic(false);
                  }}
                >
                  Create Another
                </Button>
              </div>

              <p className="text-xs text-slate-500">
                This link expires in 30 days. You can create a new one anytime.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
