"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Link2, ExternalLink } from "lucide-react";

export function AppMarketplace() {
  const apps = [
    {
      id: "stripe",
      name: "Stripe",
      description: "Real-time payout reconciliation and fee mapping.",
      status: "connected",
      icon: "💳",
    },
    {
      id: "quickbooks",
      name: "QuickBooks",
      description: "Sync matched ledger events directly to QBO.",
      status: "available",
      icon: "📗",
    },
    {
      id: "slack",
      name: "Slack",
      description: "Get pinged when the Sales Hunter finds a lead.",
      status: "connected",
      icon: "💬",
    },
    {
      id: "xero",
      name: "Xero",
      description: "Advanced cross-border GL sync.",
      status: "coming_soon",
      icon: "📊",
    },
    {
      id: "salesforce",
      name: "Salesforce",
      description: "Push high-intent leads to your enterprise CRM.",
      status: "coming_soon",
      icon: "☁️",
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Integration App Store</h2>
        <p className="text-zinc-400">
          Connect Settler to your existing ecosystem to unlock autonomous operations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {apps.map((app, i) => (
          <motion.div
            key={app.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group relative p-6 bg-zinc-900 border border-zinc-800 rounded-2xl hover:bg-zinc-800/80 hover:border-zinc-700 transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-2xl shadow-inner">
                {app.icon}
              </div>

              {app.status === "connected" && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                </span>
              )}
              {app.status === "coming_soon" && (
                <span className="text-xs font-medium text-zinc-500 bg-zinc-950 px-2.5 py-1 rounded-full border border-zinc-800">
                  Coming Soon
                </span>
              )}
              {app.status === "available" && (
                <span className="flex items-center gap-1 text-xs font-medium text-blue-400 bg-blue-400/10 px-2.5 py-1 rounded-full border border-blue-400/20 hover:bg-blue-400/20 transition-colors">
                  <Link2 className="w-3.5 h-3.5" /> Connect
                </span>
              )}
            </div>

            <h3 className="text-lg font-semibold text-zinc-100 mb-2 group-hover:text-white transition-colors">
              {app.name}
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed mb-4">{app.description}</p>

            <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
              <ExternalLink className="w-4 h-4 text-zinc-500" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
