/**
 * Next.js Instrumentation
 * Called when Next.js starts up
 */

export async function register() {
  // Server-side instrumentation setup
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Node.js runtime initialization
    console.log("🚀 Next.js instrumentation registered (Node.js runtime)");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    // Edge runtime initialization
    console.log("🚀 Next.js instrumentation registered (Edge runtime)");
  }
}
