import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { AnimatedPageWrapper } from "@/components/AnimatedPageWrapper";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subprocessors",
  description: "List of third-party subprocessors used by Settler to provide our services.",
};

export const revalidate = 3600;

export default function SubprocessorsPage() {
  const subprocessors = [
    {
      name: "Amazon Web Services (AWS)",
      purpose: "Cloud Infrastructure & Hosting",
      location: "United States",
    },
    {
      name: "Vercel",
      purpose: "Frontend Hosting & Edge Functions",
      location: "United States",
    },
    {
      name: "Supabase",
      purpose: "Database Hosting & Authentication",
      location: "United States / EU",
    },
    {
      name: "Stripe",
      purpose: "Payment Processing",
      location: "United States",
    },
    {
      name: "Resend",
      purpose: "Transactional Emails",
      location: "United States",
    },
    {
      name: "Upstash",
      purpose: "Redis & Kafka (Serverless)",
      location: "United States / EU",
    },
    {
      name: "OpenAI",
      purpose: "LLM Processing (Receipts/AI Features)",
      location: "United States",
    },
  ];

  return (
    <AnimatedPageWrapper aria-label="Subprocessors page">
      <Navigation />

      <section className="px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <Breadcrumbs items={[{ label: "Legal", href: "/legal" }, { label: "Subprocessors" }]} />
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-8 text-slate-900 dark:text-white">Subprocessors</h1>

        <div className="prose prose-slate dark:prose-invert max-w-none mb-12">
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Settler engages the following third-party entities to assist in connection with the
            provision of our services. Prior to engaging any third-party subprocessor, we perform
            diligence to evaluate their privacy, security, and confidentiality practices.
          </p>
          <p className="text-sm text-slate-500">Last Updated: January 1, 2024</p>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subprocessors.map((processor) => (
                <TableRow key={processor.name}>
                  <TableCell className="font-medium">{processor.name}</TableCell>
                  <TableCell>{processor.purpose}</TableCell>
                  <TableCell>{processor.location}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-blue-900 dark:text-blue-100">
            Updates to this list
          </h3>
          <p className="text-blue-800 dark:text-blue-200 text-sm">
            As our business grows and evolves, the subprocessors we engage may also change. We will
            provide the owner of the Customer's account with notice of any new subprocessors to the
            extent required under the Agreement, along with posting such updates here. You can
            subscribe to updates by contacting privacy@settler.dev.
          </p>
        </div>
      </div>
      <Footer />
    </AnimatedPageWrapper>
  );
}
