import Link from 'next/link';
import { source } from '@/lib/source';

// Grouped by the job a reader has, in the same order as naturate.io/recipes.
const groups = [
  { title: 'Connect AI to your product', note: 'Let agents use what you already have, through a boundary you control.', slugs: ['service-to-mcp', 'ai-native-admin', 'pointmoon-grounding'] },
  { title: 'Make AI output reliable', note: 'For features where a wrong or late answer costs you trust.', slugs: ['llm-prompt-ops', 'prove-a-change', 'grounded-generation', 'voice-ai-pipeline', 'when-to-say-nothing'] },
  { title: 'Run agents on real work', note: 'Several agents, real tasks, and a person who still decides what goes out.', slugs: ['cross-agent-handoff', 'scoped-autonomous-operations', 'shared-agent-memory', 'agent-worker-fleet', 'agent-lanes', 'two-agents-one-repo', 'agent-safe-releases', 'honest-agent-reports'] },
];

export function RecipeCatalog() {
  const recipes = source.getPages().filter((page) => page.data.recipe === true);
  const bySlug = new Map(recipes.map((page) => [page.slugs.join('/'), page]));
  const grouped = new Set(groups.flatMap((group) => group.slugs));
  const rest = recipes.filter((page) => !grouped.has(page.slugs.join('/')));
  const sections = [
    ...groups.map((group) => ({ ...group, pages: group.slugs.flatMap((slug) => bySlug.get(slug) ?? []) })),
    { title: 'More guides', note: '', pages: rest },
  ].filter((section) => section.pages.length > 0);

  return <div className="not-prose space-y-16">
    {sections.map((section) => <section key={section.title} className="grid gap-x-12 gap-y-6 lg:grid-cols-3">
      <div>
        <h2 className="text-2xl font-semibold text-fd-primary">{section.title}</h2>
        {section.note && <p className="mt-3 leading-7 text-fd-muted-foreground">{section.note}</p>}
      </div>
      <ul className="lg:col-span-2">
        {section.pages.map((page) => <li key={page.url} className="border-t border-fd-border">
          <Link href={page.url} className="group block py-6 focus-visible:outline-2 focus-visible:outline-offset-4">
            <h3 className="text-xl font-semibold text-fd-primary decoration-green underline-offset-4 group-hover:underline">
              {page.data.title}<span className="ml-2 inline-block transition group-hover:translate-x-1" aria-hidden="true">→</span>
            </h3>
            <p className="mt-2 leading-7 text-fd-muted-foreground">{page.data.description}</p>
          </Link>
        </li>)}
      </ul>
    </section>)}
  </div>;
}
