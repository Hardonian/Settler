// Stub module for activation-funnel
// This is a server-side only module from @settler/api

export const trackActivationEvent = async (event: string, userId: string) => {
  console.warn("[STUB] trackActivationEvent called but @settler/api is not available in web build");
};

export const getActivationFunnel = async (userId: string) => {
  console.warn("[STUB] getActivationFunnel called but @settler/api is not available in web build");
  return { stage: "unknown", completed: false };
};
