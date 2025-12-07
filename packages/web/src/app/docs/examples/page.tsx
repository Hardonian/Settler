import { redirect } from "next/navigation";

export default function DocsExamplesPage() {
  redirect("/docs?section=examples");
}
