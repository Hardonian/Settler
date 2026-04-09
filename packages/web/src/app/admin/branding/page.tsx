import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Branding - Admin",
  description: "Manage tenant branding settings",
};

import { redirect } from "next/navigation";

export default function AdminBrandingPage() {
  // Redirect to console site branding page if it exists, otherwise to admin dashboard
  redirect("/console/site/branding");
}
