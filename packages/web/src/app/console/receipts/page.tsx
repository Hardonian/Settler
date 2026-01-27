/**
 * Console Receipts Page
 * 
 * Browse and view parsed receipts.
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Receipt, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ConsoleErrorBoundary } from '@/components/console/ErrorBoundary';

interface ReceiptListItem {
  id: string;
  vendor: string | null;
  date: Date | null;
  currency: string | null;
  total: number | null;
  confidenceScore: number | null;
  itemCount: number;
  createdAt: Date;
}

interface ReceiptDetail extends ReceiptListItem {
  subtotal: number | null;
  tax: number | null;
  paymentMethod: string | null;
  items: Array<{
    name: string;
    quantity: number | null;
    unitPrice: number | null;
    lineTotal: number | null;
  }>;
}

function ReceiptsPageContent() {
  const [receipts, setReceipts] = useState<ReceiptListItem[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/console/receipts');
      
      if (res.status === 401) {
        // User not authenticated - redirect to sign in
        window.location.href = '/signup';
        return;
      }
      
      if (res.ok) {
        const data = await res.json();
        setReceipts(data.receipts || []);
      } else {
        // Handle non-200 responses gracefully
        const errorText = await res.text().catch(() => 'Unknown error');
        console.error('Failed to fetch receipts:', res.status, res.statusText, errorText);
        if (res.status >= 500) {
          setError('Server error. Please try again later.');
        } else {
          setReceipts([]); // Show empty state for client errors
        }
      }
    } catch {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to fetch receipts:', errorMessage);
      setError('Failed to load receipts. Please try again.');
      setReceipts([]); // Show empty state on error
    } finally {
      setLoading(false);
    }
  };

  const viewReceipt = async (id: string) => {
    try {
      const res = await fetch(`/api/console/receipts/${id}`);
      
      if (res.status === 401) {
        // User not authenticated - redirect to sign in
        window.location.href = '/signup';
        return;
      }
      
      if (res.ok) {
        const data = await res.json();
        if (data.receipt) {
          setSelectedReceipt(data.receipt);
          setDetailDialogOpen(true);
        } else {
          console.error('Receipt not found in response');
        }
      } else if (res.status === 404) {
        // Receipt not found - show error or close dialog
        console.warn('Receipt not found:', id);
        setDetailDialogOpen(false);
      } else {
        console.error('Failed to fetch receipt details:', res.status, res.statusText);
      }
    } catch {
      console.error('Failed to fetch receipt details:', error);
      setDetailDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Button onClick={() => { setError(null); fetchReceipts(); }}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Receipts
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Browse and view receipts parsed by the Receipts API.
        </p>
      </div>

      {receipts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <h3 className="text-lg font-semibold mb-2">No receipts yet</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Start parsing receipts using the Receipts API.
            </p>
            <Button asChild>
              <a href="/docs/receipts">View API Docs</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recent Receipts</CardTitle>
            <CardDescription>
              {receipts.length} receipt{receipts.length !== 1 ? 's' : ''} parsed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipts.map((receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell>
                      {receipt.date
                        ? format(new Date(receipt.date), 'PP')
                        : 'Unknown'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {receipt.vendor || 'Unknown vendor'}
                    </TableCell>
                    <TableCell>
                      {receipt.total && receipt.currency
                        ? `${receipt.currency} ${receipt.total.toFixed(2)}`
                        : '—'}
                    </TableCell>
                    <TableCell>{receipt.itemCount}</TableCell>
                    <TableCell>
                      {receipt.confidenceScore
                        ? `${(receipt.confidenceScore * 100).toFixed(0)}%`
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewReceipt(receipt.id)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Receipt Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Receipt Details</DialogTitle>
            <DialogDescription>
              {selectedReceipt?.vendor || 'Unknown vendor'}
            </DialogDescription>
          </DialogHeader>
          {selectedReceipt && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Date
                  </p>
                  <p>
                    {selectedReceipt.date
                      ? format(new Date(selectedReceipt.date), 'PPp')
                      : 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Payment Method
                  </p>
                  <p>{selectedReceipt.paymentMethod || '—'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Subtotal
                  </p>
                  <p>
                    {selectedReceipt.subtotal && selectedReceipt.currency
                      ? `${selectedReceipt.currency} ${selectedReceipt.subtotal.toFixed(2)}`
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Tax
                  </p>
                  <p>
                    {selectedReceipt.tax && selectedReceipt.currency
                      ? `${selectedReceipt.currency} ${selectedReceipt.tax.toFixed(2)}`
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Total
                  </p>
                  <p className="text-lg font-semibold">
                    {selectedReceipt.total && selectedReceipt.currency
                      ? `${selectedReceipt.currency} ${selectedReceipt.total.toFixed(2)}`
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Confidence
                  </p>
                  <p>
                    {selectedReceipt.confidenceScore
                      ? `${(selectedReceipt.confidenceScore * 100).toFixed(0)}%`
                      : '—'}
                  </p>
                </div>
              </div>

              {selectedReceipt.items.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Items ({selectedReceipt.items.length})
                  </p>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedReceipt.items.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>{item.quantity || '—'}</TableCell>
                            <TableCell>
                              {item.unitPrice
                                ? `${selectedReceipt.currency || ''} ${item.unitPrice.toFixed(2)}`
                                : '—'}
                            </TableCell>
                            <TableCell>
                              {item.lineTotal
                                ? `${selectedReceipt.currency || ''} ${item.lineTotal.toFixed(2)}`
                                : '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ReceiptsPage() {
  return (
    <ConsoleErrorBoundary>
      <ReceiptsPageContent />
    </ConsoleErrorBoundary>
  );
}
