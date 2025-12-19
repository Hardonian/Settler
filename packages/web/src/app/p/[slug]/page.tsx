/**
 * Public CMS Page Renderer
 * 
 * Renders published CMS pages with fallback to bundled content
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { safeCall } from '@/lib/safe/wrappers';
import { resolveTenantFromRequest } from '@/lib/tenant/resolution';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function CMSPageContent({ slug }: { slug: string }) {
  const resolution = await resolveTenantFromRequest();
  
  // Try to get page from database
  const page = await safeCall(
    async () => {
      if (!resolution.tenantId) {
        // Public tenant or no tenant - try to find by slug across tenants
        const supabase = await createClient();
        const { data, error } = await supabase
          .from('cms_pages')
          .select('id, slug, title, tenant_id')
          .eq('slug', slug)
          .eq('status', 'published')
          .limit(1)
          .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        return data;
      } else {
        const supabase = await createClient();
        const { data, error } = await supabase
          .from('cms_pages')
          .select('id, slug, title')
          .eq('slug', slug)
          .eq('tenant_id', resolution.tenantId)
          .eq('status', 'published')
          .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        return data;
      }
    },
    null,
    'Failed to fetch page'
  );

  if (!page) {
    notFound();
  }

  // Get latest published version
  const version = await safeCall(
    async () => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('cms_page_versions')
        .select('content_json')
        .eq('page_id', page.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    null,
    'Failed to fetch page version'
  );

  const content = version?.content_json || { blocks: [] };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">{page.title}</h1>
      
      {/* Render blocks */}
      <div className="prose dark:prose-invert max-w-none">
        {Array.isArray(content.blocks) && content.blocks.length > 0 ? (
          content.blocks.map((block: any, index: number) => (
            <div key={index} className="mb-6">
              {block.type === 'paragraph' && (
                <p>{block.content}</p>
              )}
              {block.type === 'heading' && (
                <h2>{block.content}</h2>
              )}
              {block.type === 'image' && (
                <img src={block.src} alt={block.alt || ''} />
              )}
              {/* Add more block types as needed */}
            </div>
          ))
        ) : (
          <p className="text-slate-600 dark:text-slate-400">
            No content available.
          </p>
        )}
      </div>
    </div>
  );
}

export default function PublicCMSPage({
  params,
}: {
  params: { slug: string };
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
      <CMSPageContent slug={params.slug} />
    </Suspense>
  );
}
