"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExceptionProofpackDownloadProps {
  exceptionId: string;
}

export function ExceptionProofpackDownload({ exceptionId }: ExceptionProofpackDownloadProps) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    try {
      const response = await fetch(`/api/exceptions/${exceptionId}/proofpack`);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${response.status}`);
      }
      const artifact = await response.json();
      const blob = new Blob([JSON.stringify(artifact, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `exception-proofpack-${exceptionId.slice(0, 8)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={() => void handleDownload()}
        disabled={downloading}
      >
        {downloading ? (
          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5 mr-1.5" />
        )}
        {downloading ? "Downloading…" : "Download proofpack"}
      </Button>
      {error ? <p className="text-xs text-red-500 text-right max-w-[200px]">{error}</p> : null}
    </div>
  );
}
