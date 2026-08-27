import { ReactNode } from "react";
import { Handshake, LogOut } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function VendorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-muted/10">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
              <Handshake className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">Vendor Connect</span>
            <Badge variant="outline" className="ml-2">
              External Portal
            </Badge>
          </div>
          <nav className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
