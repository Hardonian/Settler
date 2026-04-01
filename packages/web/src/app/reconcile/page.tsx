import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function ReconcilePage() {
  redirect("/console/exceptions");
}
