import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "System Status — Settler",
  description: "Real-time status of all Settler services.",
};

export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return children;
}
