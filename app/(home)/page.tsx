import Link from 'next/link';
import { RecipeCatalog } from '@/components/recipe-catalog';
import { RecipeCTA } from '@/components/recipe-cta';
import { kitUrl, naturateUrl } from '@/lib/shared';

export default function HomePage() {
  return <main className="mx-auto w-full max-w-5xl px-5 py-16 sm:py-24">
    <header className="max-w-3xl">
      <a href={naturateUrl} className="text-sm font-medium text-fd-muted-foreground">Agent Recipes by Naturate</a>
      <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-6xl">Build AI that does useful work.</h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-fd-muted-foreground">Practical guides for connecting services, coordinating agents and building tools your team can use. Understand the pattern, try the example, then adapt it to your own product.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <a href="#recipes" className="rounded-md bg-fd-primary px-5 py-3 text-sm font-medium text-fd-primary-foreground">Explore the recipes</a>
        <a href={kitUrl('home')} className="rounded-md border px-5 py-3 text-sm font-medium">Get all ten as one kit</a>
        <Link href="/docs/format" className="rounded-md px-2 py-3 text-sm font-medium underline underline-offset-4">How to use them</Link>
      </div>
      <p className="mt-6 text-sm text-fd-muted-foreground">Free to read. Evidence and limitations labelled. New guides start as drafts, not promises.</p>
    </header>
    <div id="recipes" className="mt-16 scroll-mt-20"><RecipeCatalog /></div>
    <RecipeCTA slug="library" />
  </main>;
}
