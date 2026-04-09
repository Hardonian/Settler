"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AnimatedCodeBlockProps {
  code: string;
  title: string;
  description: string;
  language?: string;
}

/**
 * Animated code block with typewriter effect
 * Accessible with proper ARIA labels
 */
export function AnimatedCodeBlock({
  code,
  title,
  description,
  language = "typescript",
}: AnimatedCodeBlockProps) {
  const [displayedCode, setDisplayedCode] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const codeRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (codeRef.current) {
      observer.observe(codeRef.current);
    }

    return () => {
      if (codeRef.current) {
        observer.unobserve(codeRef.current);
      }
    };
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      // Show all code immediately for reduced motion
      setDisplayedCode(code);
      return;
    }

    // Typewriter effect
    let currentIndex = 0;
    const typeSpeed = 8; // milliseconds per character

    const typeInterval = setInterval(() => {
      if (currentIndex < code.length) {
        setDisplayedCode(code.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typeInterval);
      }
    }, typeSpeed);

    return () => clearInterval(typeInterval);
  }, [isVisible, code]);

  return (
    <Card
      className={cn(
        "max-w-4xl mx-auto",
        "bg-slate-900 border-slate-800",
        "shadow-2xl",
        "transition-all duration-300",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}
      role="region"
      aria-labelledby="code-title"
      aria-describedby="code-description"
    >
      <CardHeader>
        <CardTitle id="code-title" className="text-white">
          {title}
        </CardTitle>
        <CardDescription id="code-description" className="text-muted-foreground">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <pre
          ref={codeRef}
          className="bg-slate-950 rounded-lg p-6 overflow-x-auto"
          role="code"
          aria-label={`${language} code example`}
        >
          <code className="text-sm text-green-400 font-mono" aria-live="polite" aria-atomic="true">
            {displayedCode}
            {isVisible && displayedCode.length < code.length && (
              <span className="animate-pulse">|</span>
            )}
          </code>
        </pre>
      </CardContent>
    </Card>
  );
}
