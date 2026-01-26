import React from 'react'
import { StitchHeader } from '../../../../stitch_export/components/Header'
import { StitchFooter } from '../../../../stitch_export/components/Footer'

export const metadata = {
  title: 'Settler - Marketing',
  description: 'Stitch UI facelift for Settler.dev marketing site',
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <StitchHeader />
        <main className="min-h-screen">{children}</main>
        <StitchFooter />
      </body>
    </html>
  )
}
