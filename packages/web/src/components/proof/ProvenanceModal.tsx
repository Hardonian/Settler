"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldCheck, Database, ArrowRight, Fingerprint, Clock, AlertCircle } from "lucide-react";

interface ProvenanceNode {
  id: string;
  type: string;
  source: string;
  timestamp: string;
  reliability: number;
  hash: string;
}

interface ProvenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  exceptionId: string;
  provenanceNodes?: ProvenanceNode[];
}

export function ProvenanceModal({
  isOpen,
  onClose,
  exceptionId,
  provenanceNodes = [],
}: ProvenanceModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-2 mb-1">
            <Fingerprint className="w-5 h-5 text-blue-600" />
            <DialogTitle>Proof Provenance Chain</DialogTitle>
          </div>
          <DialogDescription>
            Detailed lineage and cryptographic verification for Exception {exceptionId.slice(0, 8)}
            ...
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-6 pb-6">
            <div className="rounded-lg border border-green-100 bg-green-50/50 dark:border-green-900/30 dark:bg-green-950/20 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-900 dark:text-green-300">
                    Deterministic Proof Chain
                  </p>
                  <p className="text-xs text-green-800/80 dark:text-green-400/80">
                    All evidence artifacts in this chain have been verified against the original
                    source snapshots.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:via-muted before:to-transparent">
              {provenanceNodes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-50">
                  <Database className="w-10 h-10 mb-2" />
                  <p className="text-sm italic">Loading provenance metadata...</p>
                </div>
              ) : (
                provenanceNodes.map((node, i) => (
                  <div key={node.id} className="relative flex items-start gap-4">
                    <div className="absolute left-0 flex items-center justify-center w-10 h-10 rounded-full bg-card border-2 border-blue-500 shadow-sm z-10 text-blue-600">
                      <Database className="w-5 h-5" />
                    </div>
                    <div className="ml-12 flex-1 pt-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          {node.type}
                        </span>
                        <Badge
                          variant={node.reliability > 0.8 ? "success" : "warning"}
                          className="text-[10px] h-4"
                        >
                          {Math.round(node.reliability * 100)}% RELIABILITY
                        </Badge>
                      </div>
                      <div className="p-3 rounded-lg border bg-card/50 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold truncate max-w-[200px]">
                            {node.source}
                          </p>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {new Date(node.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                        <div className="space-y-1.5 font-mono text-[10px] text-muted-foreground break-all bg-muted/30 p-1.5 rounded">
                          <p>ID: {node.id}</p>
                          <p>HASH: {node.hash}</p>
                        </div>
                      </div>
                      {i < provenanceNodes.length - 1 && (
                        <div className="mt-4 flex justify-center">
                          <ArrowRight className="w-4 h-4 text-muted rotate-90" />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  This provenance chain represents the immutable path from raw data ingestion to the
                  final reconciliation exception. Tamper-detection is active across all evidence
                  nodes.
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
