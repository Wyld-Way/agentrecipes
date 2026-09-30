# Contributing a recipe

Start with one useful job, not a framework or an entire organization. Explain who needs it, what it produces, what it does not do and how someone can test it.

## Author once

Add `content/docs/<slug>.mdx` and an entry in `content/docs/meta.json`. Set `title`, `description`, `recipe: true` and `maturity: draft|internal|field-tested|proven`. The homepage and documentation catalog discover the same public pages. Builds do not import private repositories or overwrite community content.

A complete implementation recipe has readable instructions, a scoped SKILL.md and a reference implementation with a failure test. A draft may be incomplete, but must name the missing pieces and must not advertise unverified downloads, installations or host compatibility. Put reviewed public files under `public/skills/<slug>/`; packaged downloads additionally need a matching manifest and an independently checked ZIP.

## Evidence

- Draft: implementation or testing is incomplete.
- In production: evidence from the original implementation, not independent adoption.
- Field-tested: another person implemented the recipe with recorded results.
- Proven: evidence from at least two independent implementations.

State test date, versions, environment, sample size and limitations when relevant. A configured schedule is not a completed run; an API response is not proof of correctness; a timeout test is not a production reliability measurement. Settings and chosen thresholds are not outcome evidence. Do not claim that all recipes in the library are proven.

## Publication and privacy

This repository is public, including branches, issues, files excluded from the site and git history. NEVER commit private evidence with an `-internal` suffix and assume it is hidden. Noindex is not privacy.

Use synthetic data and independently written examples. Share one useful pattern, not a private operating playbook. Keep internal role prompts, architecture details unnecessary for the example, customer information, proprietary evaluations, credentials and commercial plans out of submissions. Public material from third parties needs appropriate attribution and compatible reuse terms. State the intended licence explicitly; do not infer a licence from public visibility.

## Review before release

Run `npm test`, `npm run types:check` and `npm run build`. Test the actual rendered guide, its download links and its minimal example. Review tool permissions, approval boundaries, prompt-injection handling, time/budget limits and retry behaviour. Test each claimed host separately. Keep claims and maturity aligned with the resulting evidence.

For a remotely hosted recipe, open an issue with its public URL, purpose, licence and evidence. Listing is reviewed manually. There is no automatic ingestion, grading or publication service.
