"use client";

import React from "react";
import { X } from "lucide-react";

const ReasonForChangeModal: React.FC = () => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      id="reasonModal"
    >
      <div
        className="w-full sm:max-w-md bg-surface-dark rounded-t-2xl sm:rounded-xl border border-border-dark shadow-2xl"
        id="modalContent"
      >
        {/* Handle bar for mobile feel */}
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-12 h-1.5 rounded-full bg-slate-600"></div>
        </div>
        <div className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">Manual Override</h3>
            <button className="text-muted-foreground/60 hover:text-white">
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="mb-5">
            <p className="text-sm text-muted-foreground/60 mb-3">
              Please explain why you are manually overriding this match. This will be logged for
              audit purposes.
            </p>
            <label className="block text-xs font-semibold text-muted-foreground/40 mb-1 uppercase tracking-wide">
              Reason for Change <span className="text-accent-danger">*</span>
            </label>
            <textarea
              className="w-full bg-background-dark border border-border-dark rounded-lg p-3 text-muted-foreground/30 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none placeholder-slate-600"
              placeholder="e.g., Bank statement confirms the extra zero was a clerical error in the ERP system..."
              rows={4}
            ></textarea>
          </div>
          <div className="flex gap-3">
            <button className="flex-1 py-3 px-4 rounded-lg border border-border-dark text-muted-foreground/40 font-medium hover:bg-white/5 transition-colors">
              Cancel
            </button>
            <button className="flex-1 py-3 px-4 rounded-lg bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors">
              Confirm Override
            </button>
          </div>
        </div>
        {/* Bottom safe area padding */}
        <div className="h-6 w-full sm:hidden"></div>
      </div>
    </div>
  );
};

export default ReasonForChangeModal;
