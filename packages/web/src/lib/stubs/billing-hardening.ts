// Stub module for billing-hardening
// This is a server-side only module from @settler/api

export const checkEntitlements = async (userId: string, feature: string) => {
  console.warn("[STUB] checkEntitlements called but @settler/api is not available in web build");
  return { allowed: true, reason: "stub" };
};

export const trackBillingEvent = async (event: string, data: any) => {
  console.warn("[STUB] trackBillingEvent called but @settler/api is not available in web build");
};
