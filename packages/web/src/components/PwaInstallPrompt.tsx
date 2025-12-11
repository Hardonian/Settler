'use client';

import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show prompt if not already installed and not dismissed recently
      // For simplicity in this demo, we just show it if the event fires
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-slate-900 text-white p-4 rounded-lg shadow-xl z-50 flex items-center justify-between border border-slate-700"
        role="alertdialog"
        aria-labelledby="install-title"
      >
        <div className="flex-1 mr-4">
          <h3 id="install-title" className="font-semibold text-sm mb-1">Install Settler</h3>
          <p className="text-xs text-slate-300">Add to your home screen for the best experience.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="secondary" 
            onClick={handleInstallClick}
            className="h-8 text-xs bg-blue-600 text-white hover:bg-blue-700 border-none"
          >
            <Download className="w-3 h-3 mr-1.5" />
            Install
          </Button>
          <button 
            onClick={handleDismiss}
            className="p-1 hover:bg-slate-800 rounded-full transition-colors"
            aria-label="Dismiss install prompt"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
