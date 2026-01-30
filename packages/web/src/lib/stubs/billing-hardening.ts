// Stub module for billing-hardening
// This is a server-side only module from @settler/api

export const checkEntitlements = async (_userId: string, _feature: string) => {
  console.warn("[STUB] checkEntitlements called but @settler/api is not available in web build");
  return { allowed: true, reason: "stub" };
};

export const trackBillingEvent = async (_event: string, _data: any) => {
  console.warn("[STUB] trackBillingEvent called but @settler/api is not available in web build");
};
