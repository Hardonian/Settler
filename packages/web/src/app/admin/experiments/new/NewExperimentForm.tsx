'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createExperiment } from '@/app/actions/experiments';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

// Since getPages is server action, we can't call it directly in client component render
// We'll pass pages as prop from server wrapper

interface NewExperimentFormProps {
    pages: { id: string; title: string; slug: string }[];
}

export function NewExperimentForm({ pages }: NewExperimentFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        setError('');
        
        const result = await createExperiment(formData);
        
        if (result.success && result.data) {
            router.push(`/admin/experiments/${result.data.id}`);
        } else {
            setError(result.error || 'Something went wrong');
            setIsLoading(false);
        }
    }

    return (
        <form action={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="name">Experiment Name</Label>
                <Input id="name" name="name" placeholder="e.g. New Hero Test" required />
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="slug">Experiment Slug</Label>
                <Input id="slug" name="slug" placeholder="e.g. new-hero-test-v1" required />
            </div>

            <div className="space-y-2">
                <Label htmlFor="targetPageId">Target Page</Label>
                <Select name="targetPageId" required>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a page to test" />
                    </SelectTrigger>
                    <SelectContent>
                        {pages.map(page => (
                            <SelectItem key={page.id} value={page.id}>
                                {page.title} ({page.slug})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                    {error}
                </div>
            )}

            <div className="flex justify-end gap-2">
                    <Link href="/admin/experiments">
                    <Button variant="outline" type="button">Cancel</Button>
                    </Link>
                    <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Experiment
                    </Button>
            </div>
        </form>
    );
}
