"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle2,
  ClipboardList,
  Copy,
  ExternalLink,
  Filter,
  Search,
  TrendingUp,
  X,
  ChevronDown,
  ChevronRight,
  Flag,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBulkTriage } from "@/hooks/use-bulk-triage";
import { appLogger } from "@/lib/utils/logger";
import { SkeletonTableRow } from "@/components/shared/loading-state";

export function BulkTriageClient() {
  const {
    items,
    filters,
    setFilters,
    selectedAction,
    setSelectedAction,
    isLoading,
    error,
    refresh,
    applyAction,
  } = useBulkTriage();

  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setFilters((prev: any) => ({ ...prev, search: e.target.value }));
  };

  const handleFilterChange = (value: string) => {
    setFilters((prev: any) => ({ ...prev, status: value === "all" ? undefined : value }));
  };

  const handleActionChange = (value: string) => {
    setSelectedAction(value as any);
  };

  const handleApplyAction = async () => {
    if (!selectedAction) return;
    try {
      await applyAction(selectedAction);
      await refresh();
    } catch (err) {
      appLogger.error("Failed to apply bulk action", err);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <SkeletonTableRow key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Error loading bulk triage: {error.message}</p>
        <Button variant="outline" onClick={refresh}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with search and filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10 pr-4 py-2 border border-input bg-background rounded-md shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleFilterChange("all")}>
                All Statuses
              </DropdownMenuItem>
              <Separator />
              <DropdownMenuItem onClick={() => handleFilterChange("pending")}>
                Pending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange("matched")}>
                Matched
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange("mismatched")}>
                Mismatched
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange("requires-review")}>
                Requires Review
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Select Action
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => handleActionChange("match")}>
                Match Selected
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleActionChange("flag")}>
                Flag for Review
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleActionChange("ignore")}>
                Ignore Selected
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleActionChange("escalate")}>
                Escalate to Team
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleApplyAction} className="h-10 px-4">
            {selectedAction ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Apply {selectedAction}
              </>
            ) : (
              "Apply Action"
            )}
          </Button>
        </div>
      </div>

      {/* Items table */}
      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Transaction ID</TableHead>
              <TableHead className="w-24 text-right">Amount</TableHead>
              <TableHead className="w-20">Date</TableHead>
              <TableHead className="w-24">Source System</TableHead>
              <TableHead className="w-20">Status</TableHead>
              <TableHead className="w-12 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.data.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.transactionId}</p>
                      <p className="text-xs text-muted-foreground">{item.externalId}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap text-right">
                  <p className="text-sm font-medium text-foreground">{item.amount}</p>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <p className="text-sm text-muted-foreground">{item.date}</p>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <p className="text-sm text-muted-foreground">{item.sourceSystem}</p>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      item.status === "matched"
                        ? "bg-green-100 text-green-800"
                        : item.status === "mismatched"
                          ? "bg-red-100 text-red-800"
                          : item.status === "requires-review"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {item.status}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap text-right space-x-2">
                  <Button variant="ghost" size="icon">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Flag className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
