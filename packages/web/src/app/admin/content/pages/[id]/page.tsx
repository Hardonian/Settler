/**
 * Admin Content Studio - Page Editor
 * 
 * Edit CMS page with block editor and versioning
 */

import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Save, Eye, History } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { resolveTenantFromRequest } from '@/lib/tenant/resolution';
import { safeCall } from '@/lib/safe/wrappers';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function PageEditorContent({ pageId }: { pageId: string }) {
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
  
  const page = await safeCall(
    async () => {
      const { data, error } = await supabase
        .from('cms_pages')
        .select('id, slug, title, status, updated_at, published_at')
        .eq('id', pageId)
        .eq('tenant_id', resolution.tenantId!)
        .single();
      
      if (error) throw error;
      return data;
    },
    null,
    'Failed to fetch page'
  );

  if (!page) {
    notFound();
  }

  // Get latest version
  const latestVersion = await safeCall(
    async () => {
      const { data, error } = await supabase
        .from('cms_page_versions')
        .select('id, content_json, created_at, created_by')
        .eq('page_id', pageId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    null,
    'Failed to fetch page version'
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/content/pages">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {page.title}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1 font-mono text-sm">
              /{page.slug}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <History className="w-4 h-4 mr-2" />
            Versions
          </Button>
          {page.status === 'published' && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/p/${page.slug}`} target="_blank">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Link>
            </Button>
          )}
          <Button size="sm">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Page Content</CardTitle>
          <CardDescription>
            Edit your page content using the block editor below
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Block editor will go here */}
          <div className="min-h-[400px] border border-slate-300 dark:border-slate-700 rounded-lg p-4">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Block editor placeholder. TipTap or similar editor will be integrated here.
            </p>
            {latestVersion && (
              <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded">
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(latestVersion.content_json, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Page Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              defaultValue={page.status}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminContentPageEditorPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-electric-cyan mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading page...</p>
          </div>
        </div>
      }
    >
      <PageEditorContent pageId={params.id} />
    </Suspense>
  );
}
