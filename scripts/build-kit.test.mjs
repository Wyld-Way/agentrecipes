import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildKit, kitEntries, kitName } from './build-kit.mjs';

const skillsDir = join(resolve(dirname(fileURLToPath(import.meta.url)), '..'), 'public', 'skills');

test('kit archive holds exactly the reviewed public skill files, byte for byte', () => {
  const dir = mkdtempSync(join(tmpdir(), 'kit-'));
  try {
    const target = join(dir, kitName);
    buildKit(target, skillsDir);
    const archived = execFileSync('unzip', ['-Z1', target], { encoding: 'utf8' }).trim().split('\n').sort();
    assert.deepEqual(archived, kitEntries(skillsDir).sort());
    for (const entry of kitEntries(skillsDir)) {
      assert.ok(execFileSync('unzip', ['-p', target, entry]).equals(readFileSync(join(skillsDir, entry))), entry);
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('every skill in the kit has instructions', () => {
  const folders = new Set(kitEntries(skillsDir).filter((entry) => entry.includes('/')).map((entry) => entry.split('/')[0]));
  assert.ok(folders.size >= 12);
  for (const folder of folders) assert.ok(kitEntries(skillsDir).includes(`${folder}/SKILL.md`), folder);
});
test('no archive is served from the site; the download sits behind the email form', () => {
  assert.deepEqual(readdirSync(skillsDir).filter((name) => name.endsWith('.zip')), []);
});
