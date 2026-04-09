"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/EmptyState";
import { Folder, Plus, FileJson, Download, Upload } from "lucide-react";
import Link from "next/link";

interface Collection {
  id: string;
  name: string;
  requests: Array<{
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: any;
  }>;
  createdAt: Date;
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    // Load from localStorage for now (will be DB-backed)
    const stored = localStorage.getItem("api-playground-collections");
    if (stored) {
      try {
        setCollections(JSON.parse(stored));
      } catch {
        // Ignore parse errors
      }
    }
  };

  const saveCollections = (newCollections: Collection[]) => {
    setCollections(newCollections);
    localStorage.setItem("api-playground-collections", JSON.stringify(newCollections));
  };

  const handleCreate = () => {
    if (!newCollectionName.trim()) return;

    const newCollection: Collection = {
      id: Date.now().toString(),
      name: newCollectionName,
      requests: [],
      createdAt: new Date(),
    };

    saveCollections([...collections, newCollection]);
    setNewCollectionName("");
    setShowCreate(false);
  };

  const handleExport = (collection: Collection) => {
    const dataStr = JSON.stringify(collection, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${collection.name.toLowerCase().replace(/\s+/g, "-")}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    try {
      const imported = JSON.parse(text);
      // Strip secrets before importing
      const sanitized = {
        ...imported,
        requests: imported.requests?.map((req: any) => ({
          ...req,
          headers: Object.fromEntries(
            Object.entries(req.headers || {}).filter(([k]) => k.toLowerCase() !== "authorization")
          ),
        })),
      };
      saveCollections([...collections, sanitized]);
    } catch {
      alert("Invalid collection file");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Collections</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Save and organize API requests into collections
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCreate(!showCreate)}>
            <Plus className="w-4 h-4 mr-2" />
            New Collection
          </Button>
          <label>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            <Button variant="outline" asChild>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                Import
              </span>
            </Button>
          </label>
        </div>
      </div>

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>Create Collection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="collection-name">Collection Name</Label>
              <Input
                id="collection-name"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="My API Collection"
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate}>Create</Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {collections.length === 0 ? (
        <EmptyState
          icon={Folder}
          title="No collections yet"
          description="Create a collection to organize your API requests"
          action={{
            label: "Create Collection",
            onClick: () => setShowCreate(true),
          }}
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((collection) => (
            <Card key={collection.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Folder className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-lg">{collection.name}</CardTitle>
                </div>
                <CardDescription>
                  {collection.requests.length} request{collection.requests.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport(collection)}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link href={`/console/api-playground?collection=${collection.id}`}>
                      <FileJson className="w-4 h-4 mr-2" />
                      Open
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
