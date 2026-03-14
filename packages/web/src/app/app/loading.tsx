import { Loading } from "@/components/ui/loading";

export default function AppLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loading size="lg" text="Loading..." />
    </div>
  );
}
