import React from "react";
import "./globals.css";

export const metadata = {
  title: "Settler",
  description: "OSS-first, local-first reconciliation platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
