import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Mail, Calendar, FileText, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact - Settler",
  description:
    "Discuss deterministic reconciliation architecture, enterprise deployment, or schedule a strategic consultation with the Settler team.",
};

const contactChannels = [
  {
    icon: Calendar,
    title: "Strategic Consultation",
    description:
      "Complimentary 30-minute session to review your reconciliation architecture and identify the optimal deployment approach.",
    cta: "Schedule a Session",
    href: "mailto:sales@settler.dev?subject=Strategic%20Consultation%20Request",
    primary: true,
  },
  {
    icon: FileText,
    title: "Integration Review",
    description:
      "Request a technical review of your integration requirements, adapter needs, and reconciliation workflow design.",
    cta: "Request a Review",
    href: "mailto:engineering@settler.dev?subject=Integration%20Review%20Request",
    primary: false,
  },
  {
    icon: Mail,
    title: "General Inquiries",
    description:
      "Questions about the platform, licensing, or partnership opportunities. We respond within one business day.",
    cta: "Send a Message",
    href: "mailto:support@settler.dev",
    primary: false,
  },
  {
    icon: MessageSquare,
    title: "Developer Community",
    description:
      "Join the Settler community on Discord for technical discussions, adapter development, and open-source collaboration.",
    cta: "Join Discord",
    href: "https://discord.gg/settler",
    primary: false,
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navigation />

      {/* Hero */}
      <section
        className="px-4 sm:px-6 lg:px-8 pt-12 pb-12 md:pt-16 md:pb-16"
        aria-labelledby="contact-heading"
      >
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-6 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-2 text-sm font-medium">
            Talk to Our Team
          </Badge>
          <h1
            id="contact-heading"
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 text-slate-900 dark:text-white leading-tight tracking-tight"
          >
            Discuss Your Reconciliation Architecture
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Whether you are evaluating deterministic reconciliation for the first time or scaling
            an existing deployment, our team is available to help scope your requirements.
          </p>
        </div>
      </section>

      {/* Contact Channels */}
      <section
        className="px-4 sm:px-6 lg:px-8 py-12 md:py-16"
        aria-label="Contact options"
      >
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {contactChannels.map((channel, index) => {
              const Icon = channel.icon;
              return (
                <Card
                  key={index}
                  className={`transition-all duration-200 ${channel.primary ? "border-2 border-slate-900 dark:border-white shadow-lg" : "border border-slate-200 dark:border-slate-800"}`}
                >
                  <CardContent className="p-6 md:p-8">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5">
                      <Icon className="w-6 h-6 text-slate-700 dark:text-slate-300" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">
                      {channel.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                      {channel.description}
                    </p>
                    <Button
                      asChild
                      variant={channel.primary ? "default" : "outline"}
                      className={channel.primary ? "bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100" : ""}
                    >
                      <a
                        href={channel.href}
                        {...(channel.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      >
                        {channel.cta} <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* What to Expect */}
      <section
        className="px-4 sm:px-6 lg:px-8 py-16 md:py-20 bg-white dark:bg-slate-900"
        aria-label="What to expect"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-slate-900 dark:text-white tracking-tight">
              What to Expect
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Every conversation is structured around your operational context.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Architecture Review",
                description: "We assess your current reconciliation workflows, data sources, and integration requirements.",
              },
              {
                step: "2",
                title: "Failure Surface Analysis",
                description: "We identify where manual processes introduce risk and where deterministic automation reduces exposure.",
              },
              {
                step: "3",
                title: "Deployment Recommendation",
                description: "We recommend an engagement model matched to your operational maturity and scale requirements.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 text-center"
              >
                <div className="w-10 h-10 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center mx-auto mb-4 text-sm font-bold">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Direct Contact */}
      <section
        className="px-4 sm:px-6 lg:px-8 py-12 md:py-16"
        aria-label="Direct contact information"
      >
        <div className="max-w-3xl mx-auto">
          <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-semibold mb-6 text-slate-900 dark:text-white text-center">
              Direct Contact
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-1">
                  General
                </p>
                <a
                  href="mailto:support@settler.dev"
                  className="text-sm font-medium text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  support@settler.dev
                </a>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-1">
                  Enterprise
                </p>
                <a
                  href="mailto:sales@settler.dev"
                  className="text-sm font-medium text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  sales@settler.dev
                </a>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-1">
                  Security
                </p>
                <a
                  href="mailto:security@settler.dev"
                  className="text-sm font-medium text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  security@settler.dev
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 md:py-20 bg-slate-900 text-white" aria-label="Get started">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 tracking-tight">
            Ready to Explore?
          </h2>
          <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            Start with the documentation or schedule a conversation. No commitment required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              asChild
              className="w-full sm:w-auto bg-white text-slate-900 hover:bg-slate-100 px-8 py-6 text-lg font-semibold"
            >
              <Link href="/docs/quickstart" className="flex items-center justify-center gap-2">
                Read Quickstart <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="w-full sm:w-auto px-8 py-6 text-lg border-2 border-slate-600 bg-transparent text-white hover:bg-slate-800"
            >
              <Link href="/pricing">Explore Engagement Models</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
