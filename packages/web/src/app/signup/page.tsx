/**
 * User Sign-up Page
 * 
 * Handles user registration and account creation.
 */

import { signUpUser } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { UserPlus, AlertCircle } from 'lucide-react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function SignUpForm() {
  async function handleSubmit(formData: FormData) {
    'use server';
    
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;
    const acceptTerms = formData.get('acceptTerms') === 'on';

    if (!email || !password) {
      return;
    }

    const result = await signUpUser(email, password, name, acceptTerms);
    
    if (result.success) {
      // Redirect to console with welcome flag
      redirect('/console?welcome=true');
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

      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id="accept-terms"
          name="acceptTerms"
          required
          className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
        />
        <Label htmlFor="accept-terms" className="text-sm text-slate-600 dark:text-slate-400">
          I agree to the{' '}
          <Link href="/legal/terms" className="text-blue-600 dark:text-electric-cyan hover:underline" target="_blank">
            Terms of Service
          </Link>
          {' '}and{' '}
          <Link href="/legal/privacy" className="text-blue-600 dark:text-electric-cyan hover:underline" target="_blank">
            Privacy Policy
          </Link>
          *
        </Label>
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

interface SignUpPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  const error = params.error;

  const errorMessages: Record<string, { title: string; description: string }> = {
    auth_required: {
      title: 'Authentication Required',
      description: 'Please sign up or sign in to access the console.',
    },
  };

  const errorInfo = error ? errorMessages[error] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black">
      <Navigation />
      
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 border border-slate-200 dark:border-slate-700">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Start Your Free Trial
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Create your account and get instant access. Start with 1,000 free reconciliations/month—perfect for testing and small projects.
            </p>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-5 text-left mt-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">Get started in minutes:</p>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 mt-0.5">✓</span>
                      <span>Generate your API key instantly</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 mt-0.5">✓</span>
                      <span>Explore our interactive playground—no coding required</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 mt-0.5">✓</span>
                      <span>Connect your first integration (Stripe, Shopify, QuickBooks, and more)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {errorInfo && (
            <Alert className="mb-6 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertTitle className="text-yellow-900 dark:text-yellow-300">
                {errorInfo.title}
              </AlertTitle>
              <AlertDescription className="text-yellow-800 dark:text-yellow-400">
                {errorInfo.description}
              </AlertDescription>
            </Alert>
          )}

          <SignUpForm />

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Already have an account?{' '}
              <Link
                href="/dashboard"
                className="text-blue-600 dark:text-electric-cyan hover:underline font-medium"
              >
                Sign in to Dashboard
              </Link>
            </p>
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}
