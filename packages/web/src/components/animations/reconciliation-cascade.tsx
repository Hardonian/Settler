'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MatchItem {
  id: string;
  sourceAmount: string;
  targetAmount: string;
  vendor: string;
}

interface CascadeProps {
  isProcessing: boolean;
  onComplete: () => void;
}

export const ReconciliationCascade: React.FC<CascadeProps> = ({ isProcessing, onComplete }) => {
  const [items, setItems] = useState<MatchItem[]>([]);

  useEffect(() => {
    if (!isProcessing) return;

    // Simulate slot-machine cascade of matches
    const mockData = [
      { id: '1', sourceAmount: '$120.00', targetAmount: '$120.00', vendor: 'Stripe Payout' },
      { id: '2', sourceAmount: '$45.50', targetAmount: '$45.50', vendor: 'AWS Cloud' },
      { id: '3', sourceAmount: '$2,100.00', targetAmount: '$2,100.00', vendor: 'Client Invoice' },
      { id: '4', sourceAmount: '$15.00', targetAmount: '$15.00', vendor: 'Bank Fee' },
    ];

    let count = 0;
    const interval = setInterval(() => {
      if (count < mockData.length) {
        setItems(prev => [...prev, mockData[count]]);
        count++;
      } else {
        clearInterval(interval);
        setTimeout(onComplete, 1000); // Wait a second before finishing
      }
    }, 400);

    return () => clearInterval(interval);
  }, [isProcessing, onComplete]);

  return (
    <div className="w-full max-w-2xl mx-auto overflow-hidden relative min-h-[300px] flex flex-col justify-end pb-8">
      {/* Fade overlay for top */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white dark:from-gray-950 to-transparent z-10 pointer-events-none" />
      
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="flex items-center justify-between p-4 mb-3 rounded-xl border border-indigo-100 dark:border-indigo-900 bg-white/80 dark:bg-gray-900/80 backdrop-blur shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-400">
                ✓
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{item.vendor}</p>
                <p className="text-xs text-gray-500">Auto-matched via Heuristics</p>
              </div>
            </div>
            <div className="flex items-center gap-6 font-mono text-sm">
              <span className="text-gray-500">{item.sourceAmount}</span>
              <span className="text-indigo-400">→</span>
              <span className="font-bold text-gray-900 dark:text-white">{item.targetAmount}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
