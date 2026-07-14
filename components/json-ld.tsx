import { appName } from '@/lib/shared';

type Step = { name: string; text: string };

/**
 * schema.org JSON-LD for a recipe page. A recipe IS a HowTo — the numbered
 * steps map to HowToStep. Non-recipe pages get TechArticle. Emitted as a script
 * tag so search engines can read structured data even while the site is
 * noindex-gated (the tags are ready; go-live is one PUBLIC_INDEX flip).
 */
export function RecipeJsonLd({
  url,
  title,
  description,
  system,
  steps,
}: {
  url: string;
  title: string;
  description?: string;
  system?: string;
  steps?: Step[];
}) {
  const data =
    steps && steps.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: title,
          description,
          url,
          ...(system ? { about: system } : {}),
          publisher: { '@type': 'Organization', name: appName },
          step: steps.map((s, i) => ({
            '@type': 'HowToStep',
            position: i + 1,
            name: s.name,
            text: s.text,
            url: `${url}#the-recipe`,
          })),
        }
      : {
          '@context': 'https://schema.org',
          '@type': 'TechArticle',
          headline: title,
          description,
          url,
          publisher: { '@type': 'Organization', name: appName },
        };

  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe to inline; no user input reaches this.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
