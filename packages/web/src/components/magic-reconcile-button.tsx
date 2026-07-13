"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface MagicReconcileButtonProps {
  confidenceCount: number;
  onClick: () => void;
}

export const MagicReconcileButton: React.FC<MagicReconcileButtonProps> = ({
  confidenceCount,
  onClick,
}) => {
  if (confidenceCount === 0) return null;

  return (
    <motion.button
      whileHover={{ scale: 1.05, boxShadow: "0px 0px 20px rgba(99, 102, 241, 0.6)" }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="relative overflow-hidden group bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 px-6 rounded-full shadow-lg flex items-center gap-2 transition-all"
    >
      {/* Animated background sheen */}
      <motion.div
        className="absolute inset-0 bg-white opacity-20"
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
      />

      <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
      <span>Magic Reconcile ({confidenceCount} ready)</span>

      <div className="absolute inset-0 rounded-full border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </motion.button>
  );
};
