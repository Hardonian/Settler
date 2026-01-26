import React from "react";
import { StitchHeader } from "../components/Header";
import { StitchFooter } from "../components/Footer";

export const metadata = {
  title: "Settler - Marketing",
  description: "Stitch UI facelift for Settler.dev marketing site",
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <StitchHeader />
        <main>{children}</main>
        <StitchFooter />
      </body>
    </html>
  );
}
