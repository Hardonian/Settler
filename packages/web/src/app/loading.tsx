import { Loading } from "@/components/ui/loading";

export default function LoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <Loading size="lg" text="Loading Settler..." />
    </div>
  );
}
