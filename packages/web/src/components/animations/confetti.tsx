'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const InboxZeroConfetti: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-hide after 5 seconds
    const timer = setTimeout(() => setIsVisible(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
      {/* Beautiful central success badge */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 15, stiffness: 100 }}
        className="relative z-10 bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-2xl border border-green-200 dark:border-green-800 text-center"
      >
        <div className="w-24 h-24 mx-auto bg-gradient-to-tr from-green-400 to-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-green-500/30">
          <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Inbox Zero!</h2>
        <p className="text-gray-600 dark:text-gray-400">All 4,201 transactions matched perfectly.</p>
      </motion.div>

      {/* Abstract particle explosion (CSS/Framer combo) */}
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            opacity: 1, 
            scale: 0,
            x: 0, 
            y: 0 
          }}
          animate={{ 
            opacity: 0,
            scale: Math.random() * 2 + 1,
            x: (Math.random() - 0.5) * window.innerWidth,
            y: (Math.random() - 0.5) * window.innerHeight
          }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute w-4 h-4 rounded-full"
          style={{
            backgroundColor: ['#34d399', '#60a5fa', '#a78bfa', '#fbbf24'][Math.floor(Math.random() * 4)]
          }}
        />
      ))}
    </div>
  );
};
