"use client";

import { useState, MouseEvent, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface RippleButtonProps {
  children: ReactNode;
  className?: string;
  rippleColor?: string;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  [key: string]: any;
}

export function RippleButton({
  children,
  className,
  rippleColor = "rgba(255, 255, 255, 0.5)",
  onClick,
  ...props
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const [rippleId, setRippleId] = useState(0);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setRipples((prev) => [...prev, { x, y, id: rippleId }]);
    setRippleId((prev) => prev + 1);

    onClick?.(e);
  };

  return (
    <button className={cn("relative overflow-hidden", className)} onClick={handleClick} {...props}>
      {children}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              backgroundColor: rippleColor,
              width: 0,
              height: 0,
            }}
            initial={{ width: 0, height: 0, x: "-50%", y: "-50%", opacity: 1 }}
            animate={{ width: 300, height: 300, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            onAnimationComplete={() => {
              setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
            }}
          />
        ))}
      </AnimatePresence>
    </button>
  );
}
