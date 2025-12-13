'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SafeImage } from './SafeImage';

interface LightboxProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  alt: string;
  title?: string;
  description?: string;
}

/**
 * Lightbox component for viewing images in full-screen modal
 * Supports keyboard navigation (ESC to close) and focus trapping
 */
export function Lightbox({ isOpen, onClose, src, alt, title, description }: LightboxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Store the previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Trap focus within the lightbox
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = containerRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Handle ESC key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Prevent body scroll when lightbox is open
    document.body.style.overflow = 'hidden';

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleTabKey);

    // Focus the close button
    const closeButton = containerRef.current?.querySelector('button');
    closeButton?.focus();

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTabKey);

      // Restore focus to previous element
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'lightbox-title' : undefined}
      aria-describedby={description ? 'lightbox-description' : undefined}
      onClick={(e) => {
        // Close if clicking the backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex flex-col items-center justify-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className={cn(
            'absolute top-4 right-4 z-10',
            'p-2 rounded-full bg-white/10 hover:bg-white/20',
            'text-white transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black'
          )}
          aria-label="Close lightbox"
        >
          <X className="w-6 h-6" aria-hidden="true" />
        </button>

        {/* Image Container */}
        <div className="relative w-full h-full flex items-center justify-center">
          <SafeImage
            src={src}
            alt={alt}
            fill
            className="object-contain"
            sizes="100vw"
            priority
          />
        </div>

        {/* Caption */}
        {(title || description) && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
            {title && (
              <h3 id="lightbox-title" className="text-xl font-bold mb-2">
                {title}
              </h3>
            )}
            {description && (
              <p id="lightbox-description" className="text-sm text-white/80">
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
