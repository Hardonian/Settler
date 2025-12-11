import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Edit, MoreHorizontal, FilePlus } from 'lucide-react';

// Mock data for now - will be replaced with real data fetch in next iteration
const pages = [
  { id: '1', title: 'Home', slug: '/', status: 'published', lastUpdated: '2 hours ago' },
  { id: '2', title: 'Pricing', slug: '/pricing', status: 'published', lastUpdated: '1 day ago' },
  { id: '3', title: 'Documentation', slug: '/docs', status: 'draft', lastUpdated: '3 days ago' },
  { id: '4', title: 'Contact', slug: '/contact', status: 'published', lastUpdated: '1 week ago' },
];

export default function PagesList() {
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
              {pages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell className="font-medium">{page.title}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-500">{page.slug}</TableCell>
                  <TableCell>
                    <Badge variant={page.status === 'published' ? 'default' : 'secondary'} className={page.status === 'published' ? 'bg-green-100 text-green-700 hover:bg-green-200' : ''}>
                      {page.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500">{page.lastUpdated}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/pages/${page.id}/editor`}>
                        <Button size="sm" variant="outline" className="h-8">
                          <Edit size={14} className="mr-1" /> Edit
                        </Button>
                      </Link>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
