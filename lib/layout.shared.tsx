import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName, gitConfig, naturateUrl } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: { title: <span className="font-semibold tracking-tight">{appName}<span className="ml-2 text-xs font-normal text-fd-muted-foreground">by Naturate</span></span> },
    links: [
      { text: 'Recipes', url: '/docs', active: 'nested-url' },
      { text: 'Work with Naturate', url: `${naturateUrl}/contact?utm_source=agent-recipes&utm_medium=navigation` },
    ],
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
