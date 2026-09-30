import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import { appName, appTagline } from '@/lib/shared';

const inter = Inter({ subsets: ['latin'] });
// Indexing remains an explicit release setting. Noindex is not access control.
const indexable = process.env.PUBLIC_INDEX === 'true';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agentrecipes-ai.vercel.app';
const homeTitle = 'Agent Recipes by Naturate — practical AI implementation guides';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: homeTitle, template: `%s — ${appName}` },
  description: appTagline,
  applicationName: appName,
  keywords: ['AI recipes', 'agent recipes', 'MCP integration', 'AI admin tools', 'agent handoffs', 'LLM in production'],
  alternates: { canonical: '/' },
  openGraph: { type: 'website', siteName: appName, url: siteUrl, title: homeTitle, description: appTagline },
  twitter: { card: 'summary_large_image', title: homeTitle, description: appTagline },
  robots: indexable ? undefined : { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};
export default function Layout({ children }: LayoutProps<'/'>) {
  return <html lang="en" className={inter.className} suppressHydrationWarning><body className="flex flex-col min-h-screen"><RootProvider theme={{ defaultTheme: 'light' }}>{children}</RootProvider></body></html>;
}
