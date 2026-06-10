"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function useReferralTracking() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      try {
        localStorage.setItem("settler_referral_code", ref);
      } catch (e) {
        // Ignore local storage errors in incognito mode
      }
    }
  }, [searchParams]);
}
