import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Edit, FilePlus } from 'lucide-react';
import { getPages } from '@/app/actions/admin';
import { DeletePageButton } from './DeletePageButton'; // We'll create this small client component

export const dynamic = 'force-dynamic';

export default async function PagesList() {
  const { data: pages, success, error } = await getPages();

  if (!success) {
      return (
          <div className="p-8">
              <div className="bg-red-50 text-red-600 p-4 rounded border border-red-200">
                  Error loading pages: {error}
              </div>
          </div>
      );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Pages</h1>
          <p className="text-slate-500 mt-1">Manage your website content and structure</p>
        </div>
        <Link href="/admin/pages/new">
          <Button className="gap-2">
            <FilePlus size={16} /> Create Page
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Pages</CardTitle>
        </CardHeader>
        <CardContent>
          {pages && pages.length > 0 ? (
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {pages.map((page: any) => (
                    <TableRow key={page.id}>
                    <TableCell className="font-medium">{page.title}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{page.slug}</TableCell>
                    <TableCell>
                        <Badge variant={page.status === 'published' ? 'default' : 'secondary'} className={page.status === 'published' ? 'bg-green-100 text-green-700 hover:bg-green-200' : ''}>
                        {page.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500">{new Date(page.lastUpdated).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                        <Link href={`/admin/pages/${page.id}/editor`}>
                            <Button size="sm" variant="outline" className="h-8">
                            <Edit size={14} className="mr-1" /> Edit
                            </Button>
                        </Link>
                        <DeletePageButton id={page.id} />
                        </div>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
          ) : (
             <div className="text-center py-12 text-slate-500">
                 No pages found. Create one to get started.
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
