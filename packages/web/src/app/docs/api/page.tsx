import { redirect } from "next/navigation";

export default function DocsApiPage() {
  redirect("/docs?section=api-reference");
}
