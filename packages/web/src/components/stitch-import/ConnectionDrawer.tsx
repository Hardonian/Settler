"use client";

import React from "react";
import { CheckCircle, X, Copy, Clock, Pencil, ChevronUp, ChevronDown, Play } from "lucide-react";

const ConnectionDrawer: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm pointer-events-auto"></div>
      <div className="bg-white w-full max-w-md rounded-t-3xl shadow-2xl pointer-events-auto flex flex-col max-h-[90vh] relative animate-in slide-in-from-bottom duration-300">
        <div className="w-full flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 rounded-full bg-slate-200"></div>
        </div>
        <div className="px-6 pt-2 pb-4 border-b border-slate-100 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Stripe Payments</h2>
            <div className="flex items-center gap-2 mt-1">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-medium text-slate-600">
                Healthy • Last synced 2m ago
              </span>
            </div>
          </div>
          <button className="p-2 -mr-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="overflow-y-auto p-6 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                Credentials
              </h3>
              <button className="text-primary text-sm font-semibold hover:underline">Edit</button>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 flex items-center justify-between group">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-500">API Key</span>
                <span className="font-mono text-sm text-slate-700">sk_live_••••••••••••••••</span>
              </div>
              <button className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-primary">
                <Copy className="h-5 w-5" />
              </button>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-500">Environment</span>
                <span className="font-mono text-sm text-slate-700">Production</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Sync Schedule
            </h3>
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Daily at 00:00 UTC</p>
                <p className="text-xs text-slate-500 font-medium">Next run in 14h 32m</p>
              </div>
              <button className="ml-auto text-slate-400 hover:text-primary transition-colors">
                <Pencil className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Schema Preview
            </h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
              <div className="bg-white px-3 py-3 border-b border-slate-100 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors">
                <span className="text-sm font-semibold font-mono text-slate-700">Charges</span>
                <ChevronUp className="h-5 w-5 text-slate-400" />
              </div>
              <div className="bg-slate-50 p-3 space-y-2 border-b border-slate-100">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono font-medium text-slate-600">id</span>
                  <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-500 font-mono text-[10px]">
                    string
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono font-medium text-slate-600">amount</span>
                  <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-500 font-mono text-[10px]">
                    integer
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono font-medium text-slate-600">currency</span>
                  <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-500 font-mono text-[10px]">
                    string
                  </span>
                </div>
              </div>
              <div className="bg-white px-3 py-3 border-b border-slate-100 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors">
                <span className="text-sm font-semibold font-mono text-slate-700">Refunds</span>
                <ChevronDown className="h-5 w-5 text-slate-400" />
              </div>
              <div className="bg-white px-3 py-3 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors">
                <span className="text-sm font-semibold font-mono text-slate-700">Customers</span>
                <ChevronDown className="h-5 w-5 text-slate-400" />
              </div>
            </div>
          </div>
          <div className="h-24"></div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 rounded-b-3xl flex gap-3 z-10 pb-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button className="flex-1 py-3 px-4 rounded-lg border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors shadow-sm">
            Test Connection
          </button>
          <button className="flex-1 py-3 px-4 rounded-lg bg-primary text-white font-bold text-sm shadow-lg shadow-primary/25 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
            <Play className="h-5 w-5" />
            Run Sync Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectionDrawer;
