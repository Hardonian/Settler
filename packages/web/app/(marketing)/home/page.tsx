import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <section className="text-center max-w-4xl">
        <h1 className="text-4xl font-extrabold mb-4">Settler: Stitch UI facelift</h1>
        <p className="text-lg text-muted-foreground mb-6">Marketing surface powered by Stitch export. OSS-first, local-first reconciliation platform.</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/console" className="px-4 py-2 bg-primary text-primary-foreground rounded">Console</Link>
          <Link href="https://github.com/settler-dev/settler" className="px-4 py-2 bg-secondary text-secondary-foreground rounded">Star on GitHub</Link>
        </div>
      </section>
    </div>
  )
}
