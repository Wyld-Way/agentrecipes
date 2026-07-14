import type { MetadataRoute } from 'next';

// HARD CONSTRAINT (agentrecipes #199/#185): while gated (no PUBLIC_INDEX), the
// robots.txt disallows all crawling. Flip PUBLIC_INDEX=true at go-live (Johan's
// outward-publish gate) to open it up.
const indexable = process.env.PUBLIC_INDEX === 'true';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agentrecipes-ai.vercel.app';

export default function robots(): MetadataRoute.Robots {
  if (!indexable) {
    return {
      rules: { userAgent: '*', disallow: '/' },
    };
  }
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: new URL('/sitemap.xml', siteUrl).toString(),
  };
}
