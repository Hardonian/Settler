import { getPage } from '@/app/actions/admin';
import EditorClient from './EditorClient';
import { notFound } from 'next/navigation';

export default async function PageEditor({ params }: { params: { id: string } }) {
    const { data: page, success } = await getPage(params.id);

    if (!success || !page) {
        notFound();
    }

    // Transform blocks if necessary or ensure array
    const blocks = Array.isArray(page.blocks) ? page.blocks : [];

    return <EditorClient initialPage={page} initialBlocks={blocks} />;
}
