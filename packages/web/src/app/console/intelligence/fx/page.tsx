"use client";

import { useEffect, useState } from "react";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, RefreshCw, Calculator } from "lucide-react";

export default function FxTranslationDashboard() {
  const [rates, setRates] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [translationResult, setTranslationResult] = useState<any>(null);
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    async function loadRates() {
      try {
        const res = await fetch("/api/fx/rates?base=USD&target=EUR");
        const json = await res.json();
        setRates(json.data);
      } catch (e) {
        console.error("Failed to load FX rates", e);
      } finally {
        setLoading(false);
      }
    }
    loadRates();
  }, []);

  const handleTranslate = async () => {
    setTranslating(true);
    try {
      const res = await fetch("/api/fx/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 1000000, sourceCurrency: "USD", targetCurrency: "EUR" }),
      });
      const json = await res.json();
      setTranslationResult(json.data);
    } catch (e) {
      console.error(e);
      alert("Failed to translate ledger balances.");
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div className="space-y-6">
      <ConsolePageHeader
        title="Multi-Entity & FX Translation"
        description="Enterprise cross-entity consolidation and foreign exchange translation."
      />

      <div className="space-y-6 max-w-5xl mt-6">
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Live FX Rates
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading rates...</p>
              ) : rates ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-muted/20 p-4 rounded-lg border border-border/60">
                    <span className="text-sm font-medium">
                      {rates.base} to {rates.target}
                    </span>
                    <Badge variant="outline" className="text-lg py-1">
                      {rates.rate}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Effective Date: {new Date(rates.effectiveDate).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Failed to load rates.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                Consolidate Ledgers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Translate subsidiary ledgers (EUR) into parent reporting currency (USD).
              </p>
              <Button onClick={handleTranslate} disabled={translating} className="w-full">
                {translating ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Run FX Translation (Mock $1M USD to EUR)
              </Button>

              {translationResult && (
                <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Original:</span>
                    <span className="font-mono">
                      {translationResult.originalAmount.toLocaleString()}{" "}
                      {translationResult.sourceCurrency}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Translated:</span>
                    <span className="font-mono">
                      {translationResult.translatedAmount.toLocaleString()}{" "}
                      {translationResult.targetCurrency}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-2 border-t border-border/60 pt-2">
                    <span>Applied Rate: {translationResult.rateUsed}</span>
                    <span>{new Date(translationResult.translationDate).toLocaleTimeString()}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
