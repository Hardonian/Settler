"use client";

import { useState } from "react";
import { AlertCircle, FileText, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function BillingDisputeFlow() {
  const [formData, setFormData] = useState({
    invoiceId: "",
    amount: "",
    reason: "",
    description: "",
    attachments: [] as File[],
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/billing/dispute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitted(true);
      }
    } catch (error: unknown) {
      console.error("Failed to submit dispute:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Dispute Submitted
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              We&apos;ve received your dispute and will review it within 5 business days.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Billing Dispute
        </CardTitle>
        <CardDescription>Submit a dispute for incorrect charges or billing issues</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6">
          <AlertDescription>
            Please review your invoice carefully before submitting a dispute. We&apos;ll respond within 5
            business days.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="invoiceId">Invoice ID</Label>
            <Input
              id="invoiceId"
              value={formData.invoiceId}
              onChange={(e) => setFormData({ ...formData, invoiceId: e.target.value })}
              required
              placeholder="INV-2026-001"
            />
          </div>

          <div>
            <Label htmlFor="amount">Disputed Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              placeholder="0.00"
            />
          </div>

          <div>
            <Label htmlFor="reason">Reason</Label>
            <select
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800"
            >
              <option value="">Select a reason</option>
              <option value="duplicate">Duplicate Charge</option>
              <option value="incorrect_amount">Incorrect Amount</option>
              <option value="service_not_received">Service Not Received</option>
              <option value="cancelled_service">Cancelled Service</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={5}
              placeholder="Please provide details about the dispute..."
            />
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? (
              "Submitting..."
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Dispute
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
