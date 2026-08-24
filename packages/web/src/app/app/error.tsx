"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ErrorBoundary() {
  const router = useRouter();

  useEffect(() => {
    // Log to error monitoring
    console.error("Application error boundary triggered");
    router.replace("/error");
  }, []);

  return null;
}
