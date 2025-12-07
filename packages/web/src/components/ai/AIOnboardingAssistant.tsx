"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function AIOnboardingAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hi! I'm your Settler onboarding assistant. I can help you set up your first reconciliation, connect integrations, or answer any questions. What would you like to do?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai/onboarding-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "I'm here to help! What would you like to know?",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Failed to get AI response:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I'm having trouble right now. Please try again or contact support.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-lg p-3",
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                )}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs mt-1 opacity-70">{message.timestamp.toLocaleTimeString()}</p>
              </div>
              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
                <Loader2 className="w-4 h-4 animate-spin text-slate-600 dark:text-slate-400" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask me anything about Settler..."
              disabled={loading}
            />
            <Button onClick={handleSend} disabled={loading || !input.trim()} size="sm">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
