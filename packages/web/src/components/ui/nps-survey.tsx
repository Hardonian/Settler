"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, StarIcon, Send, X, MessageSquare, Heart, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Textarea } from "./textarea";

interface NPSSurveyData {
  score: number;
  feedback: string;
  category: "product" | "support" | "pricing" | "features" | "other";
}

export function NPSSurvey({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<"score" | "feedback" | "complete">("score");
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [category, setCategory] = useState<NPSSurveyData["category"]>("product");
  const [submitting, setSubmitting] = useState(false);

  const handleScoreSelect = (value: number) => {
    setScore(value);
    setStep("feedback");
  };

  const handleSubmit = async () => {
    if (!score) return;
    setSubmitting(true);
    try {
      await fetch("/api/nps/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, feedback, category }),
      });
      setStep("complete");
    } catch (error) {
      console.error("Failed to submit NPS:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="w-full max-w-md bg-black border border-[#333] rounded-xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <CardHeader className="p-6 border-b border-[#333] bg-[#0a0a0a]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-xl uppercase tracking-widest">
                  How likely are you to recommend Settler?
                </h3>
                <p className="text-zinc-400 text-sm mt-1">Your feedback helps us improve.</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[#111] transition-colors text-zinc-500 hover:text-white"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </motion.button>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Step 1: Score Selection */}
            <AnimatePresence mode="wait">
              {step === "score" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <p className="text-zinc-400 text-sm mb-6 text-center">
                    On a scale of 0-10, how likely are you to recommend Settler to a colleague?
                  </p>
                  <div className="flex justify-center gap-2 flex-wrap">
                    {[...Array(11)].map((_, i) => (
                      <motion.button
                        key={i}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleScoreSelect(i)}
                        className={`w-12 h-12 rounded-xl font-bold text-lg transition-all ${
                          score === i
                            ? "bg-[#ffb000] text-black shadow-lg shadow-[#ffb000]/30"
                            : "bg-[#111] border border-[#333] text-zinc-300 hover:border-[#ffb000] hover:text-white"
                        }`}
                      >
                        {i === 10 ? "10" : i}
                      </motion.button>
                    ))}
                  </div>
                  {score !== null && (
                    <p className="text-center text-sm text-zinc-500 mt-4">
                      You selected <span className="text-[#ffb000] font-bold">{score}</span> / 10
                    </p>
                  )}
                </motion.div>
              )}

              {/* Step 2: Feedback */}
              {step === "feedback" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <p className="text-zinc-400 text-sm mb-4 text-center">
                    What's the main reason for your score?
                  </p>
                  <Textarea
                    placeholder="Tell us more... (optional)"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="mb-4"
                    rows={4}
                  />
                  <div className="grid gap-2 sm:grid-cols-3">
                    {[
                      { value: "product", label: "Product", icon: "📦" },
                      { value: "support", label: "Support", icon: "🎧" },
                      { value: "pricing", label: "Pricing", icon: "💰" },
                      { value: "features", label: "Features", icon: "✨" },
                      { value: "other", label: "Other", icon: "📝" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setCategory(opt.value as NPSSurveyData["category"])}
                        className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                          category === opt.value
                            ? "border-[#ffb000] bg-[#ffb000]20 text-[#ffb000]"
                            : "border-[#333] text-zinc-400 hover:border-[#ffb000]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting || !feedback.trim()}
                    className="w-full"
                    size="lg"
                  >
                    {submitting ? "Submitting..." : "Submit Feedback"}
                  </Button>
                </motion.div>
              )}

              {/* Step 3: Complete */}
              {step === "complete" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center"
                  >
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </motion.div>
                  <h3 className="text-white font-bold text-2xl mb-2">Thank You!</h3>
                  <p className="text-zinc-400 mb-6">Your feedback helps us make Settler better.</p>
                  <p className="text-zinc-500 text-sm">
                    Score: <span className="text-[#ffb000] font-bold">{score}/10</span>
                  </p>
                  <Button onClick={onClose} className="w-full mt-6" size="lg">
                    Close
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
