import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { NaturateMark } from '@/components/naturate-mark';
import { appName, gitConfig, naturateUrl } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: <span className="flex items-center gap-2 font-display font-semibold tracking-tight">
        <NaturateMark className="size-5 text-fd-primary" />
        {appName}
        <span className="text-xs font-normal text-fd-muted-foreground">by Naturate</span>
      </span>,
    },
    links: [
      { text: 'Recipes', url: '/docs', active: 'nested-url' },
      { text: 'Get the kit', url: `${naturateUrl}/recipes?utm_source=agent-recipes&utm_medium=navigation#kit` },
      { text: 'Work with Naturate', url: `${naturateUrl}/contact?utm_source=agent-recipes&utm_medium=navigation` },
    ],
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
