import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, FileText, Settings, Flag, Palette, FlaskConical } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 font-bold text-xl text-slate-900 dark:text-white">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">S</div>
            Settler Admin
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link href="/admin">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <LayoutDashboard size={18} /> Dashboard
            </Button>
          </Link>
          <Link href="/admin/pages">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <FileText size={18} /> Pages
            </Button>
          </Link>
          <Link href="/admin/experiments">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <FlaskConical size={18} /> Experiments
            </Button>
          </Link>
          <Link href="/admin/branding">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Palette size={18} /> Branding
            </Button>
          </Link>
          <Link href="/admin/flags">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Flag size={18} /> Feature Flags
            </Button>
          </Link>
          <Link href="/admin/webhooks">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <FlaskConical size={18} /> Webhooks
            </Button>
          </Link>
          <Link href="/admin/settings">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Settings size={18} /> Settings
            </Button>
          </Link>
        </nav>
        
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="text-xs text-slate-500 font-medium">
            Tenant: default
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 overflow-auto">
        {children}
      </main>
    </div>
  );
}
