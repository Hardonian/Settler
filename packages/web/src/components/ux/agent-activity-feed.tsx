"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Bot, Zap, CheckCircle2 } from "lucide-react";

export function AgentActivityFeed() {
  const [isOpen, setIsOpen] = useState(false);

  // Mocked live feed of AI Agent operations
  const activities = [
    {
      id: 1,
      type: "support",
      message: "Support Bot deflected a cross-border fee ticket from ACME Corp.",
      time: "Just now",
      icon: <Bot className="w-4 h-4 text-blue-400" />,
    },
    {
      id: 2,
      type: "sales",
      message: "Sales Hunter gathered 2 high-intent leads from LinkedIn.",
      time: "5m ago",
      icon: <Zap className="w-4 h-4 text-amber-400" />,
    },
    {
      id: 3,
      type: "system",
      message: "Nightly Ledger Reconciliation succeeded across all tenants.",
      time: "1h ago",
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-zinc-800 transition-colors focus:outline-none"
      >
        <Bell className="w-5 h-5 text-zinc-400 hover:text-white transition-colors" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 animate-pulse border border-zinc-950"></span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-80 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50"
          >
            <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/30 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Live Operations</h3>
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">
                AI Active
              </span>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {activities.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center shrink-0 mt-0.5">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-sm text-zinc-200 leading-snug">{item.message}</p>
                    <p className="text-xs text-zinc-500 mt-1">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-2 bg-zinc-900/50">
              <button className="w-full py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors">
                View All Activity
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
