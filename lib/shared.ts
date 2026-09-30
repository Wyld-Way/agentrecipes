export const appName = 'Agent Recipes';
export const appTagline = 'Practical AI implementation guides by Naturate. Connect services, coordinate agents and build useful tools.';
export const naturateUrl = 'https://www.naturate.io';
export const docsRoute = '/docs';
export const docsImageRoute = '/og/docs';
export const docsContentRoute = '/llms.mdx/docs';
export const gitConfig = { user: 'Wyld-Way', repo: 'agentrecipes', branch: 'main' };
export const kitUrl = (medium: string, content?: string) => {
  const url = new URL('/recipes', naturateUrl);
  url.searchParams.set('utm_source', 'agent-recipes');
  url.searchParams.set('utm_medium', medium);
  if (content) url.searchParams.set('utm_content', content);
  url.hash = 'kit';
  return url.toString();
};
