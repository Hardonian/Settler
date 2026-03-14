import { Loading } from "@/components/ui/loading";

export default function DocsLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loading size="lg" text="Loading documentation..." />
    </div>
  );
}
