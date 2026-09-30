// Builds the single-download kit from the reviewed public skill folders.
// The archive is not served from this site. naturate.io hands it out after the
// email form, so pass that repo's kit path as the first argument, or copy kit/ over.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertPublicPath } from './prepare-public-library.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const kitName = 'agent-recipes-kit.zip';

export function kitEntries(skillsDir = join(root, 'public', 'skills')) {
  const entries = ['KIT.md'];
  const visit = (dir, prefix) => {
    for (const name of readdirSync(dir).sort()) {
      const path = join(dir, name);
      const relative = `${prefix}${name}`;
      assertPublicPath(relative);
      if (statSync(path).isDirectory()) visit(path, `${relative}/`);
      else entries.push(relative);
    }
  };
  for (const name of readdirSync(skillsDir).sort()) {
    if (statSync(join(skillsDir, name)).isDirectory()) visit(join(skillsDir, name), `${name}/`);
  }
  return entries;
}

export function buildKit(target, skillsDir = join(root, 'public', 'skills')) {
  if (existsSync(target)) rmSync(target);
  mkdirSync(dirname(target), { recursive: true });
  execFileSync('zip', ['-X', '-q', target, ...kitEntries(skillsDir)], { cwd: skillsDir });
  return kitEntries(skillsDir).length;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const target = resolve(process.argv[2] ?? join(root, 'kit', kitName));
  console.log(`[kit] ${buildKit(target)} files written to ${target}`);
}
