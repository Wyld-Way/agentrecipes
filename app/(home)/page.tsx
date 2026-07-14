import Link from 'next/link';
import { ArrowRight, FlaskConical, ScrollText, ShieldCheck } from 'lucide-react';
import { MaturityBadge } from '@/components/maturity-badge';

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-16 sm:py-24">
      <div className="w-full max-w-3xl">
        <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium text-fd-muted-foreground">
          Open recipe library
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
          Recipes for building proven AI and agent systems.
        </h1>
        <p className="mt-5 text-lg text-fd-muted-foreground">
          Plug-and-play guides you implement in your own stack. Each one is a
          proven system abstracted to its container — the decisions, the steps,
          the config shapes, the guardrails — with the content slots left open.
          Not our code. Yours to build.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 rounded-lg bg-fd-primary px-5 py-2.5 text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-90"
          >
            Browse the catalog
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/docs/format"
            className="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-fd-accent"
          >
            About the format
          </Link>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          <Feature
            icon={<ScrollText className="size-5" />}
            title="Container, not content"
            body="Templatized shapes with open slots. Implement it fresh in hours-to-days, without ever seeing ours."
          />
          <Feature
            icon={<ShieldCheck className="size-5" />}
            title="Shipped with receipts"
            body="Real production numbers, real failure modes, real costs behind every claim. No receipts, and it's labeled a draft."
          />
          <Feature
            icon={<FlaskConical className="size-5" />}
            title="Honest maturity"
            body="Every recipe carries a maturity signal so you know how much evidence stands behind it."
          />
        </div>

        <div className="mt-16 rounded-xl border bg-fd-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">LLM prompt ops</h2>
              <p className="mt-1 text-sm text-fd-muted-foreground">
                Managed prompts, layered evals, and fail-open delivery for LLM
                generation features on a live path.
              </p>
              <div className="mt-3">
                <MaturityBadge level="internal" />
              </div>
            </div>
            <Link
              href="/docs/llm-prompt-ops"
              className="inline-flex items-center gap-2 text-sm font-medium text-fd-primary hover:underline"
            >
              Read the recipe
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div>
      <div className="flex size-10 items-center justify-center rounded-lg border bg-fd-card text-fd-primary">
        {icon}
      </div>
      <h3 className="mt-4 text-sm font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-fd-muted-foreground">{body}</p>
    </div>
  );
}
