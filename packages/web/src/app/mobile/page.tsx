"use client";

import SecureMobileApp from "@/components/SecureMobileApp";

export default function MobilePage() {
  // In production, this would come from authentication
  const apiKey = process.env.NEXT_PUBLIC_SETTLER_API_KEY || "";

  if (!apiKey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">
            API key not configured
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            Please set NEXT_PUBLIC_SETTLER_API_KEY environment variable
          </p>
        </div>
      </div>
    );
  }

  return <SecureMobileApp apiKey={apiKey} />;
}
