import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { MaturityBadge } from '@/components/maturity-badge';
import { SkillDownload, SkillFiles } from '@/components/skill-download';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    MaturityBadge,
    SkillDownload,
    SkillFiles,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
