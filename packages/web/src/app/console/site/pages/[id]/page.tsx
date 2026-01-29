/**
 * Page Editor
 *
 * Edit page blocks with drag-and-drop, live preview, and block configuration.
 */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Save, Eye, ArrowLeft, Plus, GripVertical, X } from "lucide-react";
import { PageBlock, getBlockDefault } from "@/domain/siteBuilder/pageSchema";
import { PageRenderer } from "@/domain/siteBuilder/pageRenderer";
import { BlockConfigPanel } from "@/components/siteBuilder/BlockConfigPanel";
import { cn } from "@/lib/utils";

interface TenantPage {
  id: string;
  slug: string;
  pageType: string;
  blocks: PageBlock[];
  seoTitle: string | null;
  seoDescription: string | null;
  seoImageUrl: string | null;
  isDraft: boolean;
}

export default function PageEditorPage() {
  const params = useParams();
  const router = useRouter();
  const pageId = params.id as string;

  const [page, setPage] = useState<TenantPage | null>(null);
  const [blocks, setBlocks] = useState<PageBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);

  useEffect(() => {
    loadPage();
  }, [pageId]);

  async function loadPage() {
    try {
      const response = await fetch(`/api/console/site/pages/${pageId}`);
      if (!response.ok) throw new Error("Failed to load page");
      const data = await response.json();
      setPage(data.page);
      setBlocks((data.page.blocks || []) as PageBlock[]);
    } catch (err) {
      console.error("Error loading page:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const response = await fetch(`/api/console/site/pages/${pageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocks,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save page");
      }

      const data = await response.json();
      setPage(data.page);
      alert("Page saved successfully");
    } catch (err) {
      console.error("Error saving page:", err);
      alert(err instanceof Error ? err.message : "Failed to save page");
    }
  }

  async function handlePublish() {
    if (!confirm("Publish this page? It will be visible to visitors.")) return;

    try {
      const response = await fetch(`/api/console/site/pages/${pageId}/publish`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to publish page");

      await loadPage();
      alert("Page published successfully");
    } catch (err) {
      console.error("Error publishing page:", err);
      alert("Failed to publish page");
    }
  }

  function handleAddBlock(type: string) {
    const defaultBlock = getBlockDefault(type);
    const newBlock: PageBlock = {
      ...defaultBlock,
      id: `block-${Date.now()}`,
      type: type as any,
    } as PageBlock;

    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
  }

  function handleDeleteBlock(blockId: string) {
    setBlocks(blocks.filter((b: any) => b.id !== blockId));
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  }

  function handleUpdateBlock(blockId: string, updates: Partial<PageBlock>) {
    setBlocks(blocks.map((b) => (b.id === blockId ? ({ ...b, ...updates } as PageBlock) : b)));
  }

  function handleMoveBlock(fromIndex: number, toIndex: number) {
    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(fromIndex, 1);
    if (moved) {
      newBlocks.splice(toIndex, 0, moved);
      setBlocks(newBlocks);
    }
  }

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) as PageBlock | undefined;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-electric-cyan mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading page...</p>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-400 mb-4">Page not found</p>
        <Button variant="outline" onClick={() => router.push("/console/site")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Pages
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/console/site")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {page.seoTitle || page.slug || "Edit Page"}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">/{page.slug || "home"}</p>
          </div>
          {page.isDraft && <Badge variant="secondary">Draft</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="w-4 h-4 mr-2" />
            {showPreview ? "Hide" : "Show"} Preview
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save"}
          </Button>
          {page.isDraft && (
            <Button onClick={handlePublish} variant="default">
              Publish
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Block List */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Blocks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-2">
                {blocks.map((block, index) => (
                  <div
                    key={block.id}
                    className={cn(
                      "flex items-center gap-2 p-3 border rounded-lg cursor-move",
                      selectedBlockId === block.id &&
                        "border-blue-500 bg-blue-50 dark:bg-blue-900/20",
                      draggedBlockId === block.id && "opacity-50"
                    )}
                    onClick={() => setSelectedBlockId(block.id)}
                    draggable
                    onDragStart={() => setDraggedBlockId(block.id)}
                    onDragEnd={() => setDraggedBlockId(null)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (draggedBlockId && draggedBlockId !== block.id) {
                        const draggedIndex = blocks.findIndex((b) => b.id === draggedBlockId);
                        if (draggedIndex !== -1) {
                          handleMoveBlock(draggedIndex, index);
                        }
                      }
                    }}
                  >
                    <GripVertical className="w-4 h-4 text-slate-400" />
                    <div className="flex-1">
                      <div className="font-medium text-sm capitalize">{block.type}</div>
                      {!block.visible && (
                        <Badge variant="outline" className="text-xs">
                          Hidden
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBlock(block.id);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Add Block</p>
                <div className="grid grid-cols-2 gap-2">
                  {["hero", "featureGrid", "ctaBanner", "pricingTable", "faq", "testimonial"].map(
                    (type) => (
                      <Button
                        key={type}
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddBlock(type)}
                        className="text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        {type}
                      </Button>
                    )
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Editor / Preview */}
        <div className="lg:col-span-2">
          {showPreview ? (
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-white dark:bg-slate-900">
                  <PageRenderer blocks={blocks} />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Editor</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedBlock ? (
                  <BlockConfigPanel
                    block={selectedBlock}
                    onUpdate={(updates) => handleUpdateBlock(selectedBlock.id, updates)}
                  />
                ) : (
                  <div className="text-center py-12 text-slate-600 dark:text-slate-400">
                    Select a block to edit, or add a new block
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
