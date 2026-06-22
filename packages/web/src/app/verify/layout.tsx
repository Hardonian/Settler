import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Proofpack | Settler",
  description:
    "Upload and verify a Settler proofpack in your browser. Cryptographic verification happens client-side — no data leaves your machine.",
};

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
