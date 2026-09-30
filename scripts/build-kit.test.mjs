import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { kitEntries, kitName } from './build-kit.mjs';

const skillsDir = join(resolve(dirname(fileURLToPath(import.meta.url)), '..'), 'public', 'skills');
const archived = () => execFileSync('unzip', ['-Z1', join(skillsDir, kitName)], { encoding: 'utf8' }).trim().split('\n').sort();

test('kit archive holds exactly the reviewed public skill files', () => {
  assert.deepEqual(archived(), kitEntries(skillsDir).sort());
});
test('archived files match the files served on the site', () => {
  for (const entry of kitEntries(skillsDir)) {
    const inKit = execFileSync('unzip', ['-p', join(skillsDir, kitName), entry]);
    assert.ok(inKit.equals(readFileSync(join(skillsDir, entry))), `${entry} is stale in the kit; run npm run build:kit`);
  }
});
test('every skill in the kit has instructions', () => {
  const folders = new Set(kitEntries(skillsDir).filter((entry) => entry.includes('/')).map((entry) => entry.split('/')[0]));
  assert.ok(folders.size >= 10);
  for (const folder of folders) assert.ok(kitEntries(skillsDir).includes(`${folder}/SKILL.md`), folder);
});
