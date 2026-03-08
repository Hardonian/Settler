"use client";

import { Menu, Bell, Building, ChevronDown } from "lucide-react";
import PipelineTable from "@/components/stitch-import/PipelineTable";
import PipelineDrawer from "@/components/stitch-import/PipelineDrawer";

export default function PipelinesPage() {
  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 antialiased overflow-x-hidden">
      <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden">
        {/* Header & Workspace Selector */}
        <header className="sticky top-0 z-20 flex flex-col bg-background-light dark:bg-background-dark border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="text-lg font-bold tracking-tight">Pipelines</h1>
            </div>
            <div className="flex items-center gap-2">
              <button className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors">
                <Bell className="h-6 w-6" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#101922]"></span>
              </button>
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center text-white text-xs font-bold">
                JD
              </div>
            </div>
          </div>
          {/* Workspace Selector */}
          <div className="px-4 pb-3">
            <button className="flex w-full items-center justify-between rounded-xl bg-white dark:bg-[#192633] border border-slate-200 dark:border-slate-700 p-3 shadow-sm active:scale-[0.99] transition-transform">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building className="h-6 w-6" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Workspace
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    Production - US East
                  </span>
                </div>
              </div>
              <ChevronDown className="h-6 w-6 text-slate-400" />
            </button>
          </div>
          {/* Quick Stats */}
          <div className="flex gap-4 px-4 pb-4 overflow-x-auto no-scrollbar">
            <div className="flex flex-col gap-1 min-w-[100px]">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active</span>
              <span className="text-xl font-bold text-slate-900 dark:text-white">12</span>
            </div>
            <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 self-center"></div>
            <div className="flex flex-col gap-1 min-w-[100px]">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Error Rate
              </span>
              <span className="text-xl font-bold text-red-500">0.4%</span>
            </div>
            <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 self-center"></div>
            <div className="flex flex-col gap-1 min-w-[100px]">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Throughput
              </span>
              <span className="text-xl font-bold text-slate-900 dark:text-white">45k/s</span>
            </div>
          </div>
        </header>
        <PipelineTable />
        <PipelineDrawer />
      </div>
    </div>
  );
}
