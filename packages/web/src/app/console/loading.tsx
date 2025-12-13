/**
 * Console Loading State
 * 
 * Shows loading UI while console data is being fetched.
 */

export default function ConsoleLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-electric-cyan mx-auto mb-4"></div>
        <p className="text-slate-600 dark:text-slate-400">Loading console...</p>
      </div>
    </div>
  );
}
