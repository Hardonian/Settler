"use strict";

import React, { useEffect, useRef, useState } from "react";

interface HeroMediaProps {
  videoSrc?: string;
  fallbackSrc?: string;
  poster?: string;
  className?: string;
}

export const HeroMedia: React.FC<HeroMediaProps> = ({
  videoSrc = "/hero/settler-hero.mp4",
  fallbackSrc = "/hero/settler-hero-fallback.png",
  poster = "/hero/settler-hero-fallback.png",
  className = "",
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    // Check for prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      setUseFallback(true);
    }

    // Listener for changes in reduced motion preference
    const handler = (e: MediaQueryListEvent) => {
      setUseFallback(e.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  if (useFallback) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <img
          src={fallbackSrc}
          alt="Settler Hero Visual"
          className="w-full h-full object-cover"
          loading="eager"
        />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        src={videoSrc}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-full object-cover"
        onCanPlay={() => {
          videoRef.current?.play().catch(() => {
            // Auto-play failed, likely battery saver or user interaction required
            setUseFallback(true);
          });
        }}
        onError={() => setUseFallback(true)}
      />
      {/* Fallback image shown if video fails to load or play */}
      <noscript>
        <img
          src={fallbackSrc}
          alt="Settler Hero Visual"
          className="w-full h-full object-cover"
        />
      </noscript>
    </div>
  );
};

export default HeroMedia;
