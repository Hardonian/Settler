'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@settler/react-settler/ui/card';

// Note: Recharts or Tremor would be injected here in a full build.
// For the structural scaffolding, we'll build a beautiful CSS representation
// of a live "Pulse" chart to fulfill the structural requirement cleanly without new deps.

export default function PulseDashboard() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">Pulse</h1>
          <p className="text-gray-500 mt-2">Real-time health of your financial operations.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-sm font-medium border border-green-200 dark:border-green-800">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          System Healthy
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border-gray-200 dark:border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Reconciliation Lag</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">1.2s</div>
            <p className="text-xs text-green-600 mt-1">↓ 0.4s from last week</p>
          </CardContent>
        </Card>

        <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border-gray-200 dark:border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Auto-Match Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">99.8%</div>
            <p className="text-xs text-gray-500 mt-1">Powered by AutoMapper Engine</p>
          </CardContent>
        </Card>

        <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border-gray-200 dark:border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">Unmatched Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">$0.00</div>
            <p className="text-xs text-green-600 mt-1">Inbox Zero Achieved</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart Area (Structural CSS mock for high-fidelity feel) */}
      <Card className="overflow-hidden border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <CardHeader>
          <CardTitle>Cash Flow Velocity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full flex items-end justify-between gap-2 px-2 pb-4 border-b border-gray-100 dark:border-gray-800 relative">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>

            {/* Bars */}
            {[40, 60, 45, 80, 55, 90, 70, 100, 85, 95].map((height, i) => (
              <div key={i} className="w-full relative group">
                <div 
                  className="w-full bg-indigo-500/80 dark:bg-indigo-600/80 rounded-t-sm transition-all duration-500 group-hover:bg-indigo-400 cursor-pointer"
                  style={{ height: `${height}%` }}
                >
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    ${(height * 1234).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-xs font-mono text-gray-400">
            <span>May 1</span>
            <span>May 15</span>
            <span>May 31</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
