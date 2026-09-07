"use client";

import { useReducedMotion } from "framer-motion";

export function AmbientLightOrbs() {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
      {/* Top right drifting teal orb */}
      <div
        className="absolute -top-[15%] -right-[10%] w-[55vw] h-[55vw] max-w-[650px] max-h-[650px] rounded-full bg-gradient-to-br from-teal-400/15 via-emerald-400/10 to-transparent blur-3xl animate-blob"
        style={{ animationDuration: "14s" }}
      />

      {/* Top left sapphire blue orb */}
      <div
        className="absolute top-[20%] -left-[15%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-gradient-to-tr from-blue-500/10 via-teal-300/10 to-transparent blur-3xl animate-blob"
        style={{ animationDuration: "18s", animationDelay: "2s" }}
      />

      {/* Center-lower indigo/cyan subtle glow */}
      <div
        className="absolute top-[60%] right-[10%] w-[45vw] h-[45vw] max-w-[500px] max-h-[500px] rounded-full bg-gradient-to-bl from-cyan-400/10 via-blue-400/5 to-transparent blur-3xl animate-blob"
        style={{ animationDuration: "16s", animationDelay: "4s" }}
      />

      {/* Subtle bottom glow */}
      <div
        className="absolute bottom-0 left-[20%] w-[60vw] h-[30vw] max-w-[700px] max-h-[350px] rounded-full bg-gradient-to-t from-emerald-500/8 via-teal-400/5 to-transparent blur-3xl animate-blob"
        style={{ animationDuration: "20s", animationDelay: "1s" }}
      />
    </div>
  );
}
