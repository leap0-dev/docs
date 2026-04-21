import { InferPageType, loader, multiple } from 'fumadocs-core/source';
import { docs } from 'collections/server';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { openapiPlugin, openapiSource } from 'fumadocs-openapi/server';
import { docsContentRoute, docsRoute } from './shared';
import { codeInterpreterOpenAPI, coreOpenAPI, desktopOpenAPI, metadataServiceOpenAPI } from './openapi';

const [coreAPI, codeInterpreterAPI, desktopAPI, metadataServiceAPI] = await Promise.all([
  openapiSource(coreOpenAPI, {
    baseDir: '(api)/api',
  }),
  openapiSource(codeInterpreterOpenAPI, {
    baseDir: '(api)/code-interpreter/api',
  }),
  openapiSource(desktopOpenAPI, {
    baseDir: '(api)/desktop/api',
  }),
  openapiSource(metadataServiceOpenAPI, {
    baseDir: '(api)/metadata-service/api',
  }),
]);

export const source = loader({
  source: multiple({
    docs: docs.toFumadocsSource(),
    coreAPI,
    codeInterpreterAPI,
    desktopAPI,
    metadataServiceAPI,
  }),
  baseUrl: docsRoute,
  slugs(file) {
    if (file.data.type !== 'docs' || !('slug' in file.data)) return undefined;

    const slug = file.data.slug;

    if (typeof slug !== 'string') return undefined;

    const normalized = slug.replace(/^\/+|\/+$/g, '');
    return normalized.length > 0 ? normalized.split('/') : [];
  },
  plugins: [lucideIconsPlugin(), openapiPlugin()],
});

export function getPageMarkdownUrl(page: InferPageType<typeof source>) {
  const segments = [...page.slugs, 'content.md'];

  return {
    segments,
    url: `${docsContentRoute}/${segments.join('/')}`,
  };
}

export async function getLLMText(page: InferPageType<typeof source>) {
  if (page.data.type !== 'docs') {
    return `# ${page.data.title} (${page.url})

${page.data.description ?? ''}`;
  }

  const processed = await page.data.getText('processed');

  return `# ${page.data.title} (${page.url})

${processed}`;
}
