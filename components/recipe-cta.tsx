import { kitUrl, naturateUrl } from '@/lib/shared';

export function RecipeCTA({ slug }: { slug: string }) {
  const url = new URL('/contact', naturateUrl);
  url.searchParams.set('utm_source', 'agent-recipes');
  url.searchParams.set('utm_medium', 'recipe');
  url.searchParams.set('utm_content', slug);
  return <aside className="not-prose mt-12 rounded-xl border bg-fd-card p-6">
    <p className="text-xs font-medium uppercase tracking-wide text-fd-muted-foreground">Build it with Naturate</p>
    <h2 className="mt-3 text-xl font-semibold">Put this pattern to work in your product.</h2>
    <p className="mt-3 max-w-xl text-sm leading-6 text-fd-muted-foreground">Naturate helps teams design and build useful AI integrations, internal tools and digital experiences. Start with one workflow, a clear result and a way to test it.</p>
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <a href={url.toString()} className="inline-flex rounded-md bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground">Talk about your project <span className="ml-2" aria-hidden="true">→</span></a>
      <a href={kitUrl('recipe', slug)} className="inline-flex rounded-md border px-4 py-2 text-sm font-medium">Get every guide as one kit</a>
    </div>
  </aside>;
}
