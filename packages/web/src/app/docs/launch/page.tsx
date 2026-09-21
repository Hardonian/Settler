import { permanentRedirect } from "next/navigation";

export default function LaunchStatusPage() {
  permanentRedirect("/docs/status");
}
