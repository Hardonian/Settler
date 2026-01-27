/**
 * Admin Layout
 *
 * CRITICAL: All admin routes require super admin authentication.
 * Unauthenticated users are redirected to sign-in.
 * Non-admin users are shown access denied.
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  Settings,
  Flag,
  Palette,
  FlaskConical,
  BarChart3,
  Activity,
  AlertTriangle,
  PlayCircle,
  FileSearch,
} from "lucide-react";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { redirect } from "next/navigation";
import { AdminErrorBoundary } from "@/components/admin/error-boundary";
import { MobileMenu } from "@/components/admin/mobile-menu";
import { SkipLinks } from "@/components/admin/accessibility-skip-links";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // CRITICAL: Server-side super admin gate with error handling
  try {
    const isAdmin = await isSuperAdmin();

    if (!isAdmin) {
      // Redirect to sign-in if not authenticated, or show access denied
      redirect("/signup?next=" + encodeURIComponent("/admin"));
    }
  } catch {
    // Log error but don't expose internal details
    // Error handling is done in isSuperAdmin function
    // Redirect to sign-in on error - fail secure
    redirect("/signup?next=" + encodeURIComponent("/admin"));
  }

  return (
    <AdminErrorBoundary>
      <SkipLinks />
      <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
        {/* Mobile Menu */}
        <MobileMenu>
          {/* Mobile navigation content - same as desktop sidebar */}
          <nav className="space-y-1" aria-label="Admin navigation">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-2">
              Operations
            </div>
            <Link href="/admin" onClick={() => {}}>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <LayoutDashboard size={18} /> Dashboard
              </Button>
            </Link>
            <Link href="/admin/ops">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Activity size={18} /> Ops Console
              </Button>
            </Link>
            <Link href="/admin/exceptions">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <AlertTriangle size={18} /> Exceptions
              </Button>
            </Link>
            <Link href="/admin/runs">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <PlayCircle size={18} /> Runs
              </Button>
            </Link>
            <Link href="/admin/audit">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <FileSearch size={18} /> Audit Trail
              </Button>
            </Link>
          </nav>
        </MobileMenu>

        {/* Sidebar - Desktop Only */}
        <aside className="hidden lg:flex w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex-col fixed h-full z-10">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 font-bold text-xl text-slate-900 dark:text-white">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                S
              </div>
              Settler Admin
            </div>
          </div>

          <nav
            id="admin-navigation"
            className="flex-1 p-4 space-y-1 overflow-y-auto"
            aria-label="Admin navigation"
          >
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-2">
              Operations
            </div>
            <Link href="/admin">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                aria-label="Dashboard overview"
              >
                <LayoutDashboard size={18} aria-hidden="true" /> Dashboard
              </Button>
            </Link>
            <Link href="/admin/ops">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                aria-label="Operations console"
              >
                <Activity size={18} aria-hidden="true" /> Ops Console
              </Button>
            </Link>
            <Link href="/admin/exceptions">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                aria-label="Exception queue"
              >
                <AlertTriangle size={18} aria-hidden="true" /> Exceptions
              </Button>
            </Link>
            <Link href="/admin/runs">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                aria-label="Reconciliation runs"
              >
                <PlayCircle size={18} aria-hidden="true" /> Runs
              </Button>
            </Link>
            <Link href="/admin/audit">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                aria-label="Audit trail"
              >
                <FileSearch size={18} aria-hidden="true" /> Audit Trail
              </Button>
            </Link>

            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-2">
                Configuration
              </div>
              <Link href="/admin/pages">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  aria-label="Pages management"
                >
                  <FileText size={18} aria-hidden="true" /> Pages
                </Button>
              </Link>
              <Link href="/admin/experiments">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  aria-label="Experiments"
                >
                  <FlaskConical size={18} aria-hidden="true" /> Experiments
                </Button>
              </Link>
              <Link href="/admin/branding">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  aria-label="Branding"
                >
                  <Palette size={18} aria-hidden="true" /> Branding
                </Button>
              </Link>
              <Link href="/admin/flags">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  aria-label="Feature flags"
                >
                  <Flag size={18} aria-hidden="true" /> Feature Flags
                </Button>
              </Link>
              <Link href="/admin/webhooks">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  aria-label="Webhooks"
                >
                  <FlaskConical size={18} aria-hidden="true" /> Webhooks
                </Button>
              </Link>
              <Link href="/admin/monitoring">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  aria-label="Monitoring"
                >
                  <Activity size={18} aria-hidden="true" /> Monitoring
                </Button>
              </Link>
              <Link href="/admin/analytics">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  aria-label="Analytics"
                >
                  <BarChart3 size={18} aria-hidden="true" /> Analytics
                </Button>
              </Link>
              <Link href="/admin/settings">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  aria-label="Settings"
                >
                  <Settings size={18} aria-hidden="true" /> Settings
                </Button>
              </Link>
            </div>
          </nav>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
            <div className="text-xs text-slate-500 font-medium">Tenant: default</div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 overflow-auto" role="main">
          {children}
        </main>
      </div>
    </AdminErrorBoundary>
  );
}
