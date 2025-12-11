'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateExperiment } from '@/app/actions/experiments';
import { ArrowLeft, Play, Pause, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface ExperimentDashboardClientProps {
    experiment: any;
}

export default function ExperimentDashboardClient({ experiment }: ExperimentDashboardClientProps) {
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState(experiment.status);
    const [split, setSplit] = useState<Record<string, number>>(experiment.trafficSplit as Record<string, number>);

    const handleSave = () => {
        startTransition(async () => {
            const result = await updateExperiment(experiment.id, {
                name: experiment.name,
                status,
                trafficSplit: split
            });
            if (result.success) {
                alert('Saved successfully');
            } else {
                alert('Failed to save');
            }
        });
    };

    const toggleStatus = () => {
        const newStatus = status === 'running' ? 'paused' : 'running';
        setStatus(newStatus);
        // Auto save on toggle
        startTransition(async () => {
            await updateExperiment(experiment.id, {
                ...experiment,
                status: newStatus,
                trafficSplit: split
            });
        });
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                     <Link href="/admin/experiments">
                        <Button variant="ghost" size="sm" className="mb-2 pl-0 hover:bg-transparent">
                            <ArrowLeft size={16} className="mr-2" /> Back
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        {experiment.name}
                        <Badge variant={status === 'running' ? 'default' : 'secondary'} className={status === 'running' ? 'bg-green-100 text-green-700' : ''}>
                            {status}
                        </Badge>
                    </h1>
                    <p className="text-slate-500 mt-1">Target Page: {experiment.targetPage?.slug}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={toggleStatus} disabled={isPending}>
                        {status === 'running' ? <><Pause size={16} className="mr-2"/> Pause Experiment</> : <><Play size={16} className="mr-2"/> Start Experiment</>}
                    </Button>
                    <Button onClick={handleSave} disabled={isPending}>
                        {isPending ? <Loader2 className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                        Save Config
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Traffic Split</CardTitle>
                        <CardDescription>Percentage of traffic for each variant</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {experiment.variants.map((variant: any) => (
                            <div key={variant.id} className="flex items-center gap-4">
                                <Label className="w-24 font-bold">{variant.label}</Label>
                                <div className="flex-1 flex items-center gap-2">
                                    <Input 
                                        type="number" 
                                        min="0" 
                                        max="100" 
                                        value={split[variant.key] || 0}
                                        onChange={(e) => setSplit({ ...split, [variant.key]: parseInt(e.target.value) || 0 })}
                                    />
                                    <span className="text-slate-500">%</span>
                                </div>
                            </div>
                        ))}
                        <div className="pt-4 border-t text-sm text-slate-500 flex justify-between">
                            <span>Total:</span>
                            <span className={Object.values(split).reduce((a, b) => a + b, 0) !== 100 ? "text-red-500 font-bold" : "text-green-600 font-bold"}>
                                {Object.values(split).reduce((a, b) => a + b, 0)}%
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Results</CardTitle>
                        <CardDescription>Live metrics from the experiment</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8 text-slate-500">
                            Analytics integration pending...
                            {/* Hook up real analytics here in next phase */}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
