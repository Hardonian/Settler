import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MdxPlainRenderer } from '@/components/content/MdxPlainRenderer';
import { PageLayout } from '@/components/content/PageLayout';
import { getContentPage } from '@/lib/content/pages';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  const page = getContentPage('open-source');
  if (!page) {
    return { title: 'Open Source' };
  }
  return {
    title: page.title,
    description: page.description,
  };
}

export default function OpenSourcePage() {
  const page = getContentPage('open-source');
  if (!page) {
    notFound();
  }

  return (
    <PageLayout title={page.title} description={page.description}>
      <MdxPlainRenderer source={page.content} />
    </PageLayout>
  );
}
