import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MdxPlainRenderer } from '@/components/content/MdxPlainRenderer';
import { PageLayout } from '@/components/content/PageLayout';
import { getContentPage } from '@/lib/content/pages';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  const page = getContentPage('security-and-audit');
  if (!page) {
    return { title: 'Security & Audit' };
  }
  return {
    title: page.title,
    description: page.description,
  };
}

export default function SecurityAndAuditPage() {
  const page = getContentPage('security-and-audit');
  if (!page) {
    notFound();
  }

  return (
    <PageLayout title={page.title} description={page.description}>
      <MdxPlainRenderer source={page.content} />
    </PageLayout>
  );
}
