# Agent Recipes by Naturate

Practical AI implementation guides: connect services, coordinate agents and build useful tools. Free to read, with evidence and limitations labelled. Naturate offers implementation help at https://www.naturate.io/contact.

## Public source of truth

`content/docs/*.mdx` is the canonical public content. The homepage and docs catalog both discover pages with `recipe: true` through the Fumadocs source loader. There is no separate homepage recipe list.

Builds read only this public repository. They do not discover or import a private sibling repository. The old `sync:recipes` and `sync:skills` commands now validate public artifacts rather than copying private files. The previously committed six guides and bundles remain available; public edits will not be overwritten by an office sync.

To add a guide, commit reviewed MDX, set `recipe: true` and an honest `maturity`, and add it to `content/docs/meta.json`. A draft can state that its downloadable skill or host test is not ready. Do not advertise a working installation that has not been verified.

## Publication boundary

Everything committed here, including a draft branch, issue, downloadable ZIP or git history, is public. Build exclusions and noindex do NOT make a public GitHub file private.

Share individually useful patterns, synthetic examples and public integration contracts. Do not commit internal prompts, agent rosters, operating playbooks, private evidence, credentials, customer data or commercial strategy. Review each public artifact before committing; never bulk-copy a private directory. Do not publish a redacted summary that still exposes private infrastructure or identifying data.

The public preparation check rejects internal filenames, credential-file names and symlinks, checks manifest text against served files, and repairs known escaped skill-component tags. It is not a complete secret scanner or ZIP-content audit. Inspect archive contents independently before release.

## Development

Use the Node version in `.nvmrc` and the committed lockfile.

```sh
npm ci
npm test
npm run types:check
npm run build
npm run dev
```

`prebuild` and `predev` run `scripts/prepare-public-library.mjs`. Builds require no access to an office repo. Existing skill bundles are committed under `public/skills`; their in-page text is in `lib/skill-manifest.json` and must match.

## Release

The deployed URL is configured by `NEXT_PUBLIC_SITE_URL`; the fallback remains the existing Vercel host. The intended Naturate subdomain must be attached, resolve correctly and pass HTTPS/link checks before changing that setting. `PUBLIC_INDEX=true` is a separate indexing release step. Do not conflate a draft PR, successful build, deployed preview and production launch.

Before launch: clean build and type check, rendered-page and download tests, independent recipe/evidence review, archive and content privacy review, licence clarification, host integration tests and a real contact-path check. The library does not assign a new blanket licence by this change; preserve and review existing file-specific terms.
