import type { MetadataRoute } from 'next';
import { source } from '@/lib/source';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agentrecipes-ai.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = source.getPages().map((page) => ({
    url: new URL(page.url, siteUrl).toString(),
    changeFrequency: 'weekly' as const,
    priority: page.url === '/docs' ? 0.9 : 0.7,
  }));

  return [
    {
      url: new URL('/', siteUrl).toString(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...pages,
  ];
}
