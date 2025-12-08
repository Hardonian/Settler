"use client";

import { useState, useEffect } from "react";
import { FileText, Search, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CannedResponse {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  usageCount: number;
}

export function CannedResponseManager() {
  const [responses, setResponses] = useState<CannedResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    void fetchResponses();
  }, []);

  const fetchResponses = async () => {
    try {
      const response = await fetch("/api/support/canned-responses");
      if (response.ok) {
        const data = await response.json();
        setResponses(data.responses || []);
      }
    } catch (error) {
      console.error("Failed to fetch canned responses:", error);
    }
  };

  const handleCopy = (content: string, id: string) => {
    void navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredResponses = responses.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || r.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(responses.map((r) => r.category)));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Canned Responses
        </CardTitle>
        <CardDescription>Quick responses for common support questions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search responses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat}>
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredResponses.map((response) => (
            <div
              key={response.id}
              className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                    {response.title}
                  </h4>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {response.category}
                    </Badge>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Used {response.usageCount} times
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(response.content, response.id)}
                >
                  {copiedId === response.id ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
                {response.content}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
