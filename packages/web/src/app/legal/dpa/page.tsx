import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { AnimatedPageWrapper } from "@/components/AnimatedPageWrapper";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Processing Agreement",
  description: "Settler Data Processing Agreement (DPA) - Terms for processing personal data.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function DPAPage() {
  return (
    <AnimatedPageWrapper aria-label="Data Processing Agreement page">
      <Navigation />

      {/* Breadcrumbs */}
      <section className="px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <Breadcrumbs items={[{ label: "Legal", href: "/legal" }, { label: "DPA" }]} />
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-8 text-slate-900 dark:text-white">
          Data Processing Agreement
        </h1>
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            <strong>Last Updated:</strong> January 1, 2024
          </p>

          <p>
            This Data Processing Agreement ("DPA") forms part of the Terms of Service between
            Settler Inc. ("Settler") and the Customer. This DPA applies to the processing of
            Personal Data by Settler on behalf of the Customer.
          </p>

          <h3>1. Definitions</h3>
          <p>
            <strong>"Controller"</strong> means the entity which determines the purposes and means
            of the processing of Personal Data.
            <br />
            <strong>"Processor"</strong> means the entity which processes Personal Data on behalf of
            the Controller.
            <br />
            <strong>"Personal Data"</strong> means any information relating to an identified or
            identifiable natural person.
          </p>

          <h3>2. Processing of Personal Data</h3>
          <p>
            Settler shall process Personal Data only on documented instructions from the Customer,
            including with regard to transfers of Personal Data to a third country or an
            international organization, unless required to do so by applicable law.
          </p>

          <h3>3. Confidentiality</h3>
          <p>
            Settler ensures that persons authorized to process the Personal Data have committed
            themselves to confidentiality or are under an appropriate statutory obligation of
            confidentiality.
          </p>

          <h3>4. Security of Processing</h3>
          <p>
            Settler takes all measures required pursuant to Article 32 of the GDPR (Security of
            processing), including encryption of personal data, the ability to ensure the ongoing
            confidentiality, integrity, availability and resilience of processing systems and
            services.
          </p>

          <h3>5. Sub-processors</h3>
          <p>
            Customer grants Settler a general authorization to engage sub-processors. A current list
            of sub-processors is available at{" "}
            <a
              href="/legal/subprocessors"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              settler.dev/legal/subprocessors
            </a>
            . Settler shall inform the Customer of any intended changes concerning the addition or
            replacement of other sub-processors.
          </p>

          <h3>6. International Data Transfers</h3>
          <p>
            For transfers of Personal Data from the European Economic Area, the United Kingdom, or
            Switzerland to countries that do not ensure an adequate level of data protection within
            the meaning of applicable Data Protection Laws, Settler relies on:
          </p>
          <ul>
            <li>Standard Contractual Clauses (SCCs) approved by the European Commission.</li>
            <li>The EU-U.S. Data Privacy Framework (where applicable).</li>
          </ul>

          <h3>7. Data Subject Rights</h3>
          <p>
            Settler shall, taking into account the nature of the processing, assist the Customer by
            appropriate technical and organizational measures, insofar as this is possible, for the
            fulfilment of the Customer's obligation to respond to requests for exercising the data
            subject's rights.
          </p>

          <h3>8. Deletion or Return of Personal Data</h3>
          <p>
            At the choice of the Customer, Settler shall delete or return all the Personal Data to
            the Customer after the end of the provision of services relating to processing, and
            delete existing copies unless applicable law requires storage of the Personal Data.
          </p>

          <div className="mt-12 p-6 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <h4 className="text-lg font-semibold mb-2">Download Signed DPA</h4>
            <p className="mb-4 text-sm">
              Enterprise customers can request a countersigned copy of this DPA by contacting our
              legal team.
            </p>
            <a
              href="mailto:legal@settler.dev"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Contact Legal Team &rarr;
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </AnimatedPageWrapper>
  );
}
