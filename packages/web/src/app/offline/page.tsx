import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { WifiOff } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Offline',
  description: 'You are currently offline.',
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <Navigation />
      
      <main className="flex-grow flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-20">
        <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-8">
          <WifiOff className="w-12 h-12 text-slate-500 dark:text-slate-400" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">You're Offline</h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 mb-12 max-w-2xl">
          It looks like you've lost your internet connection. 
          Some features may be unavailable until you reconnect.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={() => window.location.reload()} size="lg" className="bg-blue-600 hover:bg-blue-700">
            Try Again
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
