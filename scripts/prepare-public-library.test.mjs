import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assertPublicPath, repairSkillTags, prepareLibrary } from './prepare-public-library.mjs';

const escaped = '&lt;SkillFiles slug="example-guide" />';
test('repairs only the exact generated component and is idempotent', () => {
  const result = repairSkillTags(escaped);
  assert.equal(result, '<SkillFiles slug="example-guide" />');
  assert.equal(repairSkillTags(result), result);
  assert.equal(repairSkillTags('&lt;script>alert(1)</script>'), '&lt;script>alert(1)</script>');
  assert.equal(repairSkillTags('&lt;SkillFiles slug="../private" />'), '&lt;SkillFiles slug="../private" />');
});
test('preserves fenced examples and numeric comparisons', () => {
  for (const marker of ['```', '~~~~']) {
    const code = `${marker}\n${escaped}\n${marker}`;
    assert.equal(repairSkillTags(code), code);
  }
  assert.equal(repairSkillTags('Latency &lt; 1s'), 'Latency &lt; 1s');
});
test('rejects internal artifacts regardless of extension', () => {
  for (const path of ['RECEIPTS-internal.md', 'reference/x-internal.yaml', 'x-internal.csv', '.env.local', '../secret', 'reference/server.key']) {
    assert.throws(() => assertPublicPath(path));
  }
  assert.doesNotThrow(() => assertPublicPath('reference/example.mjs'));
});
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'public-library-'));
  for (const dir of ['content/docs', 'lib', 'public/skills']) mkdirSync(join(root, dir), { recursive: true });
  writeFileSync(join(root, 'lib/skill-manifest.json'), '{}');
  return root;
}
test('is validation-only and keeps standalone/community pages', () => {
  const root = fixture();
  try {
    const page = join(root, 'content/docs/community.mdx');
    writeFileSync(page, '<SkillFiles slug="example-guide" />');
    prepareLibrary(root);
    assert.equal(readFileSync(page, 'utf8'), '<SkillFiles slug="example-guide" />');
  } finally { rmSync(root, { recursive: true, force: true }); }
});
test('requires escaped SkillFiles repairs to be committed', () => {
  const root = fixture();
  try {
    writeFileSync(join(root, 'content/docs/community.mdx'), escaped);
    assert.throws(() => prepareLibrary(root), /must be repaired and committed/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
test('refuses public symlinks and symlink validation roots', () => {
  const root = fixture();
  try {
    symlinkSync(join(root, 'lib'), join(root, 'public/skills/linked'));
    assert.throws(() => prepareLibrary(root), /symlinks/);
  } finally { rmSync(root, { recursive: true, force: true }); }

  const root2 = mkdtempSync(join(tmpdir(), 'public-library-root-link-'));
  const external = mkdtempSync(join(tmpdir(), 'public-library-external-'));
  try {
    mkdirSync(join(root2, 'content'), { recursive: true });
    mkdirSync(join(root2, 'public/skills'), { recursive: true });
    mkdirSync(join(root2, 'lib'), { recursive: true });
    writeFileSync(join(root2, 'lib/skill-manifest.json'), '{}');
    symlinkSync(external, join(root2, 'content/docs'));
    assert.throws(() => prepareLibrary(root2), /validation roots cannot be symlinks/i);
  } finally {
    rmSync(root2, { recursive: true, force: true });
    rmSync(external, { recursive: true, force: true });
  }
});
test('scans the entire statically served public tree', () => {
  const root = fixture();
  try {
    writeFileSync(join(root, 'public/RECEIPTS-internal.md'), 'unsafe');
    assert.throws(() => prepareLibrary(root), /unsafe path/i);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
test('refuses manifest text drift and missing archives', () => {
  const root = fixture();
  try {
    mkdirSync(join(root, 'public/skills/example-guide'));
    writeFileSync(join(root, 'public/skills/example-guide/SKILL.md'), 'actual');
    const entry = { zip: '/skills/example-guide.zip', files: [{ path: 'SKILL.md', url: '/skills/example-guide/SKILL.md', text: 'wrong', bytes: 6 }] };
    writeFileSync(join(root, 'lib/skill-manifest.json'), JSON.stringify({ 'example-guide': entry }));
    assert.throws(() => prepareLibrary(root), /drift/);
    entry.files[0].text = 'actual';
    entry.files[0].bytes = 999;
    writeFileSync(join(root, 'lib/skill-manifest.json'), JSON.stringify({ 'example-guide': entry }));
    assert.throws(() => prepareLibrary(root), /drift/);
    entry.files[0].bytes = Buffer.byteLength('actual', 'utf8');
    writeFileSync(join(root, 'lib/skill-manifest.json'), JSON.stringify({ 'example-guide': entry }));
    assert.throws(() => prepareLibrary(root), /archive/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
