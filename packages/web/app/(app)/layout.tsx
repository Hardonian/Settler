import React from 'react'

export const metadata = {
  title: 'Settler App',
  description: 'Settler app shell (authenticated) with Stitch UI facelift',
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  )
}
