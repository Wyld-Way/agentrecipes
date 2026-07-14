'use client';

import { useState } from 'react';
import manifest from '@/lib/skill-manifest.json';

type SkillFile = { path: string; url: string; bytes: number; text: string };
type SkillEntry = { zip: string; files: SkillFile[] };
type Manifest = Record<string, SkillEntry>;

const skills = manifest as Manifest;

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          setCopied(false);
        }
      }}
      className="inline-flex items-center gap-1 rounded-md border bg-fd-card px-2.5 py-1 text-xs font-medium text-fd-foreground transition-colors hover:bg-fd-accent"
    >
      {copied ? 'Copied' : label}
    </button>
  );
}

function humanBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  return `${(n / 1024).toFixed(1)} KB`;
}

/**
 * The grab-it-now block for a recipe: download the real SKILL.md + reference
 * files (zip or individually) and copy any of them to the clipboard, sourced
 * from the office recipe dir at build time. RECEIPTS-internal is never bundled.
 */
export function SkillDownload({ slug }: { slug: string }) {
  const entry = skills[slug];
  if (!entry || entry.files.length === 0) return null;

  return (
    <div className="not-prose my-6 rounded-lg border bg-fd-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-fd-foreground">Take this recipe with you</div>
          <div className="text-xs text-fd-muted-foreground">
            The installable skill + reference code — download or copy, ready to drop into your agent.
          </div>
        </div>
        <a
          href={entry.zip}
          download={`${slug}-skill.zip`}
          className="inline-flex items-center gap-2 rounded-md bg-fd-primary px-3 py-1.5 text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-90"
        >
          Download skill (.zip)
        </a>
      </div>

      <ul className="mt-4 divide-y divide-fd-border rounded-md border">
        {entry.files.map((f) => (
          <li key={f.path} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
            <code className="truncate font-mono text-xs text-fd-foreground">{f.path}</code>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-xs text-fd-muted-foreground">{humanBytes(f.bytes)}</span>
              <CopyButton text={f.text} />
              <a
                href={f.url}
                download={f.path.split('/').pop()}
                className="inline-flex items-center gap-1 rounded-md border bg-fd-card px-2.5 py-1 text-xs font-medium text-fd-foreground transition-colors hover:bg-fd-accent"
              >
                Download
              </a>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs text-fd-muted-foreground">
        Once the public recipe repo is published, this will also be installable with{' '}
        <code className="font-mono">npx skills add {slug}</code> (coming). The download above works
        today.
      </p>
    </div>
  );
}

/**
 * Renders the full text of each skill file in a collapsible block with a copy
 * button, so a dev can grab the code without leaving the page.
 */
export function SkillFiles({ slug }: { slug: string }) {
  const entry = skills[slug];
  if (!entry || entry.files.length === 0) return null;

  return (
    <div className="not-prose my-6 space-y-4">
      {entry.files.map((f) => (
        <details key={f.path} className="group rounded-lg border bg-fd-card">
          <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-fd-foreground">
            <code className="font-mono text-xs">{f.path}</code>
            <span className="flex items-center gap-2">
              <span className="text-xs font-normal text-fd-muted-foreground">{humanBytes(f.bytes)}</span>
              <span className="text-xs font-normal text-fd-muted-foreground group-open:hidden">show</span>
              <span className="hidden text-xs font-normal text-fd-muted-foreground group-open:inline">hide</span>
            </span>
          </summary>
          <div className="border-t px-4 py-3">
            <div className="mb-2 flex justify-end">
              <CopyButton text={f.text} label="Copy file" />
            </div>
            <pre className="max-h-[28rem] overflow-auto rounded-md bg-fd-secondary p-3 text-xs leading-relaxed">
              <code className="font-mono">{f.text}</code>
            </pre>
          </div>
        </details>
      ))}
    </div>
  );
}
