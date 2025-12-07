"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedGradientProps {
  children?: React.ReactNode;
  className?: string;
  gradient?: string;
  speed?: "slow" | "normal" | "fast";
  size?: "sm" | "md" | "lg" | "xl";
}

export function AnimatedGradient({
  children,
  className,
  gradient = "from-blue-600 via-purple-600 to-pink-600",
  speed = "normal",
  size = "lg",
}: AnimatedGradientProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMousePosition({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const speedClasses = {
    slow: "duration-[8s]",
    normal: "duration-[5s]",
    fast: "duration-[3s]",
  };

  const sizeClasses = {
    sm: "bg-[length:200%_200%]",
    md: "bg-[length:300%_300%]",
    lg: "bg-[length:400%_400%]",
    xl: "bg-[length:500%_500%]",
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden",
        className
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br",
          gradient,
          sizeClasses[size],
          speedClasses[speed],
          "animate-gradient-shift"
        )}
        style={{
          backgroundPosition: `${mousePosition.x}% ${mousePosition.y}%`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
