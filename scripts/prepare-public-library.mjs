import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// This checks public artifact names, not all possible secrets in their contents.
export function assertPublicPath(path) {
  const parts = path.replaceAll('\\', '/').split('/');
  if (parts.some((part) => part === '..' || /-internal(?:\.|$)/i.test(part) || /^\.env(?:\.|$)/i.test(part) || /\.(pem|key)$/i.test(part))) {
    throw new Error(`Private or unsafe path in public artifacts: ${path}`);
  }
}

function walk(dir, root = dir) {
  if (!existsSync(dir)) return [];
  const rootStat = lstatSync(dir);
  if (rootStat.isSymbolicLink()) throw new Error(`Validation roots cannot be symlinks: ${dir}`);
  if (!rootStat.isDirectory()) throw new Error(`Expected directory validation root: ${dir}`);
  return readdirSync(dir).sort().flatMap((name) => {
    const path = join(dir, name);
    assertPublicPath(path.slice(root.length + 1));
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) throw new Error(`Public artifacts cannot contain symlinks: ${path}`);
    return stat.isDirectory() ? walk(path, root) : [path];
  });
}

// Restore only our known generated component, never arbitrary JSX from prose.
// Code examples, including tilde fences, must remain literal.
export function repairSkillTags(text) {
  let fence = null;
  return text.split('\n').map((line) => {
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = { char: marker[1][0], length: marker[1].length };
      else if (marker[1][0] === fence.char && marker[1].length >= fence.length) fence = null;
      return line;
    }
    if (fence) return line;
    return line.replace(/^&lt;SkillFiles slug="([a-z0-9]+(?:-[a-z0-9]+)*)"\s*\/>\s*$/, '<SkillFiles slug="$1" />');
  }).join('\n');
}

export function prepareLibrary(root = defaultRoot) {
  const docs = walk(join(root, 'content', 'docs'));
  walk(join(root, 'public'));
  for (const path of docs.filter((path) => path.endsWith('.mdx'))) {
    const source = readFileSync(path, 'utf8');
    if (repairSkillTags(source) !== source) {
      throw new Error(`Escaped SkillFiles tag must be repaired and committed: ${path}`);
    }
  }
  const manifestPath = join(root, 'lib', 'skill-manifest.json');
  if (!existsSync(manifestPath)) throw new Error('Missing committed public skill manifest');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  for (const [slug, entry] of Object.entries(manifest)) {
    if (!slugPattern.test(slug) || !Array.isArray(entry.files)) throw new Error(`Invalid skill entry: ${slug}`);
    for (const file of entry.files) {
      assertPublicPath(file.path);
      if (file.path.startsWith('/') || file.path.includes('\\')) throw new Error(`Invalid skill file: ${file.path}`);
      const url = `/skills/${slug}/${file.path}`;
      if (file.url !== url) throw new Error(`Unexpected download URL: ${file.url}`);
      if (!Number.isInteger(file.bytes) || file.bytes < 0) throw new Error(`Invalid skill byte count: ${slug}/${file.path}`);
      const path = join(root, 'public', 'skills', slug, file.path);
      if (!existsSync(path)) throw new Error(`Skill manifest drift: ${slug}/${file.path}`);
      const servedText = readFileSync(path, 'utf8');
      if (servedText !== file.text || Buffer.byteLength(servedText, 'utf8') !== file.bytes) {
        throw new Error(`Skill manifest drift: ${slug}/${file.path}`);
      }
    }
    if (entry.zip && (entry.zip !== `/skills/${slug}.zip` || !existsSync(join(root, 'public', entry.zip.slice(1))))) {
      throw new Error(`Missing or unexpected skill archive: ${slug}`);
    }
  }
  console.log(`[public-library] ${docs.length} documents checked. Reviewed public files are canonical; no private sources read.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) prepareLibrary();
