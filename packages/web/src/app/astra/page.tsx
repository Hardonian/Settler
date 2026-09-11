"use client";

import SiderealPage from "../sidereal/page";

/**
 * Backward compatibility route forwarding /astra to SiderealPage.
 * Astra has been rebranded to Sidereal to eliminate OpenAI brand collision.
 */
export default function AstraPage() {
  return <SiderealPage />;
}
