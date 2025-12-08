'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    
    // Simulate API call
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        setStatus('success');
        setEmail('');
        setTimeout(() => setStatus('idle'), 3000);
        resolve();
      }, 1000);
    });
  };

  return (
    <Card 
      className={cn(
        'bg-gradient-to-r from-primary-600 to-electric-indigo border-0',
        'shadow-xl'
      )}
      elevation="lg"
    >
      <CardHeader className="text-center">
        <CardTitle className="text-2xl md:text-3xl text-white mb-2">
          Stay Updated
        </CardTitle>
        <CardDescription className="text-primary-100">
          Get product updates, API changes, and reconciliation tips delivered to your inbox
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="flex-1 bg-white text-foreground"
            disabled={status === 'loading' || status === 'success'}
          />
          <Button
            type="submit"
            disabled={status === 'loading' || status === 'success'}
            variant="secondary"
            className="bg-white text-primary-600 hover:bg-primary-50 whitespace-nowrap"
          >
            {status === 'loading' ? 'Subscribing...' : status === 'success' ? '✓ Subscribed!' : 'Subscribe'}
          </Button>
        </form>
        <p className="text-xs text-primary-100 text-center mt-4">
          No spam. Unsubscribe anytime. We respect your privacy.
        </p>
      </CardContent>
    </Card>
  );
}
