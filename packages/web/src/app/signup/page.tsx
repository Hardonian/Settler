/**
 * User Sign-up Page
 * 
 * Data Flow Diagram:
 * User Sign-up (Vercel Form) → Next.js Server Action → Supabase profiles table (RLS Check)
 * → Profile Page Reload (Server Component Fetch)
 */

import { signUpUser } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { UserPlus } from 'lucide-react';
import { redirect } from 'next/navigation';
import Link from 'next/link';

function SignUpForm() {
  async function handleSubmit(formData: FormData) {
    'use server';
    
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;

    if (!email || !password) {
      return;
    }

    const result = await signUpUser(email, password, name);
    
    if (result.success) {
      redirect('/dashboard');
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="name" className="mb-2 block">
          Name (Optional)
        </Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="Your name"
          className="w-full"
        />
      </div>

      <div>
        <Label htmlFor="email" className="mb-2 block">
          Email *
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          className="w-full"
        />
      </div>

      <div>
        <Label htmlFor="password" className="mb-2 block">
          Password *
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          minLength={8}
          className="w-full"
        />
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Must be at least 8 characters
        </p>
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-electric-cyan dark:to-electric-blue dark:hover:from-electric-cyan/90 dark:hover:to-electric-blue/90"
      >
        <UserPlus className="w-4 h-4 mr-2" />
        Create Account
      </Button>
    </form>
  );
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black">
      <Navigation />
      
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 border border-slate-200 dark:border-slate-700">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Join the Community
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Create your account to participate in the ecosystem
            </p>
          </div>

          <SignUpForm />

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Already have an account?{' '}
              <Link
                href="/dashboard"
                className="text-blue-600 dark:text-electric-cyan hover:underline"
              >
                Go to Dashboard
              </Link>
            </p>
          </div>
        </div>

        {/* Data Flow Info */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
            Data Flow
          </h3>
          <p className="text-xs text-blue-800 dark:text-blue-400">
            Form → Server Action → Supabase (RLS Check) → Profile Created → Activity Logged
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
