# Agent Recipes

A public catalog of plug-and-play recipes for building proven AI and agent
systems. Each recipe is one proven system abstracted to its container — the
decisions, the steps, the config shapes, the guardrails — with the content slots
left open. Built on [Fumadocs](https://fumadocs.dev) + Next.js, deployed on
Vercel.

Seed: agentrecipes (office #199 / #185). Owner: seed-keeper. Web build: mason.

## Two hard constraints

1. **Internal evidence files never render.** Any `*-internal.md` /
   `RECEIPTS-internal.md` beside a recipe is excluded at the build layer — see
   the `files` negative-glob in `source.config.ts`. These files are also simply
   never seeded into `content/docs`. Every would-be path 404s.
2. **noindex until go-live.** The site ships with `robots: noindex` and a
   `Disallow: /` robots.txt. Making it publicly indexed is an outward-publish
   gate (Johan's call). To go live, set the env var **`PUBLIC_INDEX=true`** in
   the Vercel project (Production) and redeploy. That flips both the meta tag and
   robots.txt to allow indexing.

## Content

Recipes live as MDX in `content/docs/`. Add a recipe by dropping a `<slug>.mdx`
with `title` + `description` frontmatter and linking it from the catalog
(`content/docs/index.mdx`) and `meta.json`. Use
`<MaturityBadge level="draft|internal|field-tested|proven" />` for the maturity
signal.

## Develop

Requires Node 20.19+ (22 recommended).

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
```

## Structure

| Route                     | Description                                     |
| ------------------------- | ----------------------------------------------- |
| `app/(home)`              | Landing page.                                   |
| `app/docs`                | The catalog + recipe pages.                     |
| `app/api/search/route.ts` | Orama full-text search handler.                 |
| `content/docs`            | Recipe MDX content.                             |
| `source.config.ts`        | Content source config + internal-file glob-exclude. |
