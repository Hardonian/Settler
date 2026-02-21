"use client";

import React from "react";

const QueueTable: React.FC = () => {
  const queueData = [
    { id: "TX-9041", date: "2024-02-18", vendor: "Amazon.com", amount: "$452.12", status: "Pending", source: "Visa-9041" },
    { id: "TX-9042", date: "2024-02-17", vendor: "Stripe", amount: "$1,200.00", status: "Scanning", source: "Sync-API" },
    { id: "TX-9043", date: "2024-02-17", vendor: "Google Cloud", amount: "$89.50", status: "Review", source: "Mastercard-1102" },
    { id: "TX-9044", date: "2024-02-16", vendor: "Uber", amount: "$24.40", status: "Pending", source: "Visa-9041" },
  ];

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden animate-slide-up">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Unprocessed Queue</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search queue..."
            className="px-3 py-1.5 bg-neutral-10 border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 text-foreground"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-10/50">
              <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">Transaction ID</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">Vendor</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">Amount</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {queueData.map((row) => (
              <tr key={row.id} className="hover:bg-neutral-10 transition-colors group">
                <td className="px-6 py-4 text-sm font-mono text-muted">{row.id}</td>
                <td className="px-6 py-4 text-sm text-foreground">{row.date}</td>
                <td className="px-6 py-4 text-sm font-medium text-foreground">{row.vendor}</td>
                <td className="px-6 py-4 text-sm font-mono text-foreground">{row.amount}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                    ${row.status === 'Scanning' ? 'bg-blue-400/10 text-blue-400 border border-blue-400/20' :
                      row.status === 'Review' ? 'bg-warning/10 text-warning border border-warning/20' :
                      'bg-neutral-30 text-muted border border-border'}`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <button className="text-teal-500 hover:text-teal-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Process
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 bg-neutral-10/30 border-t border-border flex items-center justify-between text-xs text-muted">
        <span>Showing 4 of 216 items</span>
        <div className="flex gap-2">
          <button className="px-2 py-1 border border-border rounded-md hover:bg-neutral-20">Prev</button>
          <button className="px-2 py-1 border border-border rounded-md hover:bg-neutral-20 font-medium text-foreground">Next</button>
        </div>
      </div>
    </div>
  );
};

export default QueueTable;
