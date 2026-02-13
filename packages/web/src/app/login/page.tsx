import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

async function loginAction(formData: FormData) {
  'use server';

  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const nextPath = String(formData.get('next') ?? '/app');

  if (!email || !password) {
    redirect('/login?error=missing_credentials');
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect('/login?error=invalid_credentials');
  }

  redirect(nextPath.startsWith('/') ? nextPath : '/app');
}

interface LoginPageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = params.next && params.next.startsWith('/') ? params.next : '/app';
  const errorMessage =
    params.error === 'invalid_credentials'
      ? 'Invalid email or password.'
      : params.error === 'missing_credentials'
        ? 'Email and password are required.'
        : null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-xl border border-border bg-card p-8">
          <h1 className="mb-2 text-3xl font-semibold text-foreground">Log in to Settler</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Access your reconciliation workspace and deterministic run history.
          </p>

          {errorMessage ? (
            <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}

          <form action={loginAction} className="space-y-4">
            <input type="hidden" name="next" value={nextPath} />
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full">
              Log In
            </Button>
          </form>

          <p className="mt-6 text-sm text-muted-foreground">
            New to Settler?{' '}
            <Link href="/signup" className="text-primary hover:underline">
              Get Started
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
