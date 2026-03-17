import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Filter, Search, TrendingUp, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWorkspace } from "@/hooks/use-workspace";
import { appLogger } from "@/lib/utils/logger";
import { ButtonLoading } from "@/components/shared/button-loading";
import { SkeletonTableRow } from "@/components/shared/loading-state";

export function ReconciliationQueueClient() {
  const { queues, filters, setFilters, selectedTab, setSelectedTab, isLoading, error, refresh } = useWorkspace();

  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    // In a real implementation, we would debounce and update filters
    setFilters((prev) => ({ ...prev, search: e.target.value }));
  };

  const handleFilterChange = (value: string) => {
    setFilters((prev) => ({ ...prev, status: value === "all" ? undefined : value }));
  };

  const handleTabChange = (value: string) => {
    setSelectedTab(value as any);
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
        <p className="text-destructive">Error loading workspace: {error.message}</p>
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
          <Button variant="outline" onClick={refresh} className="h-10 px-4">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4v5h5" />
              <path d="M10 11a7 7 0 1 1 11.35-5.65" />
              <path d="M15.65 6.35A8.95 8.95 0 0 1 21 12c0 4.42-2.7 8.17-6.35 10.65" />
            </svg>
            Refresh
          </Button>
          <Button className="h-10 px-4">
            Bulk Actions
          </Button>
        </div>
      </div>

      {/* Tabs for different queue views */}
      <Tabs defaultValue="all" value={selectedTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-[60px_1fr]">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="matched">Matched</TabsTrigger>
          <TabsTrigger value="mismatched">Mismatched</TabsTrigger>
          <TabsTrigger value="requires-review">Requires Review</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Transaction ID</TableHead>
                <TableHead className="w-24">Amount</TableHead>
                <TableHead className="w-20">Date</TableHead>
                <TableHead className="w-24">Source System</TableHead>
                <TableHead className="w-20">Status</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queues.map((queue) => (
                <TableRow key={queue.id}>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-muted rounded flex items-center justify-center text-sm text-muted-foreground">
                        {queue.sourceSystem.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{queue.transactionId}</p>
                        <p className="text-xs text-muted-foreground">{queue.externalId}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <p className="text-sm font-medium text-foreground">{queue.amount}</p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <p className="text-sm text-muted-foreground">{queue.date}</p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <p className="text-sm text-muted-foreground">{queue.sourceSystem}</p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        queue.status === "matched"
                          ? "bg-green-100 text-green-800"
                          : queue.status === "mismatched"
                            ? "bg-red-100 text-red-800"
                            : queue.status === "requires-review"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {queue.status}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right space-x-2">
                    <Button variant="ghost" size="icon" aria-label="View details">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Flag for review">
                      <Flag className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
        {/* Other tabs would have similar table structures with filtered data */}
      </Tabs>

      {/* Pagination controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-border">
        <div className="text-sm text-muted-foreground">
          Showing {queues.length} of {queues.totalCount} transactions
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" disabled>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" disabled>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}