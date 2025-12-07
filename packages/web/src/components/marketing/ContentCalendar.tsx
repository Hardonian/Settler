"use client";

import { useState, useEffect } from "react";
import { Calendar, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { generateContentCalendar, exportCalendarAsCSV, type ContentItem } from "@/lib/content-calendar";
import { cn } from "@/lib/utils";

export function ContentCalendar() {
  const [calendar, setCalendar] = useState<ContentItem[]>([]);
  const [selectedType, setSelectedType] = useState<string>("all");

  useEffect(() => {
    const generated = generateContentCalendar();
    setCalendar(generated);
  }, []);

  const filteredCalendar =
    selectedType === "all"
      ? calendar
      : calendar.filter((item) => item.type === selectedType);

  const handleExport = () => {
    const csv = exportCalendarAsCSV(filteredCalendar);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `content-calendar-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const typeColors = {
    blog: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    social: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    seo: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    email: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Content Calendar</CardTitle>
            <CardDescription>3-month SEO and social media content plan</CardDescription>
          </div>
          <Button onClick={handleExport} size="sm" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filter:</span>
          {["all", "blog", "social", "seo", "email"].map((type) => (
            <Button
              key={type}
              size="sm"
              variant={selectedType === type ? "default" : "outline"}
              onClick={() => setSelectedType(type)}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
          ))}
        </div>

        {/* Calendar */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {filteredCalendar.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
            >
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-slate-900 dark:text-white truncate">
                    {item.title}
                  </h4>
                  <Badge className={cn("text-xs", typeColors[item.type])}>{item.type}</Badge>
                  {item.platform && (
                    <Badge variant="outline" className="text-xs">
                      {item.platform}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{item.description}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span>{new Date(item.date).toLocaleDateString()}</span>
                  <span className="capitalize">{item.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
