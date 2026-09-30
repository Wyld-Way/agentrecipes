'use client';

import { useState } from 'react';
import manifest from '@/lib/skill-manifest.json';
import { kitUrl } from '@/lib/shared';

type SkillFile = { path: string; url: string; bytes: number; text: string };
type SkillEntry = { zip?: string; files: SkillFile[] };
const skills = manifest as Record<string, SkillEntry>;

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [status, setStatus] = useState<'ready' | 'copied' | 'failed'>('ready');
  return <button type="button" className="inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-fd-accent" onClick={async () => {
    try { await navigator.clipboard.writeText(text); setStatus('copied'); }
    catch { setStatus('failed'); }
  }}><span aria-live="polite">{status === 'copied' ? 'Copied' : status === 'failed' ? 'Copy failed — retry' : label}</span></button>;
}
function humanBytes(n: number) { return n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`; }

export function SkillDownload({ slug }: { slug: string }) {
  const entry = skills[slug];
  if (!entry || entry.files.length === 0) return null;
  return <div className="not-prose my-6 rounded-lg border bg-fd-card p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-sm font-semibold">Try this recipe in your own project</p><p className="mt-1 text-xs text-fd-muted-foreground">Read the files below first. The download for the whole kit asks for your email.</p></div>
      <a href={kitUrl('download', slug)} className="rounded-md bg-fd-primary px-3 py-2 text-sm font-medium text-fd-primary-foreground">Get the kit (.zip)</a>
    </div>
    <ul className="mt-4 divide-y divide-fd-border rounded-md border">
      {entry.files.map((file) => <li key={file.path} className="flex flex-wrap items-center justify-between gap-3 px-3 py-2">
        <code className="break-all font-mono text-xs">{file.path}</code>
        <div className="flex shrink-0 items-center gap-2"><span className="text-xs text-fd-muted-foreground">{humanBytes(file.bytes)}</span><CopyButton text={file.text} /></div>
      </li>)}
    </ul>
    <p className="mt-3 text-xs leading-5 text-fd-muted-foreground">Start in a test project with synthetic data. A skill file provides instructions; it does not grant permissions, start an autonomous process or establish compatibility with every agent host. Check this guide’s evidence and applicable file-specific licence.</p>
  </div>;
}

export function SkillFiles({ slug }: { slug: string }) {
  const entry = skills[slug];
  if (!entry || entry.files.length === 0) return null;
  return <div className="not-prose my-6 space-y-4">
    {entry.files.map((file) => <details key={file.path} className="rounded-lg border bg-fd-card">
      <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3"><code className="break-all font-mono text-xs">{file.path}</code><span className="shrink-0 text-xs text-fd-muted-foreground">{humanBytes(file.bytes)}</span></summary>
      <div className="border-t px-4 py-3"><div className="mb-2 flex justify-end"><CopyButton text={file.text} label="Copy file" /></div><pre className="max-h-[28rem] overflow-auto rounded-md bg-fd-secondary p-3 text-xs leading-relaxed"><code>{file.text}</code></pre></div>
    </details>)}
  </div>;
}
