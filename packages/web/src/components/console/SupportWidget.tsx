/**
 * Support Widget
 * 
 * In-app support ticket creation widget.
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react';
import { ConsoleErrorBoundary } from './ErrorBoundary';
import { BrandMessages } from '@/lib/brand/messaging';

export function SupportWidget() {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('technical');
  const [priority, setPriority] = useState<string>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!subject.trim()) {
      alert('Please enter a subject');
      return;
    }

    if (!description.trim()) {
      alert('Please enter a description');
      return;
    }

    if (subject.length > 200) {
      alert('Subject must be 200 characters or less');
      return;
    }

    if (description.length > 5000) {
      alert('Description must be 5000 characters or less');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/console/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          description: description.trim(),
          category,
          priority,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        setSubject('');
        setDescription('');
        setCategory('technical');
        setPriority('medium');
      } else {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.error || BrandMessages.errors.generic;
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Failed to create ticket:', error);
      alert(BrandMessages.errors.network);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Ticket Created</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Your support ticket has been created. We'll get back to you soon.
          </p>
          <Button onClick={() => setSubmitted(false)} variant="outline">
            Create Another Ticket
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <ConsoleErrorBoundary>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Contact Support
          </CardTitle>
          <CardDescription>
            Create a support ticket and we'll help you resolve your issue.
          </CardDescription>
        </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description of your issue"
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technical">Technical Issue</SelectItem>
                <SelectItem value="billing">Billing Question</SelectItem>
                <SelectItem value="feature_request">Feature Request</SelectItem>
                <SelectItem value="bug">Bug Report</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide as much detail as possible..."
              rows={6}
              required
            />
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Creating Ticket...' : 'Create Support Ticket'}
          </Button>
        </form>
      </CardContent>
    </Card>
    </ConsoleErrorBoundary>
  );
}
