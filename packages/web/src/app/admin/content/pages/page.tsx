/**
 * Admin Content Studio - Pages List
 * 
 * Lists all CMS pages with draft/published status
 */

import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, FileText, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { resolveTenantFromRequest } from '@/lib/tenant/resolution';
import { safeCall } from '@/lib/safe/wrappers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function PagesListContent() {
  const resolution = await resolveTenantFromRequest();
  
  if (!resolution.tenantId) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          No tenant found. Please sign in or select a tenant.
        </p>
        <Button asChild>
          <Link href="/console">Go to Console</Link>
        </Button>
      </div>
    );
  }

  const supabase = await createClient();
  
  const pages = await safeCall(
    async () => {
      const { data, error } = await supabase
        .from('cms_pages')
        .select('id, slug, title, status, updated_at, published_at')
        .eq('tenant_id', resolution.tenantId!)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as Array<{
        id: string;
        slug: string;
        title: string;
        status: string;
        updated_at: string;
        published_at: string | null;
      }>;
    },
    [],
    'Failed to fetch pages'
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Content Pages
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Manage your CMS pages and content
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/content/pages/new">
            <Plus className="w-4 h-4 mr-2" />
            New Page
          </Link>
        </Button>
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search pages..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
          />
        </div>
      </div>

      {/* Pages grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pages.map((page) => (
          <Card key={page.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{page.title}</CardTitle>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    page.status === 'published'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}
                >
                  {page.status}
                </span>
              </div>
              <CardDescription className="font-mono text-xs">
                /{page.slug}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link href={`/admin/content/pages/${page.id}`}>
                    Edit
                  </Link>
                </Button>
                {page.status === 'published' && (
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href={`/p/${page.slug}`} target="_blank">
                      View
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pages.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              No pages yet. Create your first page to get started.
            </p>
            <Button asChild>
              <Link href="/admin/content/pages/new">
                <Plus className="w-4 h-4 mr-2" />
                Create Page
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function AdminContentPagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-electric-cyan mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading pages...</p>
          </div>
        </div>
      }
    >
      <PagesListContent />
    </Suspense>
  );
}
