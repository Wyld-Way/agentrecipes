// Flag drift between the office recipe source (RECIPE.md, in the sibling
// wyldway-office repo) and this site's hand-authored content/docs/<slug>.mdx
// pages.
//
// HONESTY NOTE (office#202): this does NOT single-source the docs — the .mdx
// pages are still hand-authored and this script does not generate or rewrite
// them. What it DOES do is make drift loud instead of silent: it diffs the
// fields a maintainer is expected to keep in sync (title, maturity, the
// numbered recipe steps) and fails the build when they've drifted, plus
// checks that every recipe in the office is actually wired into meta.json and
// the index.mdx catalog (the exact failure mode office#202 was filed over —
// "just happened with shared-agent-memory + grounded-generation" — a recipe
// existing in the office but never hand-ported to the site going unnoticed).
//
// Same sibling-repo contract as scripts/sync-skills.mjs: this only runs real
// checks when ../wyldway-office is present (a maintainer's machine); it no-ops
// on remote CI where that sibling doesn't exist, same as the skills sync.
//
// Full single-sourcing (site reads RECIPE.md directly, no .mdx authored by
// hand at all) is the clean long-term fix described in office#202 but is a
// bigger Fumadocs `source` loader rewrite than fits in this pass — tracked as
// follow-up, not done here. Don't read this script's presence as that fix.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(__dirname, '..');
const officeRecipes = join(siteRoot, '..', 'wyldway-office', 'recipes');
const docsDir = join(siteRoot, 'content', 'docs');

const SLUGS = [
  'llm-prompt-ops',
  'grounded-generation',
  'shared-agent-memory',
  'agent-worker-fleet',
];

let officeAvailable = true;
try {
  officeAvailable = statSync(officeRecipes).isDirectory();
} catch {
  officeAvailable = false;
}
if (!officeAvailable) {
  console.log(
    `[check-recipe-docs] office recipes not found at ${officeRecipes} — skipping drift check (expected on remote CI; site pages are not auto-generated, only checked for drift when the source sibling is present).`,
  );
  process.exit(0);
}

// --- tiny frontmatter split (RECIPE.md frontmatter is flat key: value, no
// nested structures we need) ---
function splitFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { frontmatter: {}, body: raw };
  const frontmatter = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (!kv) continue;
    // strip trailing `# comment` annotations used in RECIPE.md frontmatter
    let value = kv[2].replace(/\s+#.*$/, '').trim();
    frontmatter[kv[1]] = value;
  }
  return { frontmatter, body: m[2] };
}

// Parse the numbered steps out of RECIPE.md's "## The recipe" section.
// Format throughout the office recipes: `**N. Title.** body text...` as the
// first line of a paragraph, body continuing until the next blank line.
function parseRecipeSteps(body) {
  const section = body.match(/## The recipe\n([\s\S]*?)\n## /);
  if (!section) return [];
  const paras = section[1].split(/\n\n+/);
  const steps = [];
  for (const rawPara of paras) {
    const para = rawPara.trim();
    // Step titles end the bolded lead-in with `.` (most) or `:` (a few, when
    // the step introduces a sub-list) before the closing `**`.
    const m = para.match(/^\*\*(\d+)\.\s*(.+?)[.:]\*\*\s*([\s\S]*)$/);
    if (!m) continue;
    const text = (m[3] || '').replace(/\n/g, ' ').trim();
    steps.push({ n: Number(m[1]), name: m[2].trim(), text });
  }
  return steps;
}

function normalizeWs(s) {
  return (s || '').replace(/\s+/g, ' ').trim();
}

const problems = [];
const warnings = [];

// Whole-catalog checks: is every office recipe wired into meta.json + index.mdx?
let metaJson = {};
try {
  metaJson = JSON.parse(readFileSync(join(docsDir, 'meta.json'), 'utf8'));
} catch (e) {
  problems.push(`content/docs/meta.json missing or invalid: ${e.message}`);
}
let indexMdx = '';
try {
  indexMdx = readFileSync(join(docsDir, 'index.mdx'), 'utf8');
} catch (e) {
  problems.push(`content/docs/index.mdx missing or invalid: ${e.message}`);
}

for (const slug of SLUGS) {
  const officeRecipeFile = join(officeRecipes, slug, 'RECIPE.md');
  let officeRaw;
  try {
    officeRaw = readFileSync(officeRecipeFile, 'utf8');
  } catch {
    warnings.push(`[${slug}] no RECIPE.md found at ${officeRecipeFile} — skipping (recipe may be new/unfinished).`);
    continue;
  }
  const { frontmatter: recipeFm, body: recipeBody } = splitFrontmatter(officeRaw);
  const recipeSteps = parseRecipeSteps(recipeBody);

  // 1. Is this recipe even wired into the catalog?
  if (!(metaJson.pages || []).includes(slug)) {
    problems.push(`[${slug}] not listed in content/docs/meta.json "pages" — recipe exists in the office but is invisible in the sidebar.`);
  }
  if (!indexMdx.includes(`/docs/${slug}`)) {
    problems.push(`[${slug}] no catalog card linking to /docs/${slug} in content/docs/index.mdx — recipe exists in the office but has no discovery card.`);
  }

  // 2. Does the .mdx page even exist?
  const mdxPath = join(docsDir, `${slug}.mdx`);
  let mdxRaw;
  try {
    mdxRaw = readFileSync(mdxPath, 'utf8');
  } catch {
    problems.push(`[${slug}] RECIPE.md exists in the office but content/docs/${slug}.mdx does NOT — this recipe has never been ported to the site (the exact office#202 failure mode).`);
    continue;
  }

  // 3. Frontmatter drift: title vs name, maturity, steps.
  const fmMatch = mdxRaw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!fmMatch) {
    problems.push(`[${slug}] content/docs/${slug}.mdx has no parseable frontmatter block.`);
    continue;
  }
  let mdxFm;
  try {
    mdxFm = parseYaml(fmMatch[1]);
  } catch (e) {
    problems.push(`[${slug}] content/docs/${slug}.mdx frontmatter failed to parse as YAML: ${e.message}`);
    continue;
  }

  if (normalizeWs(mdxFm.title) !== normalizeWs(recipeFm.name)) {
    problems.push(
      `[${slug}] title drift — RECIPE.md name is "${recipeFm.name}" but ${slug}.mdx title is "${mdxFm.title}".`,
    );
  }
  if (normalizeWs(mdxFm.maturity) !== normalizeWs(recipeFm.maturity)) {
    problems.push(
      `[${slug}] maturity drift — RECIPE.md says maturity: ${recipeFm.maturity} but ${slug}.mdx says maturity: ${mdxFm.maturity}. The published maturity badge is lying about the recipe's evidence level.`,
    );
  }

  // system_name -> system is an intentional human translation (insider term to
  // a short kicker), not a literal copy, so this is a soft warning only.
  const normSystemName = normalizeWs(recipeFm.system_name).replace(/\s*\([^)]*\)\s*/g, '').toLowerCase();
  const normSystem = normalizeWs(mdxFm.system).toLowerCase();
  if (normSystem && !normSystemName.includes(normSystem) && !normSystem.includes(normSystemName)) {
    warnings.push(
      `[${slug}] system kicker may be stale — RECIPE.md system_name is "${recipeFm.system_name}" but ${slug}.mdx system is "${mdxFm.system}". (Soft check: this is an intentional short translation, verify by eye.)`,
    );
  }

  // NOTE on scope: mdx `steps[].text` is an intentionally-compressed
  // paraphrase of the fuller RECIPE.md step prose (site copy vs. teaching
  // prose), not a verbatim copy — so we do NOT diff step text. What IS a
  // reliable signal: the step COUNT (a step added/removed/reordered in
  // RECIPE.md and not mirrored) and the step NAME (allowing the mdx name to be
  // a trimmed version of the RECIPE.md name — dropping a trailing parenthetical
  // aside or an em-dash clause is a legitimate shortening, not drift; anything
  // else is).
  const mdxSteps = mdxFm.steps || [];
  if (mdxSteps.length !== recipeSteps.length) {
    problems.push(
      `[${slug}] step count drift — RECIPE.md has ${recipeSteps.length} numbered steps in "The recipe" but ${slug}.mdx frontmatter has ${mdxSteps.length} steps[] entries. A step was added, removed, or reordered in one and not the other.`,
    );
  } else {
    const trimName = (s) =>
      normalizeWs(s)
        .replace(/\s*\([^)]*\)\s*$/, '') // trailing "(the constitution)" aside
        .replace(/\s*[—-]\s*.*$/, '') // trailing "— the pulse" em-dash clause
        .toLowerCase();
    for (let i = 0; i < recipeSteps.length; i++) {
      const rs = recipeSteps[i];
      const ms = mdxSteps[i];
      const rn = trimName(rs.name);
      const mn = trimName(ms.name);
      if (rn !== mn && !rn.startsWith(mn) && !mn.startsWith(rn)) {
        problems.push(
          `[${slug}] step ${i + 1} name drift — RECIPE.md: "${rs.name}" vs ${slug}.mdx steps[${i}].name: "${ms.name}" (not just a trimmed subset of each other — looks like a real rename).`,
        );
      }
    }
  }
}

if (warnings.length) {
  console.warn(`[check-recipe-docs] ${warnings.length} soft warning(s):`);
  for (const w of warnings) console.warn(`  - ${w}`);
}

if (problems.length) {
  console.error(`\n[check-recipe-docs] FAILED — ${problems.length} drift issue(s) between wyldway-office/recipes and content/docs/*.mdx:\n`);
  for (const p of problems) console.error(`  - ${p}`);
  console.error(
    `\nThese pages are still hand-authored (office#202's full single-source fix is not done). Fix by hand-editing the .mdx to match RECIPE.md, then re-run \`npm run check:recipe-docs\`.\n`,
  );
  process.exit(1);
}

console.log(`[check-recipe-docs] ${SLUGS.length} recipe(s) checked against content/docs/*.mdx — no drift found.`);
