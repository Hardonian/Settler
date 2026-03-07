"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Circle, Dot } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const capabilityChips = [
  "Replay any run",
  "Explain mismatches fast",
  "Export verifiable evidence",
  "Policy-checked operations",
  "Tenant-safe by design",
];

const stackLabels = [
  "High-risk mismatches",
  "Policy-check failures",
  "Evidence required",
  "Variance auto-classified",
  "Awaiting operator review",
];

const feedLines = [
  "[11:42:06] Reconciliation input normalized",
  "[11:42:07] Policy checks evaluated",
  "[11:42:08] Trace ID attached to mismatch",
  "[11:42:09] Evidence bundle generated",
  "[11:42:10] Review decision committed",
];

const protocolCards = [
  {
    step: "01",
    id: "ingest-normalize",
    title: "Ingest and normalize records",
    description:
      "Ingest records from source systems and map them into canonical structures with deterministic transforms.",
  },
  {
    step: "02",
    id: "route-resolve",
    title: "Compare and route mismatches",
    description:
      "Compare record states, apply routing policy, and move exceptions to controlled queues with explicit ownership.",
  },
  {
    step: "03",
    id: "prove-learn",
    title: "Review and resolve with evidence",
    description:
      "Attach evidence artifacts and trace IDs so operators can explain every decision in review.",
  },
  {
    step: "04",
    id: "replay-export",
    title: "Replay and export proof",
    description:
      "Replay the exact run and export evidence bundles for audits, incident response, and handoffs.",
  },
];

function ExceptionStackCard({ reducedMotion }: { reducedMotion: boolean }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % stackLabels.length);
    }, 3000);

    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  const visible = useMemo(
    () => [
      stackLabels[index],
      stackLabels[(index + 1) % stackLabels.length],
      stackLabels[(index + 2) % stackLabels.length],
    ],
    [index]
  );

  return (
    <article className="rounded-[2rem] border border-white/15 bg-white/[0.04] p-6 shadow-[0_40px_100px_-60px_rgba(0,0,0,0.8)] backdrop-blur-md">
      <h3 className="text-xl font-semibold text-white">Mismatch Queue</h3>
      <p className="mt-2 text-sm text-slate-300">
        Prioritized queues reorder by policy outcome so teams can resolve the riskiest mismatches first.
      </p>
      <div className="relative mt-8 h-52">
        {visible.map((label, slot) => (
          <div
            key={`${label}-${slot}`}
            className="absolute inset-x-2 rounded-2xl border border-white/20 bg-slate-950/70 p-4 transition-all duration-700"
            style={{
              transform: `translateY(${slot * 20}px) scale(${1 - slot * 0.06})`,
              opacity: 1 - slot * 0.2,
              zIndex: 20 - slot,
            }}
          >
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-400">
              Queue State
            </p>
            <p className="mt-3 text-base font-medium text-white">{label}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function EvidenceFeedCard({ reducedMotion }: { reducedMotion: boolean }) {
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;

    const typingTimer = window.setInterval(() => {
      setCharIndex((prev) => {
        const activeLine = feedLines[lineIndex] ?? "";
        const target = activeLine.length;
        if (prev >= target) {
          window.setTimeout(() => {
            setLineIndex((curr) => (curr + 1) % feedLines.length);
            setCharIndex(0);
          }, 700);
          return prev;
        }
        return prev + 1;
      });
    }, 40);

    return () => window.clearInterval(typingTimer);
  }, [lineIndex, reducedMotion]);

  const renderedLines = reducedMotion
    ? feedLines
    : [
        ...feedLines.slice(Math.max(0, lineIndex - 3), lineIndex),
        (feedLines[lineIndex] ?? "").slice(0, charIndex),
      ];

  return (
    <article className="rounded-[2rem] border border-white/15 bg-white/[0.04] p-6 shadow-[0_40px_100px_-60px_rgba(0,0,0,0.8)] backdrop-blur-md">
      <h3 className="text-xl font-semibold text-white">Evidence Feed</h3>
      <p className="mt-2 text-sm text-slate-300">
        Live evidence events show what changed, why it changed, and when it was committed.
      </p>
      <div className="mt-8 rounded-2xl border border-emerald-400/20 bg-slate-950/80 p-4 font-mono text-xs text-emerald-200">
        <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-emerald-300/80">
          <span className="relative inline-flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>
          Evidence stream
        </div>
        <div className="space-y-2">
          {renderedLines.map((line, idx) => (
            <p key={`${line}-${idx}`} className="truncate">
              {line}
              {idx === renderedLines.length - 1 && !reducedMotion ? (
                <span className="ml-1 inline-block h-3 w-1 animate-pulse bg-emerald-200 align-middle" />
              ) : null}
            </p>
          ))}
        </div>
      </div>
    </article>
  );
}

function SchedulerCard({ reducedMotion }: { reducedMotion: boolean }) {
  const [cursorStep, setCursorStep] = useState(0);
  const cells = [1, 3, 8, 11];

  useEffect(() => {
    if (reducedMotion) return;
    const timer = window.setInterval(() => {
      setCursorStep((prev) => (prev + 1) % cells.length);
    }, 1200);

    return () => window.clearInterval(timer);
  }, [cells.length, reducedMotion]);

  const cursorIndex = cells[cursorStep];

  return (
    <article className="rounded-[2rem] border border-white/15 bg-white/[0.04] p-6 shadow-[0_40px_100px_-60px_rgba(0,0,0,0.8)] backdrop-blur-md">
      <h3 className="text-xl font-semibold text-white">Review Scheduler</h3>
      <p className="mt-2 text-sm text-slate-300">
        Review windows align to routing windows so approvals happen on schedule, not in spreadsheet fire drills.
      </p>
      <div className="mt-8 rounded-2xl border border-white/15 bg-slate-950/80 p-4">
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 12 }).map((_, idx) => {
            const active = idx === cursorIndex;
            return (
              <div
                key={idx}
                className={`rounded-lg border p-2 text-center text-xs transition-all ${
                  active
                    ? "border-cyan-300 bg-cyan-300/20 text-cyan-100"
                    : "border-white/15 bg-white/[0.03] text-slate-400"
                }`}
              >
                D{idx + 1}
              </div>
            );
          })}
        </div>
        <button
          type="button"
          className="mt-4 w-full rounded-xl border border-cyan-300/40 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100"
        >
          Commit Review Cadence
        </button>
      </div>
    </article>
  );
}

function ProtocolVisual({ index }: { index: number }) {
  if (index === 0) {
    return (
      <svg
        viewBox="0 0 320 220"
        className="h-52 w-full"
        role="img"
        aria-label="Verification geometry"
      >
        <circle cx="160" cy="110" r="78" fill="none" stroke="rgba(148,163,184,0.4)" />
        <circle cx="160" cy="110" r="54" fill="none" stroke="rgba(56,189,248,0.7)" />
        <circle cx="160" cy="110" r="28" fill="none" stroke="rgba(34,211,238,0.9)" />
        <path d="M84 112h152" stroke="rgba(148,163,184,0.5)" />
        <path d="M160 32v156" stroke="rgba(148,163,184,0.5)" />
      </svg>
    );
  }

  if (index === 1) {
    return (
      <svg
        viewBox="0 0 320 220"
        className="h-52 w-full"
        role="img"
        aria-label="Scanning policy grid"
      >
        {Array.from({ length: 8 }).map((_, row) => (
          <path key={`r-${row}`} d={`M30 ${30 + row * 22}h260`} stroke="rgba(148,163,184,0.25)" />
        ))}
        {Array.from({ length: 10 }).map((_, col) => (
          <path key={`c-${col}`} d={`M${30 + col * 28} 30v154`} stroke="rgba(148,163,184,0.25)" />
        ))}
        <rect x="30" y="84" width="260" height="22" fill="rgba(34,211,238,0.2)" />
        <rect x="30" y="106" width="260" height="6" fill="rgba(34,211,238,0.6)" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 320 220" className="h-52 w-full" role="img" aria-label="Audit signal path">
      <path
        d="M20 150 C70 70, 120 180, 170 100 S250 130, 300 60"
        fill="none"
        stroke="rgba(34,211,238,0.9)"
        strokeWidth="3"
      />
      <path
        d="M20 170 C70 90, 120 200, 170 120 S250 150, 300 80"
        fill="none"
        stroke="rgba(148,163,184,0.55)"
        strokeWidth="2"
      />
      {[40, 100, 180, 250].map((x) => (
        <circle key={x} cx={x} cy={140 - (x % 3) * 12} r="6" fill="rgba(56,189,248,0.8)" />
      ))}
    </svg>
  );
}

export default function Home() {
  const reducedMotion = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main id="main-content" className="relative overflow-x-clip bg-[#020617] text-slate-100">
      <div
        aria-hidden="true"
        className="noise-overlay pointer-events-none fixed inset-0 z-0 opacity-30"
      />

      <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
        <nav
          className={`flex w-full max-w-4xl items-center justify-between rounded-full border px-3 py-2 transition-all duration-500 md:px-5 ${
            scrolled
              ? "border-white/20 bg-slate-950/75 shadow-[0_25px_80px_-45px_rgba(34,211,238,0.9)] backdrop-blur-xl"
              : "border-white/10 bg-slate-900/30"
          }`}
          aria-label="Primary"
        >
          <Link href="/" className="px-3 text-sm font-semibold tracking-[0.16em] text-white">
            SETTLER
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            {[
              { href: "#product", label: "Product" },
              { href: "#architecture", label: "Architecture" },
              { href: "#evidence", label: "Evidence" },
              { href: "/docs", label: "Docs" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-full px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <Link
            href="/contact"
            className="rounded-full border border-cyan-300/50 bg-cyan-300/15 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/25"
          >
            Book a Demo
          </Link>
        </nav>
      </header>

      <section className="relative flex min-h-screen items-end pt-28" id="product">
        <Image
          src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1800&q=80"
          alt="Control room style operations environment"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(125deg,rgba(15,23,42,0.35)_0%,rgba(2,6,23,0.85)_58%,rgba(2,6,23,0.98)_100%)]" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-16 md:pb-24">
          <div className="max-w-3xl">
            <p className="mb-4 text-xs uppercase tracking-[0.28em] text-cyan-200/80">
              Open-source reconciliation engine
            </p>
            <h1 className="text-5xl font-bold leading-[0.95] text-white sm:text-6xl md:text-7xl">
              Reconcile the
              <span className="mt-2 block font-serif text-6xl italic font-medium text-cyan-100 sm:text-7xl md:text-8xl">
                Truth.
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-base text-slate-200 sm:text-lg">
              Settler helps engineering, finance, and operations teams reconcile faster, explain mismatches, and prove every result.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="/architecture"
                className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
              >
                See How It Works <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center rounded-full border border-white/35 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Read Docs
              </Link>
            </div>
          </div>
          <div className="mt-12 flex flex-wrap gap-3" id="evidence">
            {capabilityChips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-white/20 bg-black/35 px-4 py-2 text-xs uppercase tracking-[0.12em] text-slate-200"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-20 md:py-24">
        <div className="grid gap-6 lg:grid-cols-3">
          <ExceptionStackCard reducedMotion={reducedMotion} />
          <EvidenceFeedCard reducedMotion={reducedMotion} />
          <SchedulerCard reducedMotion={reducedMotion} />
        </div>
      </section>

      <section
        className="relative my-12 overflow-hidden border-y border-white/10 bg-slate-950/80 py-20"
        id="architecture"
      >
        <Image
          src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80"
          alt="Abstract infrastructure network"
          fill
          className="object-cover opacity-15"
        />
        <div className="absolute inset-0 bg-slate-950/75" />
        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
          <p className="text-sm text-slate-300">How Settler works in practice</p>
          <p className="mt-6 text-3xl font-semibold leading-tight text-white sm:text-5xl">
            Run reconciliation, inspect divergences, and
            <span className="text-cyan-300"> prove outcomes with replayable evidence.</span>
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-8 px-6 py-20 md:py-24">
        {protocolCards.map((card, index) => (
          <article
            key={card.id}
            className="sticky top-24 grid gap-8 rounded-[2.25rem] border border-white/15 bg-slate-900/70 p-8 backdrop-blur-xl md:grid-cols-2 md:p-12"
            style={{
              transform: `scale(${1 - index * 0.03})`,
              opacity: 1 - index * 0.12,
            }}
          >
            <div>
              <p className="font-mono text-xs tracking-[0.2em] text-cyan-300">STEP {card.step}</p>
              <h3 className="mt-4 text-3xl font-semibold text-white">{card.title}</h3>
              <p className="mt-4 max-w-md text-slate-300">{card.description}</p>
            </div>
            <div className="rounded-3xl border border-white/15 bg-slate-950/60 p-4">
              <ProtocolVisual index={index} />
            </div>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 md:py-24">
        <div className="rounded-[2.5rem] border border-white/15 bg-slate-900/70 p-6 shadow-[0_30px_110px_-70px_rgba(15,23,42,1)] md:p-10">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">
              Control plane showcase
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
              Operational surface, not dashboard theater
            </h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-3xl border border-white/15 bg-slate-950/80 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-100">Reconciliation Queue</h3>
                <span className="rounded-full border border-amber-300/40 px-3 py-1 text-xs text-amber-200">
                  Routed to review
                </span>
              </div>
              <div className="space-y-3 text-sm">
                {[
                  ["Trace ID", "trc_7f9a2d"],
                  ["Source system", "Stripe + NetSuite"],
                  ["Unmatched amount", "$42,190.18"],
                  ["Policy result", "Tolerance exceeded"],
                  ["Evidence attached", "6 artifacts"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
                  >
                    <span className="text-slate-400">{label}</span>
                    <span className="font-mono text-slate-100">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-white/15 bg-slate-950/70 p-5">
                <h3 className="text-sm font-medium text-slate-100">Policy Rule Inspector</h3>
                <pre className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-slate-950 p-4 text-xs text-cyan-100">
                  {`if amount_delta > 0.50 and source_age > 24h
  route: reviewer:ops-finance
  require: evidence_bundle=true
  status: review_required`}
                </pre>
              </div>
              <div className="rounded-3xl border border-white/15 bg-slate-950/70 p-5">
                <h3 className="text-sm font-medium text-slate-100">Audit Trail</h3>
                <ul className="mt-3 space-y-2 text-xs text-slate-300">
                  {[
                    "Canonical record created",
                    "Policy routed to ops-finance",
                    "Evidence hash committed",
                    "Reviewer decision pending",
                  ].map((event) => (
                    <li key={event} className="flex items-center gap-2">
                      <Dot className="h-4 w-4 text-cyan-300" />
                      {event}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="rounded-[2.25rem] border border-white/15 bg-slate-900/70 p-8 md:p-10">
          <h2 className="text-3xl font-semibold text-white">Get started in minutes</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {(
              [
                [
                  "See the architecture",
                  "/architecture",
                  "Understand deterministic runs, policy checks, and evidence flow.",
                ],
                [
                  "Run the quickstart",
                  "/docs",
                  "Install, run demo data, replay a run, and inspect evidence.",
                ],
                [
                  "Open the live demo",
                  "/demo",
                  "Walk through reconciliation, mismatches, and evidence without auth.",
                ],
              ] as const
            ).map(([title, href, text]) => (
              <Link
                key={title}
                href={href}
                className="rounded-3xl border border-white/15 bg-slate-950/70 p-6 transition hover:border-cyan-300/50 hover:bg-slate-950"
              >
                <p className="text-lg font-medium text-white">{title}</p>
                <p className="mt-2 text-sm text-slate-300">{text}</p>
                <p className="mt-6 inline-flex items-center gap-2 text-sm text-cyan-200">
                  Open <ArrowRight className="h-4 w-4" />
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-slate-950 px-6 py-12">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-4">
          <div>
            <p className="text-lg font-semibold tracking-[0.14em] text-white">SETTLER</p>
            <p className="mt-3 text-sm text-slate-300">
              Open-source reconciliation engine with replayable runs and verifiable evidence.
            </p>
            <div className="mt-6 flex items-center gap-2 text-xs font-mono text-emerald-200">
              <Circle className="h-2.5 w-2.5 fill-emerald-400 text-emerald-400 animate-pulse" />
              System Operational
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Product</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-slate-200">
              <Link href="/product">Overview</Link>
              <Link href="/architecture">Architecture</Link>
              <Link href="/pricing">Pricing</Link>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Resources</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-slate-200">
              <Link href="/docs">Docs</Link>
              <Link href="/specs/openapi.yaml">API</Link>
              <Link href="/status">Status</Link>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Company</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-slate-200">
              <Link href="/legal">Legal</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/contact">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
