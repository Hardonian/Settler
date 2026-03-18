import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, TrendingUp, CheckCircle2, AlertTriangle, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWorkspaceInvestigation } from "@/hooks/use-workspace-investigation";
import { SkeletonCard } from "@/components/shared/loading-state";

export function WorkspaceInvestigationClient() {
  const { investigation, setFilters, isLoading, error, refresh } = useWorkspaceInvestigation();

  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    // In a real implementation, we would debounce and update filters
    setFilters((prev: any) => ({ ...prev, search: e.target.value }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Error loading investigation: {error.message}</p>
        <Button variant="outline" onClick={refresh}>
          Try again
        </Button>
      </div>
    );
  }

  if (!investigation) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No investigation selected</p>
        <Button variant="outline" asChild>
          <Link href="/workspace">Go to Workspace</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with navigation and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/workspace">
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Back to Workspace</span>
            </Link>
          </Button>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search investigation details..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10 pr-4 py-2 border border-input bg-background rounded-md shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <Button variant="outline" onClick={refresh} className="h-10 px-4">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 4v5h5" />
              <path d="M10 11a7 7 0 1 1 11.35-5.65" />
              <path d="M15.65 6.35A8.95 8.95 0 0 1 21 12c0 4.42-2.7 8.17-6.35 10.65" />
            </svg>
            Refresh
          </Button>
          <Button className="h-10 px-4">Export Investigation</Button>
        </div>
      </div>

      {/* Investigation overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Investigation #{investigation.id}
            <Badge variant="secondary" className="ml-2">
              {investigation.status}
            </Badge>
          </CardTitle>
          <CardDescription>
            {investigation.description || "No description available"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-muted rounded p-4">
              <p className="text-xs text-muted-foreground font-medium">Total Transactions</p>
              <p className="text-2xl font-bold text-foreground">
                {investigation.totalTransactions}
              </p>
            </div>
            <div className="bg-muted rounded p-4">
              <p className="text-xs text-muted-foreground font-medium">Matched</p>
              <p className="text-2xl font-bold text-foreground">
                {investigation.matchedTransactions}
              </p>
            </div>
            <div className="bg-muted rounded p-4">
              <p className="text-xs text-muted-foreground font-medium">Mismatched</p>
              <p className="text-2xl font-bold text-foreground">
                {investigation.mismatchedTransactions}
              </p>
            </div>
            <div className="bg-muted rounded p-4">
              <p className="text-xs text-muted-foreground font-medium">Requires Review</p>
              <p className="text-2xl font-bold text-foreground">
                {investigation.requiresReviewTransactions}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different investigation views */}
      <Tabs defaultValue="details" value="details" onValueChange={() => {}} className="w-full">
        <TabsList className="grid w-full grid-cols-[80px_1fr]">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-100 rounded flex items-center justify-center text-blue-600">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-foreground">
                        Matching Rules Applied
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {investigation.matchingRulesCount} rules
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-green-100 rounded flex items-center justify-center text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-foreground">
                        Auto-matched Transactions
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {investigation.autoMatchedCount} transactions
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-yellow-100 rounded flex items-center justify-center text-yellow-600">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-foreground">
                        Manual Review Required
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {investigation.manualReviewCount} transactions
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="transactions">
          {/* Transaction table would go here */}
          <div className="text-center py-12">
            <p className="text-muted-foreground">Transaction details view</p>
          </div>
        </TabsContent>
        <TabsContent value="evidence">
          {/* Evidence panel would go here */}
          <div className="text-center py-12">
            <p className="text-muted-foreground">Evidence collection view</p>
          </div>
        </TabsContent>
        <TabsContent value="timeline">
          {/* Timeline view would go here */}
          <div className="text-center py-12">
            <p className="text-muted-foreground">Investigation timeline</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
