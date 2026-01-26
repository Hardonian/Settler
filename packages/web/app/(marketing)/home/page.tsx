import React from 'react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <section className="py-20 px-6 text-center max-w-4xl mx-auto">
      <h1 className="text-4xl font-extrabold mb-4">Settler: Stitch UI facelift</h1>
      <p className="text-lg text-muted-foreground mb-6">Marketing surface powered by Stitch export. OSS-first, local-first reconciliation platform.</p>
      <div className="flex justify-center gap-4 flex-wrap">
        <Link href="/docs/quickstart" className="btn btn-primary">Run locally</Link>
        <Link href="https://github.com/settler-dev/settler" className="btn btn-secondary">Star on GitHub</Link>
        <Link href="/docs" className="btn">View docs</Link>
      </div>
    </section>
  )
}
