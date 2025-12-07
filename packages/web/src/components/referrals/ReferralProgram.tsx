"use client";

import { useState, useEffect } from "react";
import { Copy, CheckCircle2, Users, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getReferralStats } from "@/lib/referrals";

export function ReferralProgram() {
  const [referralCode, setReferralCode] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<{
    referralCode: string;
    totalReferrals: number;
    completedReferrals: number;
    totalRewards: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReferralStats();
  }, []);

  const fetchReferralStats = async () => {
    try {
      // In production, get userId from auth
      const userId = "current-user-id"; // Replace with actual user ID
      const referralStats = await getReferralStats(userId);
      setStats(referralStats);
      setReferralCode(referralStats.referralCode);
    } catch (error) {
      console.error("Failed to fetch referral stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const referralLink = referralCode ? `https://settler.dev/signup?ref=${referralCode}` : "";

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Referral Program</CardTitle>
          <CardDescription>
            Share Settler with friends and earn $25 for each person who upgrades to a paid plan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Referral Code */}
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
              Your Referral Code
            </label>
            <div className="flex items-center gap-2">
              <Input value={referralCode} readOnly className="font-mono" />
              <Button onClick={handleCopy} size="sm" variant="outline">
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Referral Link */}
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
              Referral Link
            </label>
            <div className="flex items-center gap-2">
              <Input value={referralLink} readOnly className="text-sm" />
              <Button
                onClick={() => navigator.clipboard.writeText(referralLink)}
                size="sm"
                variant="outline"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stats.totalReferrals}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Total Referrals</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stats.completedReferrals}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Completed</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  ${stats.totalRewards.toFixed(2)}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Total Rewards</div>
              </div>
            </div>
          )}

          {/* How It Works */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">How It Works</h4>
            <ol className="text-sm text-blue-800 dark:text-blue-400 space-y-1 list-decimal list-inside">
              <li>Share your referral code or link with friends</li>
              <li>They sign up using your code</li>
              <li>When they upgrade to a paid plan, you earn $25</li>
              <li>Rewards are credited to your account</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
