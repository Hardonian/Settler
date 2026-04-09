/**
 * Slider Component
 *
 * Simple range slider for numeric inputs.
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SliderProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
> {
  value: number[];
  onValueChange: (value: number[]) => void;
}

export function Slider({ className, value, onValueChange, ...props }: SliderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    onValueChange([newValue]);
  };

  return (
    <input
      type="range"
      className={cn(
        "w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700",
        className
      )}
      value={value[0]}
      onChange={handleChange}
      {...props}
    />
  );
}
