// Sync the installable skill bundles from the office recipe dirs into the site's
// public/ so a visitor can DOWNLOAD the real SKILL.md + reference files today,
// before the public recipe repo exists.
//
// For each recipe we copy SKILL.md + reference/* into public/skills/<slug>/,
// build a .zip of that folder at public/skills/<slug>.zip, and emit
// lib/skill-manifest.json (file list + raw text) that the page reads for the
// in-page copy buttons.
//
// HARD CONSTRAINT: never copy RECEIPTS-internal.md or any *-internal.* file.
// The exclusion is enforced here (source side) AND at the Fumadocs build layer.

import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(__dirname, '..');
// The office recipes live in a sibling repo of the site.
const officeRecipes = join(siteRoot, '..', 'wyldway-office', 'recipes');

const SLUGS = ['llm-prompt-ops', 'grounded-generation', 'shared-agent-memory'];

// A file is internal (never published) if its name matches these.
const isInternal = (name) =>
  /-internal\.(md|mdx|ts|js|json)$/i.test(name) || /^RECEIPTS-internal\./i.test(name);

// The office recipes are a SIBLING repo that only exists on a maintainer's
// machine — it is NOT present in the Vercel build environment. So this script
// regenerates the bundles when the source is available (a maintainer runs it,
// commits the output), and no-ops when the source is absent (remote CI build)
// so the COMMITTED bundles + manifest are used as-is. That keeps the download
// working in production without the office repo ever touching the deploy.
let officeAvailable = true;
try {
  officeAvailable = statSync(officeRecipes).isDirectory();
} catch {
  officeAvailable = false;
}
if (!officeAvailable) {
  console.log(
    `[sync-skills] office recipes not found at ${officeRecipes} — using committed bundles as-is (expected on remote CI).`,
  );
  process.exit(0);
}

const publicSkills = join(siteRoot, 'public', 'skills');
rmSync(publicSkills, { recursive: true, force: true });
mkdirSync(publicSkills, { recursive: true });

// Recursively list files under a dir, skipping internal files entirely.
function listFiles(dir, base = dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFiles(full, base));
    } else if (!isInternal(entry.name)) {
      out.push({ full, rel: relative(base, full) });
    }
  }
  return out;
}

const manifest = {};

for (const slug of SLUGS) {
  const src = join(officeRecipes, slug);
  let stat;
  try {
    stat = statSync(src);
  } catch {
    console.warn(`[sync-skills] recipe dir missing, skipping: ${src}`);
    continue;
  }
  if (!stat.isDirectory()) continue;

  const destDir = join(publicSkills, slug);
  mkdirSync(destDir, { recursive: true });

  // Copy SKILL.md + reference/* (internal files filtered by the copy filter).
  const files = [];

  // SKILL.md
  const skillSrc = join(src, 'SKILL.md');
  try {
    if (!isInternal('SKILL.md') && statSync(skillSrc).isFile()) {
      cpSync(skillSrc, join(destDir, 'SKILL.md'));
      files.push({ path: 'SKILL.md', bytes: statSync(skillSrc).size, text: readFileSync(skillSrc, 'utf8') });
    }
  } catch {
    /* no SKILL.md */
  }

  // reference/*
  const refSrc = join(src, 'reference');
  try {
    if (statSync(refSrc).isDirectory()) {
      cpSync(refSrc, join(destDir, 'reference'), {
        recursive: true,
        filter: (s) => {
          const name = s.split('/').pop();
          return !isInternal(name);
        },
      });
      for (const f of listFiles(refSrc)) {
        files.push({
          path: join('reference', f.rel),
          bytes: statSync(f.full).size,
          text: readFileSync(f.full, 'utf8'),
        });
      }
    }
  } catch {
    /* no reference/ */
  }

  // Guard: assert nothing internal slipped into the copied folder.
  for (const f of listFiles(destDir)) {
    if (isInternal(f.rel.split('/').pop())) {
      throw new Error(`[sync-skills] internal file leaked into public bundle: ${slug}/${f.rel}`);
    }
  }

  // Zip the folder. `zip` is present on macOS + the Vercel Linux builder.
  const zipPath = join(publicSkills, `${slug}.zip`);
  try {
    execFileSync('zip', ['-r', '-q', zipPath, slug], { cwd: publicSkills });
  } catch (e) {
    console.warn(`[sync-skills] zip failed for ${slug} (${e.message}); per-file downloads still work.`);
  }

  manifest[slug] = {
    zip: `/skills/${slug}.zip`,
    files: files
      .sort((a, b) => (a.path === 'SKILL.md' ? -1 : b.path === 'SKILL.md' ? 1 : a.path.localeCompare(b.path)))
      .map((f) => ({
        path: f.path,
        url: `/skills/${slug}/${f.path}`,
        bytes: f.bytes,
        text: f.text,
      })),
  };

  console.log(`[sync-skills] ${slug}: ${manifest[slug].files.length} files, zip ${zipPath}`);
}

writeFileSync(join(siteRoot, 'lib', 'skill-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`[sync-skills] wrote lib/skill-manifest.json (${Object.keys(manifest).length} recipes)`);
