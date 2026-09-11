"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Command, ArrowRight, Bot, Zap, CreditCard, Activity } from "lucide-react";
import { useRouter } from "next/navigation";

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const commands = [
    {
      id: "search-exceptions",
      icon: <Search className="text-zinc-400" />,
      label: "Search Exceptions",
      action: () => router.push("/console/exceptions"),
    },
    {
      id: "run-reconciliation",
      icon: <Bot className="text-blue-400" />,
      label: "Start Reconciliation Run",
      action: () => router.push("/console/runs"),
    },
    {
      id: "sla-dashboard",
      icon: <Activity className="text-purple-400" />,
      label: "View SLA Dashboard",
      action: () => router.push("/console/sla"),
    },
    {
      id: "financial-close",
      icon: <Zap className="text-amber-400" />,
      label: "Financial Close Dashboard",
      action: () => router.push("/console/close"),
    },
    {
      id: "sso-scim",
      icon: <CreditCard className="text-emerald-400" />,
      label: "Enterprise Security (SSO/SCIM)",
      action: () => router.push("/console/settings/security"),
    },
  ];

  const filteredCommands = commands.filter((c) =>
    c.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <button
        type="button"
        className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 bg-muted/60 hover:bg-muted/90 border border-border/80 hover:border-border rounded-lg text-sm text-foreground/80 hover:text-foreground cursor-pointer transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => setIsOpen(true)}
        aria-label="Open command palette"
      >
        <Search className="w-4 h-4 text-primary-600 dark:text-primary-400" />
        <span className="font-medium text-foreground/90">Search commands...</span>
        <kbd className="flex items-center gap-1 ml-4 text-xs font-mono bg-background/90 border border-border px-1.5 py-0.5 rounded text-muted-foreground shadow-xs">
          <Command className="w-3 h-3" /> K
        </kbd>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="relative w-full max-w-xl bg-background dark:bg-zinc-950 border border-border rounded-xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center px-4 py-3 border-b border-border bg-muted/20">
                <Search className="w-5 h-5 text-primary-600 dark:text-primary-400 mr-3" />
                <input
                  type="text"
                  autoFocus
                  placeholder="What do you need? (e.g. exceptions, reconciliation, SLA)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm font-medium"
                />
                <kbd className="text-xs text-muted-foreground font-mono bg-muted border border-border px-2 py-1 rounded">
                  ESC
                </kbd>
              </div>

              <div className="max-h-80 overflow-y-auto p-2">
                {filteredCommands.length === 0 ? (
                  <div className="py-14 text-center text-sm text-muted-foreground">
                    No commands found.
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Available Actions
                    </div>
                    {filteredCommands.map((cmd) => (
                      <button
                        key={cmd.id}
                        onClick={() => {
                          cmd.action();
                          setIsOpen(false);
                        }}
                        className="flex items-center w-full px-3 py-3 rounded-lg hover:bg-muted/80 text-left transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-3 group-hover:bg-background border border-border/50">
                          {cmd.icon}
                        </div>
                        <span className="flex-1 text-sm font-medium text-foreground group-hover:text-primary-600 dark:group-hover:text-primary-400">
                          {cmd.label}
                        </span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="px-4 py-2 bg-muted/40 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>Navigate with keyboard</span>
                <div className="flex items-center gap-2">
                  <span className="bg-background border border-border px-1.5 py-0.5 rounded font-mono">
                    ↑
                  </span>
                  <span className="bg-background border border-border px-1.5 py-0.5 rounded font-mono">
                    ↓
                  </span>
                  <span className="bg-background border border-border px-1.5 py-0.5 rounded font-mono">
                    ↵
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
