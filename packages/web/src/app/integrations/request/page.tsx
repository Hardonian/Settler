"use client";

import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { AnimatedPageWrapper } from "@/components/AnimatedPageWrapper";
import { AnimatedHero } from "@/components/AnimatedHero";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Mail, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function IntegrationRequestPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    platform: "",
    useCase: "",
    description: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would submit to an API endpoint
    // For now, we'll just show success message
    setSubmitted(true);
  };

  return (
    <AnimatedPageWrapper aria-label="Request Integration page">
      <Navigation />

      <AnimatedHero
        badge="Integration Request"
        title="Request a New Integration"
        description="Don't see your platform? Let us know what integration you need."
      />

      <section className="py-16 px-4 sm:px-6 lg:px-8" aria-labelledby="request-form-heading">
        <div className="max-w-2xl mx-auto">
          <h2 id="request-form-heading" className="sr-only">
            Integration Request Form
          </h2>

          {submitted ? (
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">
                  Request Submitted!
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                  Thank you for your request. We&apos;ll review it and get back to you soon.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button asChild>
                    <Link href="/docs">View Documentation</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/dashboard/integrations">Go to Dashboard</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-2xl">Integration Request Form</CardTitle>
                <CardDescription>
                  Tell us about the platform or service you&apos;d like to integrate with Settler
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Name</Label>
                    <Input
                      id="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="platform">Platform/Service Name</Label>
                    <Input
                      id="platform"
                      type="text"
                      required
                      value={formData.platform}
                      onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                      placeholder="e.g., Square, WooCommerce, Xero"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="useCase">Use Case</Label>
                    <Input
                      id="useCase"
                      type="text"
                      required
                      value={formData.useCase}
                      onChange={(e) => setFormData({ ...formData, useCase: e.target.value })}
                      placeholder="e.g., Reconcile Square payments with QuickBooks"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Additional Details</Label>
                    <Textarea
                      id="description"
                      rows={5}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Tell us more about your integration needs, expected volume, timeline, etc."
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" className="flex-1">
                      <Mail className="w-4 h-4 mr-2" />
                      Submit Request
                    </Button>
                    <Button type="button" variant="outline" asChild>
                      <Link href="/support/contact">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Contact Support
                      </Link>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
              What happens next?
            </h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li>• We&apos;ll review your request and assess feasibility</li>
              <li>• Our team will reach out within 2-3 business days</li>
              <li>• We&apos;ll discuss timeline and requirements</li>
              <li>• Once approved, we&apos;ll prioritize development</li>
            </ul>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Need immediate help?{" "}
              <Link href="/support" className="text-blue-600 dark:text-blue-400 hover:underline">
                Visit our support page
              </Link>{" "}
              or{" "}
              <Link href="/community" className="text-blue-600 dark:text-blue-400 hover:underline">
                join our community
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </AnimatedPageWrapper>
  );
}
