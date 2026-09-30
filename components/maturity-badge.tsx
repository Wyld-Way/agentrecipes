import type { ReactNode } from 'react';

type Maturity = 'draft' | 'internal' | 'field-tested' | 'proven';

const STYLES: Record<
  Maturity,
  { label: string; className: string; hint: string }
> = {
  draft: {
    label: 'Draft',
    className:
      'bg-neutral-100 text-neutral-700 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700',
    hint: 'Evidence or testing is still incomplete.',
  },
  internal: {
    label: 'In production',
    className:
      'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    hint: 'Evidence from one production system.',
  },
  'field-tested': {
    label: 'Field-tested',
    className:
      'bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60',
    hint: 'Someone else implemented it fresh from the recipe alone.',
  },
  proven: {
    label: 'Proven',
    className:
      'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    hint: 'Receipts from two or more independent implementations.',
  },
};

export function MaturityBadge({
  level,
  showHint = false,
}: {
  level: Maturity;
  showHint?: boolean;
}): ReactNode {
  const style = STYLES[level] ?? STYLES.draft;
  return (
    <span className="inline-flex items-baseline gap-2 align-middle">
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style.className}`}
        title={style.hint}
      >
        {style.label}
      </span>
      {showHint ? (
        <span className="text-xs text-fd-muted-foreground">{style.hint}</span>
      ) : null}
    </span>
  );
}
