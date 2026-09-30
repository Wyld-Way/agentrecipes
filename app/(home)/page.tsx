import Image from 'next/image';
import Link from 'next/link';
import { RecipeCatalog } from '@/components/recipe-catalog';
import { RecipeCTA } from '@/components/recipe-cta';
import { kitUrl, naturateUrl } from '@/lib/shared';

export default function HomePage() {
  return <main className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-24">
    <header className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
      <div>
        <a href={naturateUrl} className="font-display text-base font-semibold text-fd-primary">Agent Recipes by Naturate</a>
        <h1 className="mt-4 text-4xl font-medium tracking-tight text-fd-primary [text-wrap:balance] sm:text-5xl">Build AI that does useful work</h1>
        <p className="mt-6 text-xl leading-8 text-fd-muted-foreground">Practical guides for connecting services, making AI output reliable and running agents on real work. Each shows the pattern, a small example and how it fails.</p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a href="#recipes" className="rounded-full bg-fd-primary px-6 py-3 text-sm font-semibold text-fd-primary-foreground transition hover:opacity-90">Explore the recipes</a>
          <a href={kitUrl('home')} className="rounded-full border border-fd-border px-6 py-3 text-sm font-semibold text-fd-primary transition hover:bg-fd-accent">Get every guide as one kit</a>
        </div>
        <p className="mt-6 text-sm text-fd-muted-foreground">Free to read. <Link href="/docs/format" className="underline underline-offset-4">How to use them</Link></p>
      </div>
      <Image src="/brand/workbench.jpg" alt="Illustration of a workbench with hand tools laid out" width={1000} height={1000} priority sizes="(min-width: 1024px) 32rem, 100vw" className="mx-auto aspect-square w-full max-w-lg rounded-[2rem] object-cover" />
    </header>
    <div id="recipes" className="mt-24 scroll-mt-20"><RecipeCatalog /></div>
    <RecipeCTA slug="library" />
    <footer className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-fd-border pt-8 text-sm text-fd-muted-foreground">
      <p>© 2026 Naturate LLC. Guides under <a href="https://creativecommons.org/licenses/by-sa/4.0/" className="underline underline-offset-4">CC BY-SA 4.0</a>, code under <a href="https://www.apache.org/licenses/LICENSE-2.0" className="underline underline-offset-4">Apache 2.0</a>.</p>
      <a href={naturateUrl} className="font-semibold text-fd-primary">naturate.io</a>
    </footer>
  </main>;
}
