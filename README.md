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

Recipes are single-sourced from the private `wyldway-office` repo
(office#202) — `scripts/sync-recipes.mjs` reads every
`../wyldway-office/recipes/<slug>/RECIPE.md` and GENERATES this site's
`content/docs/<slug>.mdx`, `content/docs/meta.json` (sidebar order), and
`content/docs/index.mdx` (catalog cards, grouped by category). Nobody
hand-writes recipe `.mdx` here anymore.

**To add a recipe:** write `RECIPE.md` in the office repo (see
`wyldway-office/recipes/FORMAT.md`), optionally add the six "site
presentation" frontmatter fields it documents (`category`, `icon`,
`system_short`, `description`, `origin_short`, `maturity_note` — all
optional, all have sane defaults), then run `npm run sync:recipes` (or just
`npm run build` / `npm run dev` — it's wired into `prebuild`/`predev`). The
site page, sidebar entry, and catalog card all appear with no further
hand-editing.

**Sibling-repo contract:** `wyldway-office` is private and not present in the
Vercel build environment. `sync-recipes.mjs` no-ops when it can't find the
office repo (checks `../wyldway-office`, override with `WYLDWAY_OFFICE_DIR`)
and the build then uses whatever `content/docs/*.mdx` is already committed —
so a maintainer regenerates and commits locally, and Vercel just builds the
committed output. Same pattern `scripts/sync-skills.mjs` already used for the
downloadable skill bundles.

Use `<MaturityBadge level="draft|internal|field-tested|proven" />` for the
maturity signal (set automatically by the generator from `RECIPE.md`'s
`maturity` field).

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
