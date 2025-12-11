import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getExperiments } from '@/app/actions/experiments';

export default async function ExperimentsList() {
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
                {experiments.map((exp: any) => (
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
}
