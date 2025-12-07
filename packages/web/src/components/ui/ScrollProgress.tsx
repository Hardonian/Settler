"use client";

import { useEffect, useState } from "react";

interface ScrollProgressProps {
  className?: string;
}

export function ScrollProgress({ className }: ScrollProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const scrollableHeight = documentHeight - windowHeight;
      const progressPercent = scrollableHeight > 0 
        ? (scrollTop / scrollableHeight) * 100 
        : 0;
      setProgress(progressPercent);
    };

    window.addEventListener("scroll", updateProgress);
    updateProgress();

    return () => window.removeEventListener("scroll", updateProgress);
  }, []);

  return (
    <div
      className={className}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: `${progress}%`,
        height: "2px",
        backgroundColor: "rgb(59, 130, 246)",
        zIndex: 9999,
        transition: "width 0.1s ease-out",
      }}
    />
  );
}
