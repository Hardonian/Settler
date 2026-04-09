/**
 * Receipts Hash View Component
 *
 * Displays receipts with hash chain for tamper-evident audit trail.
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Receipt, Shield, CheckCircle2, AlertTriangle, Copy, Eye } from "lucide-react";
import type { Receipt as ReceiptType } from "@/lib/domain/types";

interface ReceiptsHashViewProps {
  limit?: number;
}

export function ReceiptsHashView({ limit = 50 }: ReceiptsHashViewProps) {
  const [receipts, setReceipts] = useState<ReceiptType[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean;
    issues: string[];
  } | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/console/receipts-v2?limit=${limit}`);

      if (!res.ok) {
        throw new Error(`Failed to fetch receipts: ${res.status}`);
      }

      const data = await res.json();
      setReceipts(data.receipts || []);
    } catch (error: unknown) {
      console.error("Failed to fetch receipts:", error);
      setError(error instanceof Error ? error.message : "Failed to load receipts");
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  };

  const verifyReceipt = async (receiptId: string) => {
    try {
      setVerifying(receiptId);
      setVerificationResult(null);

      const res = await fetch(`/api/console/receipts-v2?verify=${receiptId}`);

      if (!res.ok) {
        throw new Error(`Failed to verify receipt: ${res.status}`);
      }

      const data = await res.json();
      setVerificationResult(data.verification);
    } catch (error: unknown) {
      console.error("Failed to verify receipt:", error);
      setVerificationResult({
        valid: false,
        issues: [error instanceof Error ? error.message : "Verification failed"],
      });
    } finally {
      setVerifying(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatHash = (hash: string) => {
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading receipts...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Button onClick={fetchReceipts}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Receipts</h2>
          <p className="text-muted-foreground">
            Tamper-evident receipts with hash chain integrity verification.
          </p>
        </div>
        <Button onClick={fetchReceipts} variant="outline">
          Refresh
        </Button>
      </div>

      {receipts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="w-12 h-12 mx-auto mb-4 text-muted-foreground/60" />
            <h3 className="text-lg font-semibold mb-2">No receipts yet</h3>
            <p className="text-muted-foreground">Receipts will appear here once created.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {receipts.map((receipt) => (
            <Card key={receipt.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{receipt.narrative.summary}</CardTitle>
                    <CardDescription className="mt-2">
                      {receipt.narrative.whyItMatters}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="ml-4">
                    <Shield className="w-4 h-4 mr-1" />
                    Hash Chain
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Hash Chain */}
                  <div className="p-4 bg-muted/10 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Receipt Hash</p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono bg-white dark:bg-card/80 px-2 py-1 rounded">
                            {formatHash(receipt.hash)}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(receipt.hash)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      {receipt.prevHash && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Previous Hash</p>
                          <div className="flex items-center gap-2">
                            <code className="text-xs font-mono bg-white dark:bg-card/80 px-2 py-1 rounded">
                              {formatHash(receipt.prevHash)}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(receipt.prevHash!)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Evidence */}
                  {receipt.evidenceRefs.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Evidence References</p>
                      <div className="flex flex-wrap gap-2">
                        {receipt.evidenceRefs.map((evidence, idx) => (
                          <Badge key={idx} variant="outline" className="font-mono text-xs">
                            {evidence.type}: {evidence.value.substring(0, 20)}...
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedReceipt(receipt);
                        setDetailDialogOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => verifyReceipt(receipt.id)}
                      disabled={verifying === receipt.id}
                    >
                      {verifying === receipt.id ? (
                        <>
                          <div className="w-4 h-4 mr-2 animate-spin rounded-full border-b-2 border-blue-600"></div>
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 mr-2" />
                          Verify Chain
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Verification Result */}
                  {verifying !== receipt.id &&
                    verificationResult &&
                    selectedReceipt?.id === receipt.id && (
                      <div
                        className={`p-4 rounded-lg border ${
                          verificationResult.valid
                            ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                            : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {verificationResult.valid ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                          )}
                          <div>
                            <p
                              className={`text-sm font-medium mb-1 ${
                                verificationResult.valid
                                  ? "text-green-900 dark:text-green-300"
                                  : "text-red-900 dark:text-red-300"
                              }`}
                            >
                              {verificationResult.valid ? "Chain Valid" : "Chain Invalid"}
                            </p>
                            {verificationResult.issues.length > 0 && (
                              <ul className="text-xs text-red-800 dark:text-red-400 list-disc list-inside">
                                {verificationResult.issues.map((issue, idx) => (
                                  <li key={idx}>{issue}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Created: {new Date(receipt.createdAt).toLocaleString()}</span>
                    {receipt.sourceId && <span>Source: {receipt.sourceId}</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Receipt Details</DialogTitle>
            <DialogDescription>{selectedReceipt?.narrative.summary}</DialogDescription>
          </DialogHeader>
          {selectedReceipt && (
            <div className="space-y-4">
              {/* Narrative */}
              <div>
                <p className="text-sm font-medium mb-2">Why This Matters</p>
                <p className="text-sm text-muted-foreground">
                  {selectedReceipt.narrative.whyItMatters}
                </p>
              </div>

              {selectedReceipt.narrative.nextSteps && (
                <div>
                  <p className="text-sm font-medium mb-2">Next Steps</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedReceipt.narrative.nextSteps}
                  </p>
                </div>
              )}

              {/* Canonical JSON */}
              <div>
                <p className="text-sm font-medium mb-2">Canonical JSON</p>
                <pre className="text-xs bg-muted/10 p-4 rounded-lg overflow-x-auto">
                  {JSON.stringify(selectedReceipt.canonicalJson, null, 2)}
                </pre>
              </div>

              {/* Hash Chain */}
              <div>
                <p className="text-sm font-medium mb-2">Hash Chain</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Current Hash</p>
                    <code className="text-xs font-mono bg-muted/10 px-2 py-1 rounded block break-all">
                      {selectedReceipt.hash}
                    </code>
                  </div>
                  {selectedReceipt.prevHash && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Previous Hash</p>
                      <code className="text-xs font-mono bg-muted/10 px-2 py-1 rounded block break-all">
                        {selectedReceipt.prevHash}
                      </code>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
