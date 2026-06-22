import { ReactNode } from "react";
import { ShieldCheck, LogOut, FileSearch } from "lucide-react";
import Link from "next/link";

export default function AuditorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-muted/20">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg tracking-tight">Settler Auditor Portal</span>
            <Badge variant="outline" className="ml-2 border-primary/30 text-primary">
              Read-Only
            </Badge>
          </div>
          <nav className="flex items-center gap-6">
            <Link
              href="/auditor"
              className="text-sm font-medium flex items-center gap-2 hover:text-primary"
            >
              <FileSearch className="w-4 h-4" /> Samples & Evidence
            </Link>
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Exit Portal
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-6 py-8">{children}</main>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
