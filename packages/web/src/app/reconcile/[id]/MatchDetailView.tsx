"use client";

import React, { useState, useTransition } from "react";
import { acceptMatch, modifyMatch, overrideMatch } from "../actions";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface MatchDetailViewProps {
  sourceId: string;
  sourceTx: any;
  matchResult: any;
  potentialTargets: any[];
  reviewState: any;
}

export default function MatchDetailView({
  sourceId,
  sourceTx,
  matchResult,
  potentialTargets,
  reviewState,
}: MatchDetailViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedTarget, setSelectedTarget] = useState<string | null>(
    matchResult?.targetTransactionId || null
  );
  const [notes, setNotes] = useState("");
  const [overrideReason, setOverrideReason] = useState("");

  const accepted = reviewState?.reviewed && reviewState?.status === "resolved";
  const statusColor = reviewState?.status === "resolved" ? "bg-emerald-500/10 text-emerald-500" :
    reviewState?.status === "dismissed" ? "bg-rose-500/10 text-rose-500" : "bg-blue-500/10 text-blue-500";
  
  const displayStatus = reviewState?.resolutionReason || (matchResult?.matchType || "unmatched");

  const submitAccept = () => {
    startTransition(async () => {
      await acceptMatch(sourceId, matchResult?.targetTransactionId || null, sourceTx);
      router.refresh();
    });
  };

  const submitModify = () => {
    startTransition(async () => {
      await modifyMatch(sourceId, selectedTarget, notes, sourceTx);
      router.refresh();
    });
  };

  const submitOverride = () => {
    startTransition(async () => {
      await overrideMatch(sourceId, overrideReason, sourceTx);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {reviewState && (
        <div className="flex items-center gap-3 p-4 border border-border bg-card rounded-xl">
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-foreground">Previously Adjudicated</h3>
            <p className="text-xs text-muted">
              Resolved as: <span className={`uppercase font-mono px-2 py-0.5 rounded-md text-[10px] space-x-2 ${statusColor}`}>{displayStatus}</span> 
              {" | "} By {reviewState.reviewedBy || "System Operator"} on {new Date(reviewState.createdAt).toLocaleString()}
            </p>
            {reviewState.notes && <p className="text-xs mt-2 italic border-l-2 border-border pl-2 text-muted">{reviewState.notes}</p>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card shadow-sm border-border">
          <CardHeader>
            <CardTitle>Source Transaction Identity</CardTitle>
            <CardDescription>{sourceTx.source || "Unknown Source"}</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
              <div className="col-span-1">
                <dt className="text-muted font-medium">Record ID</dt>
                <dd className="font-mono text-foreground mt-1 truncate">{sourceTx.id}</dd>
              </div>
              <div className="col-span-1">
                <dt className="text-muted font-medium">Timestamp</dt>
                <dd className="text-foreground mt-1">{new Date(sourceTx.timestamp).toLocaleString()}</dd>
              </div>
              <div className="col-span-1">
                <dt className="text-muted font-medium">Amount</dt>
                <dd className="font-mono font-medium text-xl text-foreground mt-1 text-teal-500">
                  {sourceTx.amount < 0 ? "-" : "+"}${Math.abs(sourceTx.amount).toFixed(2)}
                </dd>
              </div>
              <div className="col-span-1">
                <dt className="text-muted font-medium">Description</dt>
                <dd className="text-foreground mt-1">{sourceTx.description || sourceTx.vendor || "N/A"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm border-border bg-gradient-to-b from-card to-neutral-50/50">
          <CardHeader>
            <CardTitle>Engine Recommendation</CardTitle>
            <CardDescription>
              {matchResult?.matchType === "unmatched" 
                ? "Match Engine determined No Safe Confirmed Match available."
                : `Confidence: ${(matchResult?.confidence * 100).toFixed(1)}% | Diff: ${matchResult?.amountDiff ? "$" + matchResult.amountDiff.toFixed(2) : "$0.00"}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {matchResult?.targetTransactionId ? (
              <div className="text-sm p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                <p className="font-semibold text-emerald-600 mb-2">Algorithm detected a valid counterpart (Type: {matchResult.matchType})</p>
                <div className="font-mono text-emerald-800 break-all">{matchResult.targetTransactionId}</div>
              </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center border-dashed border-2 border-border/50 rounded-xl bg-card">
                  <div className="w-12 h-12 rounded-full bg-neutral-20 flex items-center justify-center mb-3">
                    <span className="text-lg text-muted">🔍</span>
                  </div>
                  <h4 className="font-medium text-foreground">No Target Confirmed</h4>
                  <p className="text-sm text-muted max-w-sm mx-auto mt-1">
                    The deterministic model rejected possible matches due to threshold violations or lacking parity.
                  </p>
                </div>
            )}
          </CardContent>
          <CardFooter className="bg-neutral-10/50 border-t border-border flex justify-between rounded-b-xl gap-2 mt-auto">
             <Button 
               variant="default"
               disabled={isPending || accepted} 
               onClick={submitAccept}
               className="w-full bg-teal-600 hover:bg-teal-700 text-white shadow"
             >
                {isPending ? "Persisting..." : "Accept Decision"}
             </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="border border-border bg-card shadow-sm rounded-xl overflow-hidden mt-6">
         <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold">Operator Overrides & Potential Ledger Targets</h3>
          <p className="text-sm text-muted mt-1">
             Select an alternative target for modification, or enforce a dismissal if none fit.
          </p>
         </div>

         <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 divide-x divide-border">
             <div className="pr-4">
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2 text-foreground">Possible Ledger Matches</h4>
                  {potentialTargets.length === 0 && (
                    <div className="text-sm text-muted py-2">No alternative items near the amount variance.</div>
                  )}
                  {potentialTargets.map((target) => (
                    <div 
                      key={target.id}
                      onClick={() => setSelectedTarget(target.id)}
                      className={`p-4 border rounded-md cursor-pointer transition-colors ${selectedTarget === target.id ? "border-teal-500 bg-teal-500/5 ring-1 ring-teal-500" : "border-border hover:bg-neutral-10"}`}
                    >
                      <div className="flex justify-between font-mono text-sm mb-1">
                        <span className="text-foreground">{target.id.split('-')[0]}...</span>
                        <span className="text-teal-500">${target.amount.toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-muted">
                        {target.date.toLocaleDateString()} &middot; {target.description}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-3 mt-6">
                   <input
                     value={notes}
                     onChange={(e) => setNotes(e.target.value)}
                     className="w-full border border-border bg-card p-2 text-sm rounded-md focus:border-teal-500 focus:ring-1 focus:outline-none"
                     placeholder="Why was the match modified? (Required context, e.g. Manual matching of multi-part.)"
                     disabled={accepted || isPending || !selectedTarget || selectedTarget === matchResult?.targetTransactionId}
                   />
                   <Button
                      variant="outline"
                      disabled={isPending || accepted || !notes || !selectedTarget || selectedTarget === matchResult?.targetTransactionId}
                      onClick={submitModify}
                      className="w-full border-teal-500/30 text-teal-600 hover:bg-teal-50"
                   >
                     {isPending ? "Persisting..." : "Confirm & Modify"}
                   </Button>
                </div>
             </div>

             <div className="pl-4">
                <div className="bg-rose-500/5 border border-rose-500/20 p-5 rounded-xl">
                  <h4 className="font-semibold text-rose-700 mb-2">Override & Dismiss</h4>
                  <p className="text-xs text-rose-600/80 mb-4">
                    If this item is an exception that will never reconcile natively, force resolution without a ledger destination.
                  </p>
                  
                  <textarea
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    rows={3}
                    placeholder="Provide operator rationale..."
                    disabled={isPending || accepted}
                    className="w-full border border-rose-500/20 bg-card p-2 text-sm rounded-md focus:border-rose-500 focus:ring-1 focus:outline-none mb-3"
                  />
                  
                  <Button
                    variant="destructive"
                    disabled={isPending || accepted || !overrideReason}
                    onClick={submitOverride}
                    className="w-full bg-rose-600 hover:bg-rose-700"
                  >
                    Force Dismissal
                  </Button>
                </div>
             </div>
         </div>
      </div>
    </div>
  );
}
