/**
 * Code Block Component
 *
 * Displays code with syntax highlighting
 */

"use client";

import { useRef, useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
  showCopy?: boolean;
}

export function CodeBlock({ code, language, className, showCopy = true }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLPreElement>(null);

  const handleCopy = async () => {
    if (!codeRef.current) return;

    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy code:", err);
    }
  };

  return (
    <div className={cn("relative group", className)}>
      {showCopy && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Copy code"
        >
          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
        </Button>
      )}
      <pre
        ref={codeRef}
        className={cn(
          "bg-slate-900 dark:bg-slate-950 text-slate-100 p-4 rounded-lg overflow-x-auto",
          "text-sm font-mono",
          language && `language-${language}`
        )}
      >
        <code className={language ? `language-${language}` : ""}>{code}</code>
      </pre>
    </div>
  );
}
