/**
 * Site Designer Main Page
 * 
 * Lists all pages and provides navigation to editors.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, FileText, Palette } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TenantPage {
  id: string;
  slug: string;
  pageType: string;
  seoTitle: string | null;
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function SiteDesignerPage() {
  const [pages, setPages] = useState<TenantPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPageSlug, setNewPageSlug] = useState('');
  const [newPageType, setNewPageType] = useState('marketing');
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadPages();
  }, []);

  async function loadPages() {
    try {
      const response = await fetch('/api/console/site/pages');
      if (!response.ok) throw new Error('Failed to load pages');
      const data = await response.json();
      setPages(data.pages || []);
    } catch (error) {
      console.error('Error loading pages:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePage() {
    if (!newPageSlug.trim()) return;
    
    setCreating(true);
    try {
      const response = await fetch('/api/console/site/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: newPageSlug.trim(),
          pageType: newPageType,
          blocks: [],
          isDraft: true,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create page');
      }
      
      setCreateDialogOpen(false);
      setNewPageSlug('');
      setNewPageType('marketing');
      await loadPages();
    } catch (error) {
      console.error('Error creating page:', error);
      alert(error instanceof Error ? error.message : 'Failed to create page');
    } finally {
      setCreating(false);
    }
  }

  async function handleDeletePage(id: string) {
    if (!confirm('Are you sure you want to delete this page?')) return;
    
    setDeletingId(id);
    try {
      const response = await fetch(`/api/console/site/pages/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete page');
      
      await loadPages();
    } catch (error) {
      console.error('Error deleting page:', error);
      alert('Failed to delete page');
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-electric-cyan mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading pages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Site Designer
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your site pages, branding, and navigation.
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Page
        </Button>
      </div>

      {/* Pages List */}
      <div className="grid gap-4">
        {pages.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                No pages yet. Create your first page to get started.
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Page
              </Button>
            </CardContent>
          </Card>
        ) : (
          pages.map((page) => (
            <Card key={page.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle>{page.seoTitle || page.slug || 'Untitled'}</CardTitle>
                      {page.isDraft && (
                        <Badge variant="secondary">Draft</Badge>
                      )}
                      <Badge variant="outline">{page.pageType}</Badge>
                    </div>
                    <CardDescription>
                      /{page.slug || 'home'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                    >
                      <Link href={`/console/site/pages/${page.id}`}>
                        <Edit className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePage(page.id)}
                      disabled={deletingId === page.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span>Updated {new Date(page.updatedAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
            <CardDescription>Customize colors, fonts, and logos</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="w-full">
              <Link href="/console/site/branding">
                <Palette className="w-4 h-4 mr-2" />
                Edit Branding
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Navigation</CardTitle>
            <CardDescription>Manage header and footer navigation</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="w-full">
              <Link href="/console/site/navigation">
                <Edit className="w-4 h-4 mr-2" />
                Edit Navigation
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Create Page Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Page</DialogTitle>
            <DialogDescription>
              Create a new page for your site. You can add content blocks after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="slug">Page Slug</Label>
              <Input
                id="slug"
                value={newPageSlug}
                onChange={(e) => setNewPageSlug(e.target.value)}
                placeholder="pricing"
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">
                URL path (e.g., "pricing" for /pricing)
              </p>
            </div>
            <div>
              <Label htmlFor="pageType">Page Type</Label>
              <Select value={newPageType} onValueChange={setNewPageType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="docs">Documentation</SelectItem>
                  <SelectItem value="landing">Landing Page</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreatePage} disabled={creating || !newPageSlug.trim()}>
              {creating ? 'Creating...' : 'Create Page'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
