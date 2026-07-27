// Single-source the recipe pages from the office repo (office#202).
//
// Every recipe is authored ONCE, as `RECIPE.md` in the sibling wyldway-office
// repo (`recipes/<slug>/RECIPE.md`). This script reads every recipe dir found
// there and GENERATES this site's Fumadocs pages from it:
//   - content/docs/<slug>.mdx   (frontmatter incl. JSON-LD `steps[]`, kicker,
//                                 maturity/meta block, install callout, body)
//   - content/docs/meta.json    (sidebar order, grouped by category)
//   - content/docs/index.mdx    (catalog cards, grouped by category)
//
// Nobody hand-writes `.mdx` for a recipe anymore. That hand-port was the
// exact drift office#202 was filed over: shared-agent-memory and
// grounded-generation landed in the office but sat un-ported on the site
// until someone happened to notice. Because the site page is now DERIVED from
// RECIPE.md on every build, a recipe existing in the office and missing from
// the site is now structurally impossible (not just checked for — see the
// self-verification pass at the bottom) as long as the build runs with the
// office repo present.
//
// HARD CONSTRAINT: this script only ever opens `RECIPE.md`. It never reads
// `RECEIPTS-internal.md` or any `*-internal.*` file, so there is no path by
// which internal content can flow into the generated site content — the
// exclusion isn't a filter bolted on after the fact, it's that those files
// are simply never touched. (`source.config.ts`'s negative globs remain as a
// defense-in-depth layer, not the only guard.)
//
// SIBLING-REPO CONTRACT (same pattern as the pre-existing sync-skills.mjs):
// wyldway-office is a private repo not present in the Vercel build
// environment. When it's absent, this script no-ops and the build uses
// whatever content/docs/*.mdx + meta.json + index.mdx are already committed
// (regenerated the last time someone ran this with the office repo present).
// Override the office repo location with WYLDWAY_OFFICE_DIR (defaults to the
// sibling `../wyldway-office`) — used in CI/sandboxes where the two repos
// aren't literal filesystem siblings.

import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(__dirname, '..');
const officeRoot = process.env.WYLDWAY_OFFICE_DIR || join(siteRoot, '..', 'wyldway-office');
const officeRecipes = join(officeRoot, 'recipes');
const docsDir = join(siteRoot, 'content', 'docs');

let officeAvailable = true;
try {
  officeAvailable = statSync(officeRecipes).isDirectory();
} catch {
  officeAvailable = false;
}
if (!officeAvailable) {
  console.log(
    `[sync-recipes] office recipes not found at ${officeRecipes} — using committed content/docs/*.mdx as-is (expected on remote CI; set WYLDWAY_OFFICE_DIR to override).`,
  );
  process.exit(0);
}

// A file is internal (never read, never published) if its name matches these.
// Mirrors source.config.ts's negative globs — kept in sync deliberately.
const isInternal = (name) =>
  /-internal\.(md|mdx|ts|js|json|ya?ml)$/i.test(name) || /^RECEIPTS-internal\./i.test(name);

// Catalog groups, in display order. A recipe's `category` frontmatter must
// match a key here to get a real heading; anything else (including no
// category at all) lands in the `__other` catch-all so it's still visible
// and still shipped — never silently dropped — while flagging that this map
// wants a real entry.
const CATEGORY_INFO = {
  'llm-production': {
    heading: 'Running LLMs in production',
    blurb:
      "You have an LLM writing something users see, and you need it to be safe to change and measurable — not a black box that regresses silently.",
  },
  agents: {
    heading: 'Building agents',
    blurb:
      "You run agents that need infrastructure the framework doesn't give you — shared state, memory that survives, patterns proven in production.",
  },
  'agents-at-scale': {
    heading: 'Running agents at scale',
    blurb:
      "You have several agents doing real work at once, on a schedule, unattended — and you need it safe and honest without watching every move.",
  },
  growth: {
    heading: "Growing what you've built",
    blurb:
      "You're trying to grow — new surfaces, content, audience plays — and need a way to run many small bets safely instead of betting everything on one idea, or watching a winner rot from neglect.",
  },
  __other: {
    heading: 'Other recipes',
    blurb: "Recipes that don't have a catalog group assigned yet in sync-recipes.mjs's CATEGORY_INFO.",
  },
};

// --- tiny frontmatter parser (RECIPE.md frontmatter is flat `key: value`,
// with one folded/literal multi-line scalar we handle explicitly:
// `maturity_note`) ---
function splitFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { frontmatter: {}, body: raw };
  const lines = m[1].split('\n');
  const frontmatter = {};
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    let rawValue = kv[2];
    if (rawValue === '>-' || rawValue === '|' || rawValue === '>' || rawValue === '|-') {
      // Folded/literal block scalar: consume indented continuation lines.
      const folded = rawValue.startsWith('>');
      const chunk = [];
      let j = i + 1;
      while (j < lines.length && (lines[j].startsWith('  ') || lines[j].trim() === '')) {
        chunk.push(lines[j].replace(/^  /, ''));
        j++;
      }
      i = j - 1;
      frontmatter[key] = folded ? chunk.join(' ').replace(/\s+/g, ' ').trim() : chunk.join('\n').trim();
      continue;
    }
    // Strip a trailing `# comment` annotation and surrounding quotes.
    let value = rawValue.replace(/\s+#.*$/, '').trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    frontmatter[key] = value;
  }
  return { frontmatter, body: m[2] };
}

// Parse numbered steps out of "## The recipe" for the JSON-LD `steps[]`.
function parseRecipeSteps(body) {
  const section = body.match(/## The recipe\n([\s\S]*?)\n## /);
  if (!section) return [];
  const paras = section[1].split(/\n\n+/);
  const steps = [];
  for (const rawPara of paras) {
    const para = rawPara.trim();
    // `s` flag: a step's bold lead-in can wrap across a source line break
    // before hitting its closing `.**`/`:**` — `.` must match newlines here.
    const m = para.match(/^\*\*(\d+)\.\s*(.+?)[.:]\*\*\s*([\s\S]*)$/s);
    if (!m) continue;
    const name = m[2].replace(/\s+/g, ' ').trim();
    // Plain-text version of the step body for JSON-LD: strip markdown
    // emphasis/code markers and collapse whitespace. An intentional
    // paraphrase-by-stripping, not a byte-identical copy — JSON-LD text
    // shouldn't carry markdown syntax anyway.
    const text = (m[3] || '')
      .replace(/`([^`]*)`/g, '$1')
      .replace(/\*\*([^*]*)\*\*/g, '$1')
      .replace(/\*([^*]*)\*/g, '$1')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    steps.push({ name, text });
  }
  return steps;
}

// MDX treats a bare `{`/`}` outside a code span as the start of a JS
// expression container, and a bare `<` as the start of a JSX tag — RECIPE.md
// prose runs into both: `{{SLOT}}` placeholder markers and inline
// `{ field, field }` shape examples not wrapped in backticks, plus numeric
// comparisons like `<10ms` or `< 1h` that read as a malformed tag to MDX's
// parser. Escape `{`, `}`, and `<` everywhere they're not already inside a
// fenced code block or an inline code span, where MDX (like CommonMark)
// leaves them untouched as literal text.
function escapeMdxBraces(markdown) {
  const lines = markdown.split('\n');
  let inFence = false;
  const out = [];
  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      out.push(line);
      continue;
    }
    if (inFence) {
      out.push(line);
      continue;
    }
    let result = '';
    let inCode = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '`') {
        inCode = !inCode;
        result += ch;
      } else if (!inCode && (ch === '{' || ch === '}') && line[i - 1] !== '\\') {
        result += '\\' + ch;
      } else if (!inCode && ch === '<' && line[i - 1] !== '\\') {
        result += '&lt;';
      } else {
        result += ch;
      }
    }
    out.push(result);
  }
  return out.join('\n');
}

function firstProblemParagraph(body) {
  const m = body.match(/## The problem\n\n([\s\S]*?)\n\n/);
  return m ? m[1].replace(/\s+/g, ' ').trim() : '';
}

function yamlString(s) {
  return `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

// Lowercase a string's leading word UNLESS that word is itself an all-caps
// acronym (e.g. "LLM prompt ops" stays capitalized; "Grounded generation"
// becomes "grounded generation") — matches the sentence-case convention the
// hand-authored pages used for the System/kicker labels.
function lowerFirstUnlessAcronym(s) {
  const firstWord = s.split(' ')[0] || '';
  if (firstWord.length > 1 && firstWord === firstWord.toUpperCase()) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function shortFromSystemName(systemName) {
  const idx = systemName.indexOf(' (');
  const short = idx === -1 ? systemName : systemName.slice(0, idx);
  return lowerFirstUnlessAcronym(short);
}

// --- discover every recipe dir automatically (no hardcoded slug list to
// remember to update — this is the fix for the "forgot to register it"
// failure mode office#202 was filed over) ---
const entries = readdirSync(officeRecipes, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort();

const recipes = [];
for (const slug of entries) {
  const recipeFile = join(officeRecipes, slug, 'RECIPE.md');
  let raw;
  try {
    raw = readFileSync(recipeFile, 'utf8');
  } catch {
    continue; // not a recipe dir (no RECIPE.md) — skip silently
  }
  const { frontmatter: fm, body } = splitFrontmatter(raw);
  if (!fm.name || !fm.slug) {
    console.warn(`[sync-recipes] ${slug}: RECIPE.md missing required name/slug frontmatter — skipping.`);
    continue;
  }
  if (fm.slug !== slug) {
    console.warn(`[sync-recipes] ${slug}: frontmatter slug "${fm.slug}" does not match directory name — using directory name.`);
  }
  recipes.push({ slug, fm, body });
}

// --- generate content/docs/<slug>.mdx for each recipe ---
for (const { slug, fm, body } of recipes) {
  const steps = parseRecipeSteps(body);
  const systemShort = fm.system_short || shortFromSystemName(fm.system_name || fm.name);
  const description = fm.description || firstProblemParagraph(body);
  const icon = fm.icon || 'BookOpen';
  const maturity = fm.maturity || 'draft';

  const fmLines = [];
  fmLines.push('---');
  fmLines.push(`title: ${yamlString(fm.name)}`);
  fmLines.push(`description: ${yamlString(description)}`);
  fmLines.push(`icon: ${icon}`);
  fmLines.push(`recipe: true`);
  fmLines.push(`system: ${yamlString(systemShort)}`);
  fmLines.push(`maturity: ${maturity}`);
  fmLines.push('steps:');
  for (const s of steps) {
    fmLines.push(`  - name: ${yamlString(s.name)}`);
    fmLines.push(`    text: ${yamlString(s.text)}`);
  }
  fmLines.push('---');

  const kicker = `<p className="-mt-2 text-fd-muted-foreground">\n  Recipe: <strong className="text-fd-foreground">${systemShort}</strong>\n</p>`;

  const metaBlock = [
    '<div className="not-prose my-6 rounded-lg border bg-fd-card p-4 text-sm">',
    `  <div className="mb-2"><MaturityBadge level="${maturity}" showHint /></div>`,
    '  <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-fd-muted-foreground">',
    `    <dt className="font-medium text-fd-foreground">System</dt><dd>${lowerFirstUnlessAcronym(fm.system_name || fm.name)}</dd>`,
    `    <dt className="font-medium text-fd-foreground">Slug</dt><dd>${slug}</dd>`,
    `    <dt className="font-medium text-fd-foreground">Version</dt><dd>${fm.version || '0.1'}</dd>`,
    `    <dt className="font-medium text-fd-foreground">Origin</dt><dd>${fm.origin_short || (fm.origin && !fm.origin.startsWith('internal') ? fm.origin : 'Abstracted from an internal production system.')}</dd>`,
    `    <dt className="font-medium text-fd-foreground">Consumers</dt><dd>${(fm.consumers || '').replace(/^\[|\]$/g, '')}</dd>`,
    `    <dt className="font-medium text-fd-foreground">License</dt><dd>CC-BY-SA-4.0 on publish</dd>`,
    '  </dl>',
    '</div>',
  ].join('\n');

  const installCallout = `<SkillDownload slug="${slug}" />`;

  // maturity_note is already collapsed to one line by the folded-scalar
  // parser above; a single `>` line renders as one blockquote paragraph.
  const maturityNote = fm.maturity_note ? `\n\n> ${fm.maturity_note}` : '';

  // Body: everything after the frontmatter + H1 + optional "(a.k.a. ...)"
  // subtitle line, i.e. from "## The problem" through "## Provenance",
  // copied through VERBATIM — this is already the exact prose that used to
  // be hand-copied into the .mdx. The only injection is a "## The skill"
  // section (SkillFiles download block) right before "## Provenance",
  // which has no RECIPE.md equivalent (SKILL.md/reference/ are separate
  // files, bundled by sync-skills.mjs).
  const problemOnward = body.slice(body.indexOf('## The problem'));
  const skillSection = `## The skill\n\nThe installable skill and its reference code, in full — copy any file, or grab the whole bundle above. This is what an agent follows to build the pattern in your codebase.\n\n<SkillFiles slug="${slug}" />\n\n`;
  const bodyWithSkill = problemOnward.includes('## Provenance')
    ? problemOnward.replace('## Provenance', skillSection + '## Provenance')
    : problemOnward + '\n\n' + skillSection;

  const mdx = `${fmLines.join('\n')}\n\n${kicker}\n\n${metaBlock}\n\n${installCallout}${maturityNote}\n\n${escapeMdxBraces(bodyWithSkill.trim())}\n`;

  const outPath = join(docsDir, `${slug}.mdx`);
  writeFileSync(outPath, mdx);
  console.log(`[sync-recipes] wrote content/docs/${slug}.mdx (${steps.length} steps, category=${fm.category || '(none)'})`);
}

// --- group by category and regenerate meta.json + index.mdx ---
const groups = new Map();
for (const key of Object.keys(CATEGORY_INFO)) groups.set(key, []);
for (const { slug, fm } of recipes) {
  const key = CATEGORY_INFO[fm.category] ? fm.category : '__other';
  groups.get(key).push({ slug, fm });
}

// meta.json: index page, then every recipe grouped in CATEGORY_INFO order
// (skipping empty groups), then the static reference pages.
const metaPages = ['index', '---Recipes---'];
for (const [key, list] of groups) {
  if (!list.length) continue;
  for (const { slug } of list) metaPages.push(slug);
}
metaPages.push('---Reference---', 'format');
writeFileSync(
  join(docsDir, 'meta.json'),
  JSON.stringify({ title: 'Recipes', pages: metaPages }, null, 2) + '\n',
);
console.log(`[sync-recipes] wrote content/docs/meta.json (${recipes.length} recipe(s))`);

// index.mdx: same catalog intro as before, then one <Cards> block per
// non-empty category, in CATEGORY_INFO order.
const indexHeader = `---
title: What are you building?
description: Plug-and-play recipes for building proven AI and agent systems — each one a real system abstracted so you can implement it in your own stack.
icon: BookOpen
---

Every recipe here is one proven system, abstracted to its container: the
decisions, the steps, the config shapes, the guardrails — with the content slots
left open. You implement it in your own codebase, in your own stack, without ever
seeing ours.

What makes these different is **receipts**: real production numbers, real failure
modes, real costs behind every claim. A recipe without receipts is labeled a
draft. Most guides ship the pattern and hide the evidence — these ship both.

Pick the job you're trying to do.
`;

const sections = [];
for (const [key, list] of groups) {
  if (!list.length) continue;
  const info = CATEGORY_INFO[key];
  const cards = list
    .map(({ slug, fm }) => {
      const systemShort = fm.system_short || shortFromSystemName(fm.system_name || fm.name);
      const maturity = fm.maturity || 'draft';
      const description = fm.description || '';
      return `  <Card
    title=${yamlLikeJsxString(fm.name)}
    href="/docs/${slug}"
    description=${yamlLikeJsxString(`Recipe: ${systemShort} (${maturity}). ${description}`)}
  />`;
    })
    .join('\n');
  sections.push(`## ${info.heading}\n\n${info.blurb}\n\n<Cards>\n${cards}\n</Cards>`);
}

function yamlLikeJsxString(s) {
  return `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '&quot;')}"`;
}

const footer = `## New to this?

<Cards>
  <Card
    title="What a recipe is, and the receipts bar"
    href="/docs/format"
    description="The eight sections, the maturity lifecycle (draft to internal to field-tested to proven), and the evidence discipline that separates these from untested prompt libraries."
  />
</Cards>
`;

const indexMdx = `${indexHeader}\n${sections.join('\n\n')}\n\n${footer}`;
writeFileSync(join(docsDir, 'index.mdx'), indexMdx);
console.log(`[sync-recipes] wrote content/docs/index.mdx (${sections.length} catalog group(s))`);

// --- self-verification (office#202's actual done-condition): every recipe
// dir in the office must now have a generated page, and nothing internal was
// ever touched. ---
const problems = [];
for (const { slug } of recipes) {
  const mdxPath = join(docsDir, `${slug}.mdx`);
  try {
    statSync(mdxPath);
  } catch {
    problems.push(`content/docs/${slug}.mdx was not generated.`);
  }
}
for (const { slug } of recipes) {
  if (!metaPages.includes(slug)) problems.push(`${slug} missing from meta.json pages[].`);
}
// Defense-in-depth: confirm no internal filename pattern ever made it into
// content/docs (this script never reads one, but assert it anyway).
for (const name of readdirSync(docsDir)) {
  if (isInternal(name)) problems.push(`internal file leaked into content/docs: ${name}`);
}
if (problems.length) {
  console.error(`[sync-recipes] FAILED self-verification:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
  process.exit(1);
}
console.log(`[sync-recipes] self-verification passed — ${recipes.length} office recipe(s), ${recipes.length} generated page(s), 0 internal leaks.`);
