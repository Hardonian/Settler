"use client";

import { HelpCircle } from "lucide-react";
import { Tooltip } from "./Tooltip";

interface HelpTextProps {
  text: string;
  className?: string;
}

export function HelpText({ text, className }: HelpTextProps) {
  return (
    <Tooltip content={text} className={className}>
      <HelpCircle className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-help" />
    </Tooltip>
  );
}
