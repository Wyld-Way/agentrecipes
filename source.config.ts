import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { z } from 'zod';

// Extend the page frontmatter with the fields that drive JSON-LD (a recipe IS a
// schema.org HowTo) and use-case framing. All optional, so non-recipe pages
// (the catalog, the format reference) validate unchanged.
const recipePageSchema = pageSchema.extend({
  recipe: z.boolean().optional(),
  system: z.string().optional(),
  maturity: z
    .enum(['draft', 'internal', 'field-tested', 'proven'])
    .optional(),
  steps: z
    .array(z.object({ name: z.string(), text: z.string() }))
    .optional(),
});

// You can customize Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.dev/docs/mdx/collections
export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    // HARD CONSTRAINT (agentrecipes #199/#185): internal evidence ledgers
    // (`RECEIPTS-internal.md` / any `*-internal.md`) must NEVER be rendered or
    // published. They exist beside recipes and stay internal. We exclude them
    // at the BUILD layer here (negative globs, matched by tinyglobby), not just
    // by not linking — so even if an internal file is ever copied into the
    // content dir, it will not become a page. Verified by a 404 on its path.
    files: [
      '**/*.mdx',
      '**/*.md',
      '!**/*-internal.md',
      '!**/*-internal.mdx',
      '!**/RECEIPTS-internal.md',
    ],
    schema: recipePageSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({
  mdxOptions: {
    // MDX options
  },
});
