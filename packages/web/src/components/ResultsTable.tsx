"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  ExternalLink,
  Play,
  ChevronRight,
  Filter,
  Search,
  History,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface Match {
  id: string;
  runId: string;
  matchType: string;
  confidence: number;
  amount: number;
  currency: string;
  timestamp: string;
  status: "reviewed" | "pending";
  discrepancy: number;
}

export default function ResultsTable({ initialMatches }: { initialMatches: Match[] }) {
  const [matches] = useState<Match[]>(initialMatches);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMatches = matches.filter((match) => {
    const matchesQuery =
      match.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.runId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || match.matchType === filterType;
    return matchesQuery && matchesType;
  });

  const getMatchTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case "exact":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">EXACT</Badge>
        );
      case "fuzzy":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">FUZZY</Badge>;
      case "unmatched":
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            UNMATCHED
          </Badge>
        );
      default:
        return <Badge variant="outline">{type.toUpperCase()}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-muted/30 p-4 rounded-xl border border-border/40">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by Match ID or Run ID..."
            className="w-full bg-background border border-input rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground mr-1" />
          <select
            title="Filter by match type"
            className="bg-background border border-input rounded-lg py-2 px-3 text-sm outline-none cursor-pointer"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Match Types</option>
            <option value="exact">Exact</option>
            <option value="fuzzy">Fuzzy</option>
            <option value="unmatched">Unmatched</option>
          </select>
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-3">
        {filteredMatches.length > 0 ? (
          filteredMatches.map((match) => (
            <Card
              key={match.id}
              className="group overflow-hidden border-border/40 shadow-none hover:bg-muted/10 transition-all border-l-2 border-l-transparent hover:border-l-primary/40"
            >
              <CardContent className="p-4 sm:p-5">
                <div className="grid gap-6 md:grid-cols-6 items-center">
                  {/* ID & Context */}
                  <div className="md:col-span-2 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Match ID
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground/60">
                        {match.status.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold truncate font-mono">{match.id}</h3>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                      <History className="h-3 w-3" />
                      <Link
                        href={`/app/runs/${match.runId}`}
                        className="hover:text-primary transition-colors flex items-center gap-1"
                      >
                        Run {match.runId.slice(0, 8)}
                        <ExternalLink className="h-2 w-2" />
                      </Link>
                    </div>
                  </div>

                  {/* Financial Metrics */}
                  <div className="md:col-span-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                      Source Amount
                    </p>
                    <p className="text-sm font-bold font-mono text-foreground">
                      {match.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
                      {match.currency}
                    </p>
                  </div>

                  {/* Discrepancy */}
                  <div className="md:col-span-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                      Diff / Discrepancy
                    </p>
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          "text-sm font-bold font-mono",
                          match.discrepancy !== 0 ? "text-destructive" : "text-emerald-600"
                        )}
                      >
                        {match.discrepancy !== 0 ? `+${match.discrepancy.toFixed(2)}` : "0.00"}
                      </p>
                      {match.discrepancy !== 0 && (
                        <AlertCircle className="h-3 w-3 text-destructive" />
                      )}
                    </div>
                  </div>

                  {/* Criteria & Confidence */}
                  <div className="md:col-span-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Confidence
                      </p>
                      <span className="text-[10px] font-bold">
                        {(match.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Progress
                      value={match.confidence * 100}
                      className="h-1"
                      indicatorClassName={cn(
                        match.confidence > 0.9
                          ? "bg-emerald-500"
                          : match.confidence > 0.7
                            ? "bg-amber-500"
                            : "bg-destructive"
                      )}
                    />
                    <div className="mt-2 text-center">{getMatchTypeBadge(match.matchType)}</div>
                  </div>

                  {/* Actions */}
                  <div className="md:col-span-1 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="h-8 w-8 p-0 rounded-lg group-hover:bg-background"
                    >
                      <Link href={`/app/runs/${match.runId}`} title="Replay Trace">
                        <Play className="h-3.5 w-3.5 fill-current" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="h-8 px-3 rounded-lg flex items-center gap-1.5 text-xs font-bold bg-muted/20 border-border/40 hover:bg-primary/5 hover:text-primary hover:border-primary/20"
                    >
                      <Link href={`/app/runs/${match.runId}`}>
                        Evidence
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="py-24 text-center border-2 border-dashed border-border/40 rounded-2xl bg-muted/20">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <h3 className="text-base font-bold text-foreground">No outcomes found</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
              Refine your search parameters or check the Run history for ongoing reconciliations.
            </p>
            <Button
              variant="outline"
              className="mt-6 rounded-lg font-bold"
              onClick={() => {
                setSearchQuery("");
                setFilterType("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border/40">
        <p className="text-xs text-muted-foreground">
          Showing <span className="font-bold text-foreground">{filteredMatches.length}</span> of{" "}
          {matches.length} tracked outcomes
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled
            className="h-8 px-3 text-xs font-bold text-muted-foreground"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled
            className="h-8 px-3 text-xs font-bold text-muted-foreground"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

// Minimal Button shim for this component scope
function Button({ className, variant, size, children, ...props }: any) {
  const variants: any = {
    outline:
      "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
    primary: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline",
  };
  const sizes: any = {
    sm: "h-8 rounded-md px-3 text-xs",
    md: "h-9 px-4 py-2",
    lg: "h-10 rounded-md px-8",
    icon: "h-9 w-9",
  };

  if (props.asChild) {
    return React.cloneElement(props.children, {
      className: cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        variant ? variants[variant] : variants.primary,
        size ? sizes[size] : sizes.md,
        className,
        props.children.props.className
      ),
      ...props.children.props,
    });
  }

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        variant ? variants[variant] : variants.primary,
        size ? sizes[size] : sizes.md,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
