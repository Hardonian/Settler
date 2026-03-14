import { Loading } from "@/components/ui/loading";

export default function LoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loading size="lg" text="Loading Settler..." />
    </div>
  );
}
