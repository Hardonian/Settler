"use client";

import { useState } from "react";
import { MessageCircle, X, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");

  if (!isOpen && !isMinimized) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center z-50 transition-all"
        aria-label="Open support chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 transition-all",
        isMinimized ? "w-64" : "w-96"
      )}
    >
      <Card className="shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Support Chat</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">We're here to help</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsMinimized(!isMinimized);
              }}
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsOpen(false);
                setIsMinimized(false);
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        {!isMinimized && (
          <CardContent className="space-y-4">
            <div className="h-64 overflow-y-auto space-y-3 p-2 bg-slate-50 dark:bg-slate-900 rounded">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  Hi! How can I help you today?
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && message.trim()) {
                    // Send message
                    setMessage("");
                  }
                }}
              />
              <Button
                size="sm"
                onClick={() => {
                  if (message.trim()) {
                    // Send message
                    setMessage("");
                  }
                }}
              >
                Send
              </Button>
            </div>
            <p className="text-xs text-center text-slate-500 dark:text-slate-400">
              Powered by Settler Support
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
