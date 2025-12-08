'use client';

import { useRef, useState, MouseEvent } from 'react';
import { cn } from '@/lib/utils';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  spotlightSize?: number;
  borderColor?: string;
}

export function SpotlightCard({
  children,
  className,
  spotlightColor = 'rgba(6, 182, 212, 0.3)',
  spotlightSize = 300,
  borderColor = 'rgba(168, 85, 247, 0.5)',
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({
      x: rect.width / 2,
      y: rect.height / 2,
    });
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        'relative group rounded-2xl p-6 overflow-hidden',
        'glass transition-all duration-200',
        'hover:shadow-2xl hover:shadow-electric-cyan/20',
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        cursor: 'pointer',
      }}
    >
      {/* Spotlight effect */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
        style={{
          background: `radial-gradient(${spotlightSize}px circle at ${mousePosition.x}px ${mousePosition.y}px, ${spotlightColor}, transparent 70%)`,
        }}
      />

      {/* Animated border gradient */}
      {isHovered && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: `radial-gradient(${spotlightSize * 1.5}px circle at ${mousePosition.x}px ${mousePosition.y}px, ${borderColor}, transparent 60%)`,
            WebkitMaskImage: 'linear-gradient(#fff, #fff), linear-gradient(#fff, #fff)',
            WebkitMaskComposite: 'xor',
            maskImage: 'linear-gradient(#fff, #fff), linear-gradient(#fff, #fff)',
            maskComposite: 'exclude',
            padding: '1px',
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
