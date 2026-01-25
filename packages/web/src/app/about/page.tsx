import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { PageLayout } from '@/components/content/PageLayout';
import { getContentPage } from '@/lib/content/pages';

export function generateMetadata(): Metadata {
  const page = getContentPage('about');
  if (!page) {
    return { title: 'About' };
  }
  return {
    title: page.title,
    description: page.description,
  };
}

export default function AboutPage() {
  const page = getContentPage('about');
  if (!page) {
    notFound();
  }

  return (
    <PageLayout title={page.title} description={page.description}>
      <MDXRemote source={page.content} />
    </PageLayout>
  );
}
