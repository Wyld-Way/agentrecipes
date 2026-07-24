# Contributing a recipe

agentrecipes is a curated **index**, not a monolithic host — the
[skills.sh](https://skills.sh) pattern. We rank and grade; you can host your
own recipe in your own repo, or add it directly here. Either way it's held to
the same bar: **receipts or the draft label.**

## The bar (same one we hold ourselves to)

Every recipe in this catalog — ours or yours — follows the format defined in
[`content/docs/format.mdx`](content/docs/format.mdx) (mirrored from the
internal `FORMAT.md` standard this catalog is built against). The short
version:

- **The outsider test.** The recipe's name is the reader's problem, in their
  words — not your internal name for the system. "LLM prompt ops" is a slug;
  "Keep an AI feature reliable in production while you keep changing the
  prompt" is the name. If someone who's never heard your internal vocabulary
  can't tell what it's for and whether it's for them from the name and the
  first paragraph alone, it needs a rewrite before anything else.
- **Receipts or the draft label — no exceptions, including for us.** A recipe
  ships with an evidence ledger: real numbers, real failure modes, real costs,
  each one cited or marked `ESTIMATE`. No production evidence yet? Fine — ship
  it as `maturity: draft` and say so. What's not fine is a recipe that reads
  like it's proven when it isn't. Draft recipes are welcome; quietly-inflated
  ones aren't.
- **Container, not content.** Templatize the fixed shapes; leave the reader's
  actual content as `{{SLOTS}}`. A recipe pre-filled with your specific values
  anchors the reader on the wrong thing.
- **The clean-room test.** If a team legally forbidden from ever seeing your
  source code could implement this from the recipe alone, it's a recipe. If
  they'd need your source, it's documentation wearing a recipe's clothes —
  patterns and shapes only, never code lifted from a proprietary repo.
- **Implementable, not just readable.** A recipe that's only prose fails. Every
  recipe ships three layers:
  - `RECIPE.md` — the why + what + receipts (the teaching prose; on this site
    this becomes the recipe's `.mdx` page).
  - `SKILL.md` — agent-executable build instructions in the
    [skills.sh](https://skills.sh) format (frontmatter `name` + `description`,
    then steps a coding agent follows to build the pattern in the reader's own
    stack). This is what makes `npx skills add <your-repo>` actually install
    something.
  - `reference/` — real, provider-neutral working code to adapt, not copy
    blind.
- **The pulse is mandatory.** Every recipe says who or what keeps it alive
  after someone implements it — an eval cadence, a staleness check, a drift
  alarm. A recipe with no pulse section sells a stall; we will not publish one.
- **Abstract the scar, keep the lesson.** "What might go wrong" is written as
  the generalized condition ("bites when X"), never as your incident report —
  no internal ticket IDs, incident names, version numbers, file paths, or
  dates. If your evidence file needs those details for your own record, keep
  them in a `RECEIPTS-internal.md` beside the recipe and never reference it
  from `RECIPE.md`, `SKILL.md`, or `reference/`. **This repo's build will not
  publish `*-internal.md` files even if one is accidentally committed** — but
  don't rely on that; the discipline is not writing origin-identifying detail
  into the public-facing files in the first place.
- **One recipe, one system.** Compose recipes instead of writing an omnibus.

### The maturity ladder

```
draft (no receipts yet)
  -> internal (production receipts at the origin system, n=1)
  -> field-tested (someone else implemented it fresh from the recipe alone)
  -> proven (receipts from 2+ independent implementations)
```

A community submission with no receipts starts at **`maturity: draft`** —
that's not a rejection, it's an honest label. It graduates as evidence lands,
including evidence from other people implementing it (that's the
`field-tested` step, and it's exactly what community contributions are best
positioned to produce).

## Two ways to contribute

### 1. PR directly into this repo

Add your recipe under `content/docs/<slug>.mdx` following the anatomy above,
plus:

- a catalog card in `content/docs/index.mdx` under the right use-case group,
- an entry in `content/docs/meta.json`'s `pages` list (sidebar order),
- if your recipe ships an installable skill, `SKILL.md` + `reference/` go
  through the same review — see `scripts/sync-skills.mjs` for how the office's
  internal recipe source feeds `public/skills/`; a directly-contributed recipe
  should ship its skill bundle the same shape (`SKILL.md` at the unit root,
  `reference/` beside it).

Held to the exact bar above — outsider test, receipts-or-draft, clean-room,
maturity label. Starts at `maturity: draft` (labeled `community` in the PR)
until evidence lands. **Light moderation:** a maintainer checks the format
(anatomy present, no internal detail leaked, license set), not the quality of
your architecture — we're not gatekeeping opinions, we're gatekeeping honesty
about evidence.

### 2. Submit your own repo (skills.sh pattern — your repo, our index)

Keep your recipe in your own GitHub repo as a `SKILL.md`-rooted unit (so
`npx skills add your-org/your-recipe` installs it directly, no dependency on
us). Open an issue here with:

- the repo URL,
- which use-case group it belongs in,
- your honest maturity label and the evidence behind it (or `draft` if there
  isn't any yet).

We list and grade it in the catalog — a card linking out to your repo, your
maturity label shown as you declared it (we spot-check, we don't silently
re-grade you without saying so). You keep ownership and hosting; we provide
discovery and curation. This scales without us hosting everything, and it's
the whole point of being an index instead of a monolith: the moat here is
curation against a receipts bar, not how much content lives in one repo.

## What we will not publish

- A recipe claiming `field-tested` or `proven` maturity with no evidence
  backing it up — inflated claims get sent back as `draft`, not published as
  claimed.
- Anything that fails the clean-room test — actual proprietary source code
  standing in for an abstracted pattern.
- Anything that leaks origin-identifying detail (ticket IDs, incident names,
  internal file paths, dates) into `RECIPE.md`, `SKILL.md`, or `reference/`.
- Vendor lock-in dressed as a recipe — a recipe assuming our specific
  infrastructure instead of being provider-neutral and BYO-everything.

## Questions

Open an issue on this repo. For anything involving how a recipe was graded or
whether a submission meets the bar, tag it `moderation` and a maintainer will
respond.
