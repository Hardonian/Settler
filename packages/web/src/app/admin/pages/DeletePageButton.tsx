'use client';

import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { deletePage } from '@/app/actions/admin';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

export function DeletePageButton({ id }: { id: string }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this page?')) {
            startTransition(async () => {
                await deletePage(id);
                router.refresh();
            });
        }
    };

    return (
        <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleDelete}
            disabled={isPending}
        >
            <Trash2 size={14} />
        </Button>
    );
}
