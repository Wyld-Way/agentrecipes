// Builds the single-download kit from the reviewed public skill folders.
// Run after adding, removing or editing anything under public/skills.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
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

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const skillsDir = join(root, 'public', 'skills');
  const target = join(skillsDir, kitName);
  if (existsSync(target)) rmSync(target);
  execFileSync('zip', ['-X', '-q', target, ...kitEntries(skillsDir)], { cwd: skillsDir });
  console.log(`[kit] ${kitEntries(skillsDir).length} files written to public/skills/${kitName}`);
}
