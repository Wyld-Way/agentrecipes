import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import { appName, appTagline } from '@/lib/shared';

const inter = Inter({
  subsets: ['latin'],
});

// HARD CONSTRAINT (agentrecipes #199/#185): ship noindex until Johan flips
// go-live. Deploying to the Vercel subdomain is fine (verification), but making
// it publicly indexed/announced is an OUTWARD PUBLISH — Johan's gate. To go
// live: set env PUBLIC_INDEX=true (or remove this guard). Same pattern as
// mindfulagent.rewyld.earth.
const indexable = process.env.PUBLIC_INDEX === 'true';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agentrecipes.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: appName,
    template: `%s — ${appName}`,
  },
  description: appTagline,
  robots: indexable
    ? undefined
    : {
        index: false,
        follow: false,
        nocache: true,
        googleBot: { index: false, follow: false },
      },
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
