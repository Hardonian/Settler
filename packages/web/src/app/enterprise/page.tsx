import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { PageLayout } from '@/components/content/PageLayout';
import { getContentPage } from '@/lib/content/pages';

export function generateMetadata(): Metadata {
  const page = getContentPage('enterprise');
  if (!page) {
    return { title: 'Enterprise' };
  }
  return {
    title: page.title,
    description: page.description,
  };
}

export default function EnterprisePage() {
  const page = getContentPage('enterprise');
  if (!page) {
    notFound();
  }

  return (
    <PageLayout title={page.title} description={page.description}>
      <MDXRemote source={page.content} />
    </PageLayout>
  );
}
