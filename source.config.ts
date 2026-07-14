import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';

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
    schema: pageSchema,
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
