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
          Not our code. Yours to build. And every claim carries receipts: real
          production numbers, real failure modes, real costs.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 rounded-lg bg-fd-primary px-5 py-2.5 text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-90"
          >
            Browse recipes by what you're building
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/docs/format"
            className="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-fd-accent"
          >
            How recipes work
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

        <section className="mt-20">
          <h2 className="text-2xl font-bold tracking-tight">
            What are you trying to build?
          </h2>
          <p className="mt-2 text-fd-muted-foreground">
            Recipes are organized by the job you're doing, not by system name.
          </p>

          <UseCase title="Running LLMs in production">
            <RecipeCard
              problem="Keep an AI feature reliable in production while you keep changing the prompt"
              system="LLM prompt ops"
              body="Change prompts without a deploy, every output auto-checked in the background, never hard-fails when the provider blips, and prove a change is better before it ships."
              maturity="internal"
              href="/docs/llm-prompt-ops"
            />
          </UseCase>

          <UseCase title="Building agents">
            <ComingSoon body="Recipes for autonomous and semi-autonomous agent systems, harvested from proven origins as they're written up." />
          </UseCase>
        </section>
      </div>
    </main>
  );
}

function UseCase({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-10 first:mt-8">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-fd-muted-foreground">
        {title}
      </h3>
      <div className="mt-3 grid gap-4">{children}</div>
    </div>
  );
}

function RecipeCard({
  problem,
  system,
  body,
  maturity,
  href,
}: {
  problem: string;
  system: string;
  body: string;
  maturity: 'draft' | 'internal' | 'field-tested' | 'proven';
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-xl border bg-fd-card p-6 transition-colors hover:border-fd-primary/40"
    >
      <div className="flex items-start justify-between gap-4">
        <h4 className="text-lg font-semibold leading-snug group-hover:text-fd-primary">
          {problem}
        </h4>
        <ArrowRight className="mt-1 size-5 shrink-0 text-fd-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-fd-primary" />
      </div>
      <p className="mt-1 text-sm font-medium text-fd-muted-foreground">
        Recipe: {system}
      </p>
      <p className="mt-2 text-sm text-fd-muted-foreground">{body}</p>
      <div className="mt-3">
        <MaturityBadge level={maturity} />
      </div>
    </Link>
  );
}

function ComingSoon({ body }: { body: string }) {
  return (
    <div className="rounded-xl border border-dashed bg-fd-card/50 p-6">
      <p className="text-sm text-fd-muted-foreground">{body}</p>
    </div>
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
