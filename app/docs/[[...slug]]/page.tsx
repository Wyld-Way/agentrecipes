import { getPageImage, getPageMarkdownUrl, source } from '@/lib/source';
import { DocsBody, DocsDescription, DocsPage, DocsTitle, MarkdownCopyButton, ViewOptionsPopover } from 'fumadocs-ui/layouts/docs/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { gitConfig } from '@/lib/shared';
import { RecipeJsonLd } from '@/components/json-ld';
import { RecipeCatalog } from '@/components/recipe-catalog';
import { RecipeCTA } from '@/components/recipe-cta';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://agentrecipes-ai.vercel.app';

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();
  const MDX = page.data.body;
  const markdownUrl = getPageMarkdownUrl(page).url;
  const absoluteUrl = new URL(page.url, siteUrl).toString();
  return <DocsPage toc={page.data.toc} full={page.data.full}>
    <RecipeJsonLd url={absoluteUrl} title={page.data.title} description={page.data.description} system={page.data.system} steps={page.data.steps} />
    <DocsTitle>{page.data.title}</DocsTitle>
    <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
    <div className="flex flex-row gap-2 items-center border-b pb-6">
      <MarkdownCopyButton markdownUrl={markdownUrl} />
      <ViewOptionsPopover markdownUrl={markdownUrl} githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/docs/${page.path}`} />
    </div>
    <DocsBody><MDX components={getMDXComponents({ a: createRelativeLink(source, page) })} /></DocsBody>
    {page.slugs.length === 0 && <RecipeCatalog />}
    {page.data.recipe && <RecipeCTA slug={page.slugs.join('/')} />}
  </DocsPage>;
}

export async function generateStaticParams() { return source.generateParams(); }
export async function generateMetadata(props: PageProps<'/docs/[[...slug]]'>): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();
  const image = getPageImage(page).url;
  return {
    title: page.data.title, description: page.data.description, alternates: { canonical: page.url },
    openGraph: { type: 'article', url: page.url, title: page.data.title, description: page.data.description, images: image },
    twitter: { card: 'summary_large_image', title: page.data.title, description: page.data.description, images: image },
  };
}
