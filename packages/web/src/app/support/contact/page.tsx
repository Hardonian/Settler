"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { AnimatedPageWrapper } from "@/components/AnimatedPageWrapper";
import { MessageCircle, Mail, Send, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ContactSupportPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    category: "general",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // In production, submit to API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <AnimatedPageWrapper aria-label="Contact support confirmation">
        <Navigation />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black pt-32 pb-20">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="text-center">
              <CardContent className="pt-12 pb-12">
                <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  Message Sent Successfully
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                  We've received your message and will get back to you within 24 hours. For urgent
                  issues, please check our{" "}
                  <Link
                    href="/support"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    support articles
                  </Link>{" "}
                  or{" "}
                  <Link
                    href="/community"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    community forum
                  </Link>
                  .
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild variant="outline">
                    <Link href="/support">Back to Support</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/dashboard">Go to Dashboard</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </AnimatedPageWrapper>
    );
  }

  return (
    <AnimatedPageWrapper aria-label="Contact support page">
      <Navigation />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900 dark:text-white">
              Contact Support
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed px-4">
              Have a question or need help? We're here to assist you. Our support team typically
              responds within 24 hours.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <MessageCircle className="w-6 h-6" />
                    Send us a Message
                  </CardTitle>
                  <CardDescription>
                    Fill out the form below and we'll get back to you as soon as possible
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <Label htmlFor="name" className="mb-2.5 block">
                        Name *
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email" className="mb-2.5 block">
                        Email *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label htmlFor="category" className="mb-2.5 block">
                        Category *
                      </Label>
                      <select
                        id="category"
                        required
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="general">General Question</option>
                        <option value="technical">Technical Issue</option>
                        <option value="billing">Billing Question</option>
                        <option value="feature">Feature Request</option>
                        <option value="bug">Bug Report</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="subject" className="mb-2.5 block">
                        Subject *
                      </Label>
                      <Input
                        id="subject"
                        type="text"
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full"
                        placeholder="Brief description of your issue"
                      />
                    </div>

                    <div>
                      <Label htmlFor="message" className="mb-2.5 block">
                        Message *
                      </Label>
                      <textarea
                        id="message"
                        required
                        rows={6}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                        placeholder="Please provide as much detail as possible..."
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full font-medium"
                      size="lg"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Other Ways to Get Help</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                      Support Articles
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                      Browse our comprehensive knowledge base for answers to common questions.
                    </p>
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link href="/support">View Articles</Link>
                    </Button>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                      Community Forum
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                      Ask questions and get help from other Settler users in our community.
                    </p>
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link href="/community">Visit Community</Link>
                    </Button>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                      Documentation
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                      Read our detailed API documentation and integration guides.
                    </p>
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link href="/docs">View Docs</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Response Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                    We typically respond within 24 hours during business days. For urgent issues,
                    please mark your message as "Technical Issue" and include "URGENT" in the
                    subject line.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </AnimatedPageWrapper>
  );
}
