import { redirect } from "next/navigation";

export default function DocsSdkPage() {
  redirect("/docs?section=installation");
}
