"use client";

import { useState, useEffect } from "react";
import { Download, Upload, RotateCcw, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ProjectSnapshot {
  id: string;
  projectId: string;
  projectType: string;
  snapshotName: string;
  createdAt: string;
  createdBy?: string;
}

interface ProjectSnapshotManagerProps {
  projectId: string;
  projectType: "job" | "integration" | "workflow";
}

export function ProjectSnapshotManager({ projectId, projectType }: ProjectSnapshotManagerProps) {
  const [snapshots, setSnapshots] = useState<ProjectSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    void fetchSnapshots();
  }, [projectId, projectType]);

  const fetchSnapshots = async () => {
    try {
      const response = await fetch(
        `/api/projects/snapshots?projectId=${projectId}&projectType=${projectType}`
      );
      if (response.ok) {
        const data = await response.json();
        setSnapshots(data.snapshots || []);
      }
    } catch (error: unknown) {
      console.error("Failed to fetch snapshots:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSnapshot = async () => {
    const name = prompt("Enter snapshot name (optional):");
    setCreating(true);
    try {
      const response = await fetch("/api/projects/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          projectType,
          snapshotName: name || undefined,
        }),
      });

      if (response.ok) {
        await fetchSnapshots();
      }
    } catch (error: unknown) {
      console.error("Failed to create snapshot:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleExport = async (snapshotId: string) => {
    try {
      const response = await fetch(`/api/projects/snapshots/${snapshotId}/export`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `snapshot-${snapshotId}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error: unknown) {
      console.error("Failed to export snapshot:", error);
    }
  };

  const handleRollback = async (snapshotId: string) => {
    if (
      !confirm("Are you sure you want to rollback to this snapshot? This action cannot be undone.")
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/snapshots/${snapshotId}/rollback`, {
        method: "POST",
      });

      if (response.ok) {
        alert("Project rolled back successfully!");
        window.location.reload();
      }
    } catch (error: unknown) {
      console.error("Failed to rollback:", error);
      alert("Failed to rollback. Please try again.");
    }
  };

  const handleImport = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        const response = await fetch("/api/projects/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            projectType,
            snapshotData: data,
          }),
        });

        if (response.ok) {
          alert("Project imported successfully!");
          window.location.reload();
        }
      } catch (error: unknown) {
        console.error("Failed to import:", error);
        alert("Failed to import. Please check the file format.");
      }
    };
    input.click();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Project Snapshots</CardTitle>
            <CardDescription>
              Create snapshots, export, and rollback to previous versions
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleImport}>
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button size="sm" onClick={handleCreateSnapshot} disabled={creating}>
              {creating ? "Creating..." : "Create Snapshot"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">Loading...</div>
        ) : snapshots.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500 dark:text-slate-400 mb-4">No snapshots yet</p>
            <Button onClick={handleCreateSnapshot} disabled={creating}>
              Create First Snapshot
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {snapshots.map((snapshot) => (
              <div
                key={snapshot.id}
                className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900 dark:text-white truncate">
                      {snapshot.snapshotName || `Snapshot ${snapshot.id.slice(0, 8)}`}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(snapshot.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleExport(snapshot.id)}>
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleRollback(snapshot.id)}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Rollback
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
