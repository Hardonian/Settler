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
      <div
        className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-lg text-sm text-zinc-400 cursor-pointer hover:bg-zinc-800 transition-colors"
        onClick={() => setIsOpen(true)}
      >
        <Search className="w-4 h-4" />
        <span>Search commands...</span>
        <div className="flex items-center gap-1 ml-4 text-xs font-mono bg-zinc-800 px-1.5 py-0.5 rounded">
          <Command className="w-3 h-3" /> K
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center px-4 py-3 border-b border-zinc-800">
                <Search className="w-5 h-5 text-zinc-400 mr-3" />
                <input
                  type="text"
                  autoFocus
                  placeholder="What do you need?"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-zinc-100 placeholder:text-zinc-600"
                />
                <div className="text-xs text-zinc-500 font-mono bg-zinc-900 px-2 py-1 rounded">
                  ESC
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto p-2">
                {filteredCommands.length === 0 ? (
                  <div className="py-14 text-center text-sm text-zinc-500">No commands found.</div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      Available Actions
                    </div>
                    {filteredCommands.map((cmd) => (
                      <button
                        key={cmd.id}
                        onClick={() => {
                          cmd.action();
                          setIsOpen(false);
                        }}
                        className="flex items-center w-full px-3 py-3 rounded-lg hover:bg-zinc-900 text-left transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center mr-3 group-hover:bg-zinc-950">
                          {cmd.icon}
                        </div>
                        <span className="flex-1 text-sm font-medium text-zinc-200 group-hover:text-white">
                          {cmd.label}
                        </span>
                        <ArrowRight className="w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="px-4 py-2 bg-zinc-900/50 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                <span>Navigate with keyboard</span>
                <div className="flex items-center gap-2">
                  <span className="bg-zinc-800 px-1.5 py-0.5 rounded">↑</span>
                  <span className="bg-zinc-800 px-1.5 py-0.5 rounded">↓</span>
                  <span className="bg-zinc-800 px-1.5 py-0.5 rounded">↵</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
