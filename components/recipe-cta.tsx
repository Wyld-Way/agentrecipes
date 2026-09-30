import { kitUrl, naturateUrl } from '@/lib/shared';

export function RecipeCTA({ slug }: { slug: string }) {
  const url = new URL('/contact', naturateUrl);
  url.searchParams.set('utm_source', 'agent-recipes');
  url.searchParams.set('utm_medium', 'recipe');
  url.searchParams.set('utm_content', slug);
  return <aside className="not-prose mt-16 rounded-3xl bg-dark-green px-6 py-10 text-white sm:px-10">
    <h2 className="text-2xl font-semibold text-white sm:text-3xl">The recipe is free. Naturate can build the production version with you.</h2>
    <p className="mt-4 max-w-xl leading-7 text-pale-green">We adapt a pattern to your product, connect it to the systems you already have, and leave your team with a working implementation they own.</p>
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <a href={url.toString()} className="inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-dark-green transition hover:bg-green">Tell us what you are building</a>
      <a href={kitUrl('recipe', slug)} className="inline-flex rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white">Get every guide as one kit</a>
    </div>
  </aside>;
}
