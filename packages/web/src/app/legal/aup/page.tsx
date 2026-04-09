import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { AnimatedPageWrapper } from "@/components/AnimatedPageWrapper";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acceptable Use Policy",
  description: "Settler Acceptable Use Policy - Guidelines for using our services responsibly.",
  robots: {
    index: true,
    follow: true,
  },
};

export const revalidate = 3600;

export default function AcceptableUsePolicyPage() {
  return (
    <AnimatedPageWrapper aria-label="Acceptable Use Policy page">
      <Navigation />

      <section className="px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <Breadcrumbs
            items={[{ label: "Legal", href: "/legal" }, { label: "Acceptable Use Policy" }]}
          />
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-8 text-slate-900 dark:text-white">
          Acceptable Use Policy
        </h1>
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            <strong>Last Updated:</strong> January 1, 2024
          </p>

          <h3>1. Introduction</h3>
          <p>
            This Acceptable Use Policy ("AUP") governs your use of Settler's services ("Services").
            By using our Services, you agree to comply with this AUP. Violations may result in
            suspension or termination of your account.
          </p>

          <h3>2. Prohibited Activities</h3>

          <h4>2.1 Illegal Activities</h4>
          <p>You may not use our Services to:</p>
          <ul>
            <li>Violate any applicable laws, regulations, or court orders</li>
            <li>Engage in fraud, money laundering, or financial crimes</li>
            <li>Infringe on intellectual property rights</li>
            <li>Violate privacy or data protection laws</li>
          </ul>

          <h4>2.2 Security Violations</h4>
          <p>You may not:</p>
          <ul>
            <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
            <li>Probe, scan, or test vulnerabilities of our infrastructure</li>
            <li>Interfere with or disrupt our Services or servers</li>
            <li>Introduce viruses, malware, or malicious code</li>
            <li>Use automated tools to abuse our API (scraping, crawling, etc.)</li>
          </ul>

          <h4>2.3 Abuse of Services</h4>
          <p>You may not:</p>
          <ul>
            <li>Exceed rate limits or attempt to circumvent usage restrictions</li>
            <li>Use our Services to compete with Settler</li>
            <li>Resell or redistribute our Services without authorization</li>
            <li>Reverse engineer, decompile, or disassemble proprietary components</li>
            <li>Use our Services to build competing products</li>
          </ul>

          <h4>2.4 Content Restrictions</h4>
          <p>You may not use our Services to process or store:</p>
          <ul>
            <li>Illegal or harmful content</li>
            <li>Content that violates third-party rights</li>
            <li>Malicious or deceptive content</li>
            <li>Content that promotes violence, hate, or discrimination</li>
          </ul>

          <h3>3. API Usage Guidelines</h3>
          <p>When using our API, you must:</p>
          <ul>
            <li>Respect rate limits and quotas</li>
            <li>Use appropriate authentication methods</li>
            <li>Handle errors gracefully</li>
            <li>Not attempt to bypass security measures</li>
            <li>Follow our API documentation and best practices</li>
          </ul>

          <h3>4. Data Protection</h3>
          <p>You are responsible for:</p>
          <ul>
            <li>Securing your API keys and credentials</li>
            <li>Protecting data you process through our Services</li>
            <li>Complying with applicable data protection laws</li>
            <li>Obtaining necessary consents for data processing</li>
          </ul>

          <h3>5. Monitoring and Enforcement</h3>
          <p>We monitor usage of our Services to detect violations. We reserve the right to:</p>
          <ul>
            <li>Investigate suspected violations</li>
            <li>Suspend or terminate accounts that violate this AUP</li>
            <li>Report illegal activities to law enforcement</li>
            <li>Take legal action against violators</li>
          </ul>

          <h3>6. Reporting Violations</h3>
          <p>
            If you become aware of any violation of this AUP, please report it to{" "}
            <a href="mailto:abuse@settler.dev">abuse@settler.dev</a>. We will investigate all
            reports promptly.
          </p>

          <h3>7. Consequences of Violations</h3>
          <p>Violations of this AUP may result in:</p>
          <ul>
            <li>Warning notices</li>
            <li>Temporary suspension of Services</li>
            <li>Permanent termination of account</li>
            <li>Legal action</li>
            <li>Reporting to law enforcement</li>
          </ul>

          <h3>8. Changes to This Policy</h3>
          <p>
            We may update this AUP from time to time. We will notify you of material changes by
            posting the updated policy on this page and updating the "Last Updated" date.
          </p>

          <h3>9. Contact</h3>
          <p>
            Questions about this AUP should be directed to{" "}
            <a href="mailto:legal@settler.dev">legal@settler.dev</a>.
          </p>

          <div className="mt-8 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <p className="text-sm text-muted-foreground mb-0">
              <strong>Disclaimer:</strong> This policy is provided for informational purposes only
              and does not constitute legal advice. Please consult with a legal professional for
              advice specific to your situation.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </AnimatedPageWrapper>
  );
}
