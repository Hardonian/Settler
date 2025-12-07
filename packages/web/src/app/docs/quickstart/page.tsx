import { redirect } from "next/navigation";

export default function DocsQuickstartPage() {
  redirect("/docs?section=getting-started");
}
