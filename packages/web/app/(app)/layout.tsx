"use client";
import React from 'react'
import { StitchHeader } from '../../../../stitch_export/components/Header'
import { StitchFooter } from '../../../../stitch_export/components/Footer'

// App shell layout for authenticated routes, skinned with Stitch UI.
export const metadata = {
  title: 'Settler App',
  description: 'Settler app shell (authenticated) with Stitch UI facelift',
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <StitchHeader />
        <main className="flex-1 w-full mx-auto px-4 py-6">{children}</main>
        <StitchFooter />
      </body>
    </html>
  )
}
