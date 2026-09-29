import Link from 'next/link';
import { source } from '@/lib/source';
import { MaturityBadge } from '@/components/maturity-badge';

export function RecipeCatalog() {
  const recipes = source.getPages().filter((page) => page.data.recipe === true);
  const groups = [
    { title: 'Implementation patterns', note: 'Existing recipes with evidence from their original implementation. Check each guide’s limits before using it.', pages: recipes.filter((page) => page.data.maturity && page.data.maturity !== 'draft') },
    { title: 'New and experimental guides', note: 'Drafts to review and try. These are not independently field-tested systems.', pages: recipes.filter((page) => !page.data.maturity || page.data.maturity === 'draft') },
  ];
  return <div className="not-prose space-y-12">
    {groups.filter((group) => group.pages.length > 0).map((group) => <section key={group.title}>
      <h2 className="text-2xl font-semibold tracking-tight">{group.title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-fd-muted-foreground">{group.note}</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {group.pages.sort((a, b) => a.data.title.localeCompare(b.data.title)).map((page) => <Link key={page.url} href={page.url} className="group flex flex-col rounded-xl border bg-fd-card p-6 transition-colors hover:border-fd-primary/50 focus-visible:outline-2 focus-visible:outline-offset-4">
          <MaturityBadge level={page.data.maturity ?? 'draft'} />
          <h3 className="mt-4 text-lg font-semibold leading-snug">{page.data.title}</h3>
          <p className="mt-3 text-sm leading-6 text-fd-muted-foreground">{page.data.description}</p>
          <span className="mt-auto pt-5 text-sm font-medium">Read the recipe <span aria-hidden="true">→</span></span>
        </Link>)}
      </div>
    </section>)}
  </div>;
}
