import { Metadata } from "next";
import { generateMetadata } from "@/lib/metadata";

export const metadata: Metadata = generateMetadata({
  title: "Start Your Free Trial - No Credit Card Required",
  description:
    "Create your Settler account and start automating reconciliation in minutes. 30-day free trial with full access to all features. No credit card required.",
  keywords: [
    "free trial",
    "sign up",
    "create account",
    "reconciliation free trial",
    "start reconciliation",
  ],
  canonical: "https://settler.dev/signup",
});

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
