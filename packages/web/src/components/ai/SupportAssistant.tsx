/**
 * AI Support Assistant Component
 * Contextual in-app help powered by AI
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Send, Sparkles, X, BookOpen, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SupportResponse {
  answer: string;
  suggestions: string[];
  related_docs: string[];
}

export function SupportAssistant({ context }: { context?: { page?: string; action?: string } }) {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<SupportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch("/api/ai/support-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          context,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to get response");
      }

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError("Failed to get response. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        aria-label="Open support assistant"
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 z-50 w-96 max-h-[600px] shadow-2xl border-2">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <CardTitle className="text-lg">AI Assistant</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsOpen(false);
              setQuestion("");
              setResponse(null);
              setError(null);
            }}
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-blue-100 text-sm">
          Ask me anything about Settler
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
        {!response && !error && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question..."
              disabled={loading}
              className="w-full"
            />
            <Button
              type="submit"
              disabled={loading || !question.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              {loading ? (
                "Thinking..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Ask
                </>
              )}
            </Button>
          </form>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {response && (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {response.answer}
              </p>
            </div>

            {response.suggestions && response.suggestions.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Quick Actions:
                </p>
                <div className="space-y-2">
                  {response.suggestions.map((suggestion, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="w-full text-left justify-start"
                      onClick={() => setQuestion(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {response.related_docs && response.related_docs.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  Related Documentation:
                </p>
                <div className="space-y-1">
                  {response.related_docs.map((doc, i) => (
                    <a
                      key={i}
                      href={doc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {doc}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                setQuestion("");
                setResponse(null);
                setError(null);
              }}
            >
              Ask Another Question
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
