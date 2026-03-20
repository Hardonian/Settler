"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, CreditCard, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PaymentRecoveryFlowProps {
  userId: string;
  subscriptionId?: string;
}

type RecoveryStatus = "active" | "grace_period" | "recovered" | "failed";

interface PaymentRecovery {
  id: string;
  failure_type: string;
  failure_count: number;
  grace_period_ends_at: string | null;
  recovery_attempts: number;
  status: RecoveryStatus;
}

export function PaymentRecoveryFlow({ userId, subscriptionId }: PaymentRecoveryFlowProps) {
  const [recovery, setRecovery] = useState<PaymentRecovery | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    void fetchRecoveryStatus();
  }, [userId, subscriptionId]);

  const fetchRecoveryStatus = async () => {
    try {
      const response = await fetch(
        `/api/billing/payment-recovery?userId=${userId}${subscriptionId ? `&subscriptionId=${subscriptionId}` : ""}`
      );
      if (response.ok) {
        const data = await response.json();
        setRecovery(data.recovery);
      }
    } catch (error: unknown) {
      console.error("Failed to fetch recovery status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePayment = async () => {
    setUpdating(true);
    try {
      // Redirect to payment update page
      window.location.href = "/dashboard/billing?action=update_payment";
    } catch (error: unknown) {
      console.error("Failed to update payment:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleRetryPayment = async () => {
    setUpdating(true);
    try {
      const response = await fetch("/api/billing/retry-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, subscriptionId }),
      });

      if (response.ok) {
        await fetchRecoveryStatus();
      } else {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        alert(payload.error || "Failed to retry payment");
      }
    } catch (error: unknown) {
      console.error("Failed to retry payment:", error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recovery || recovery.status === "recovered") {
    return null;
  }

  const gracePeriodEnds = recovery.grace_period_ends_at
    ? new Date(recovery.grace_period_ends_at)
    : null;
  const daysRemaining = gracePeriodEnds
    ? Math.ceil((gracePeriodEnds.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const isUrgent = daysRemaining !== null && daysRemaining <= 3;

  return (
    <Card
      className={cn(
        "border-2",
        isUrgent
          ? "border-red-500 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
          : "border-amber-500 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20"
      )}
    >
      <CardHeader>
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
              isUrgent ? "bg-red-500 dark:bg-red-600" : "bg-amber-500 dark:bg-amber-600"
            )}
          >
            {recovery.status === "grace_period" ? (
              <Clock className="w-5 h-5 text-white" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">
              {recovery.status === "grace_period" ? "Payment Issue Detected" : "Payment Failed"}
            </CardTitle>
            <CardDescription className="mt-1">
              {recovery.failure_type === "declined"
                ? "Your payment method was declined"
                : recovery.failure_type === "insufficient_funds"
                  ? "Insufficient funds in your account"
                  : recovery.failure_type === "expired_card"
                    ? "Your payment card has expired"
                    : "There was an issue processing your payment"}
            </CardDescription>
          </div>
          <Badge
            variant={isUrgent ? "destructive" : "default"}
            className={cn(
              isUrgent && "bg-red-600 dark:bg-red-700",
              !isUrgent && "bg-amber-600 dark:bg-amber-700"
            )}
          >
            {recovery.status === "grace_period" && daysRemaining !== null
              ? `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining`
              : "Action Required"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {recovery.status === "grace_period" && gracePeriodEnds && (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-900 dark:text-white">
                Grace Period
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Your service will continue until{" "}
              <strong>{gracePeriodEnds.toLocaleDateString()}</strong>. Please update your payment
              method to avoid service interruption.
            </p>
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Failure Count:</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {recovery.failure_count}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Recovery Attempts:</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {recovery.recovery_attempts}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleUpdatePayment}
            disabled={updating}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Update Payment Method
          </Button>
          {recovery.status === "active" && (
            <Button
              onClick={handleRetryPayment}
              disabled={updating}
              variant="outline"
              className="flex-1"
            >
              Retry Payment
            </Button>
          )}
        </div>

        {recovery.status === "grace_period" && (
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            Need help? Contact{" "}
            <Link href="/support" className="text-blue-600 dark:text-blue-400 hover:underline">
              support
            </Link>
            .
          </p>
        )}
      </CardContent>
    </Card>
  );
}
