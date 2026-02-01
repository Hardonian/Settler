import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getExperiments } from '@/app/actions/experiments';
import { adminLogger } from '@/lib/admin/utils/logger';

export default async function ExperimentsList() {
  try {
    const { data: experiments } = await getExperiments();

    return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Experiments</h1>
          <p className="text-slate-500 mt-1">A/B Tests and Feature Rollouts</p>
        </div>
        <Link href="/admin/experiments/new">
          <Button className="gap-2">
            <Plus size={16} /> New Experiment
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Experiments</CardTitle>
        </CardHeader>
        <CardContent>
          {experiments && experiments.length > 0 ? (
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Target Page</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {experiments.map((exp) => (
                    <TableRow key={exp.id}>
                    <TableCell className="font-medium">{exp.name}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{exp.slug}</TableCell>
                    <TableCell>{exp.targetPage?.slug || 'Unknown'}</TableCell>
                    <TableCell>
                        <Badge variant="outline">{exp.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <Button size="sm" variant="ghost">Manage</Button>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
          ) : (
             <div className="text-center py-12 text-slate-500">
                 No experiments running.
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
             
  } catch (error) {
    // Top-level error boundary for admin experiments
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    adminLogger.error('Error in admin experiments page', new Error(errorMessage));
    
    return (
      <div className="p-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="font-semibold text-red-900 dark:text-red-200">
              Unable to Load Experiments
            </h3>
          </div>
          <p className="text-sm text-red-800 dark:text-red-300">
            We encountered an error while loading experiments. Please try again or contact support if the problem persists.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <p className="text-xs font-mono text-red-600 dark:text-red-400 mt-2">
              {errorMessage}
            </p>
          )}
        </div>
      </div>
    );
  }
}
