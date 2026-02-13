import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MdxPlainRenderer } from '@/components/content/MdxPlainRenderer';
import { PageLayout } from '@/components/content/PageLayout';
import { getContentPage } from '@/lib/content/pages';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  const page = getContentPage('product');
  if (!page) {
    return { title: 'Product' };
  }
  return {
    title: page.title,
    description: page.description,
  };
}

export default function ProductPage() {
  const page = getContentPage('product');
  if (!page) {
    notFound();
  }

  return (
    <PageLayout title={page.title} description={page.description}>
      <MdxPlainRenderer source={page.content} />
    </PageLayout>
  );
}
