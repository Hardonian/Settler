import { getPages } from '@/app/actions/admin';
import { NewExperimentForm } from './NewExperimentForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function NewExperimentPage() {
    const { data: pages } = await getPages();

    return (
        <div className="p-8 max-w-2xl mx-auto">
             <div className="mb-8">
                <Link href="/admin/experiments">
                    <Button variant="ghost" size="sm" className="mb-4 pl-0 hover:bg-transparent">
                        <ArrowLeft size={16} className="mr-2" /> Back to Experiments
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Create New Experiment</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Experiment Details</CardTitle>
                    <CardDescription>Set up an A/B test for one of your pages.</CardDescription>
                </CardHeader>
                <CardContent>
                    <NewExperimentForm pages={pages || []} />
                </CardContent>
            </Card>
        </div>
    );
}
