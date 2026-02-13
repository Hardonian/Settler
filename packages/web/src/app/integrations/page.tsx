import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { PageLayout } from '@/components/content/PageLayout';
import { getContentPage } from '@/lib/content/pages';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  const page = getContentPage('integrations');
  if (!page) {
    return { title: 'Integrations' };
  }
  return {
    title: page.title,
    description: page.description,
  };
}

export default function IntegrationsPage() {
  const page = getContentPage('integrations');
  if (!page) {
    notFound();
  }

  return (
    <PageLayout title={page.title} description={page.description}>
      <MDXRemote source={page.content} />
    </PageLayout>
  );
}
