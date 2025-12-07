"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import { HelpCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContextualTooltipProps {
  content: string | ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  trigger?: "hover" | "click" | "always";
  className?: string;
  showOnce?: boolean;
  tooltipId?: string;
}

export function ContextualTooltip({
  content,
  position = "top",
  trigger = "hover",
  className,
  showOnce = false,
  tooltipId,
}: ContextualTooltipProps) {
  const [isVisible, setIsVisible] = useState(trigger === "always");
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showOnce && tooltipId) {
      const hasSeen = localStorage.getItem(`tooltip_seen_${tooltipId}`);
      if (hasSeen) {
        setIsVisible(false);
        return;
      }
    }

    if (trigger === "always") {
      setIsVisible(true);
    }
  }, [trigger, showOnce, tooltipId]);

  useEffect(() => {
    if (isVisible && containerRef.current && tooltipRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;

      let top = 0;
      let left = 0;

      switch (position) {
        case "top":
          top = containerRect.top + scrollY - tooltipRect.height - 8;
          left = containerRect.left + scrollX + containerRect.width / 2 - tooltipRect.width / 2;
          break;
        case "bottom":
          top = containerRect.bottom + scrollY + 8;
          left = containerRect.left + scrollX + containerRect.width / 2 - tooltipRect.width / 2;
          break;
        case "left":
          top = containerRect.top + scrollY + containerRect.height / 2 - tooltipRect.height / 2;
          left = containerRect.left + scrollX - tooltipRect.width - 8;
          break;
        case "right":
          top = containerRect.top + scrollY + containerRect.height / 2 - tooltipRect.height / 2;
          left = containerRect.right + scrollX + 8;
          break;
      }

      // Keep tooltip within viewport
      const padding = 16;
      top = Math.max(padding, Math.min(top, window.innerHeight + scrollY - tooltipRect.height - padding));
      left = Math.max(padding, Math.min(left, window.innerWidth + scrollX - tooltipRect.width - padding));

      setTooltipPosition({ top, left });
    }
  }, [isVisible, position]);

  const handleMouseEnter = () => {
    if (trigger === "hover") {
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === "hover") {
      setIsVisible(false);
    }
  };

  const handleClick = () => {
    if (trigger === "click") {
      setIsVisible(!isVisible);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    if (showOnce && tooltipId) {
      localStorage.setItem(`tooltip_seen_${tooltipId}`, "true");
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-block", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <HelpCircle className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-help" />
      {isVisible && (
        <div
          ref={tooltipRef}
          className={cn(
            "absolute z-50 w-64 p-3 bg-slate-900 dark:bg-slate-800 text-white text-sm rounded-lg shadow-xl",
            "before:content-[''] before:absolute before:w-0 before:h-0",
            position === "top" &&
              "before:border-l-8 before:border-r-8 before:border-t-8 before:border-t-slate-900 dark:before:border-t-slate-800 before:border-l-transparent before:border-r-transparent before:bottom-[-8px] before:left-1/2 before:-translate-x-1/2",
            position === "bottom" &&
              "before:border-l-8 before:border-r-8 before:border-b-8 before:border-b-slate-900 dark:before:border-b-slate-800 before:border-l-transparent before:border-r-transparent before:top-[-8px] before:left-1/2 before:-translate-x-1/2",
            position === "left" &&
              "before:border-t-8 before:border-b-8 before:border-l-8 before:border-l-slate-900 dark:before:border-l-slate-800 before:border-t-transparent before:border-b-transparent before:right-[-8px] before:top-1/2 before:-translate-y-1/2",
            position === "right" &&
              "before:border-t-8 before:border-b-8 before:border-r-8 before:border-r-slate-900 dark:before:border-r-slate-800 before:border-t-transparent before:border-b-transparent before:left-[-8px] before:top-1/2 before:-translate-y-1/2"
          )}
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
          }}
        >
          {trigger === "always" && (
            <button
              onClick={handleClose}
              className="absolute top-2 right-2 text-slate-400 hover:text-white"
              aria-label="Close tooltip"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="pr-6">{typeof content === "string" ? <p>{content}</p> : content}</div>
        </div>
      )}
    </div>
  );
}
