import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="container mx-auto p-8">
      <Alert>
        <Terminal className="h-4 w-4" />
        <AlertTitle>Coming Soon!</AlertTitle>
        <AlertDescription>
          This page is under construction. Please check back later.
        </AlertDescription>
      </Alert>
    </div>
  );
}
