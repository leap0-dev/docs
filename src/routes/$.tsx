import { createFileRoute, notFound } from '@tanstack/react-router';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { createServerFn } from '@tanstack/react-start';
import { getCookies } from '@tanstack/react-start/server';
import browserCollections from '@/lib/browser-collections';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
} from 'fumadocs-ui/layouts/docs/page';
import { baseOptions } from '@/lib/layout.shared';
import { TabPreferencesProvider } from '@/components/tab-preferences-provider';
import { parseTabPreferences } from '@/lib/tab-preferences';
import { filterSidebarTree, getSidebarSection } from '@/lib/sidebar-tree';
import { gitConfig } from '@/lib/shared';
import { useFumadocsLoader } from 'fumadocs-core/source/client';
import { Suspense, type ReactNode } from 'react';
import { useMDXComponents } from '@/components/mdx';
import {
  CodeInterpreterAPIPage,
  CoreAPIPage,
  DesktopAPIPage,
  MetadataServiceAPIPage,
} from '@/components/api-page';
import { OpenOptionsButton } from '@/components/page-open-options';
import { DocsFeedback } from '@/components/docs-feedback';
import { SidebarReferenceDropdown } from '@/components/sidebar-reference-dropdown';

export const Route = createFileRoute('/$')({
  component: Page,
  loader: async ({ params }) => {
    const slugs = params._splat?.split('/') ?? [];
    const data = await serverLoader({ data: slugs });
    if (data.type === 'docs') {
      await clientLoader.preload(data.path);
    }
    return data;
  },
});

const serverLoader = createServerFn({
  method: 'GET',
})
  .inputValidator((slugs: string[]) => slugs)
  .handler(async ({ data: slugs }) => {
    const { getPageMarkdownUrl, source } = await import('@/lib/source');
    const page = source.getPage(slugs);
    if (!page) throw notFound();

    const pageTree = await source.serializePageTree(source.getPageTree());

    if (page.data.type !== 'docs') {
      return {
        type: 'openapi' as const,
        title: page.data.title,
        description: page.data.description,
        url: page.url,
        initialTabPreferences: parseTabPreferences(getCookies()),
        pageTree,
        props: await page.data.getClientAPIPageProps(),
      };
    }

    return {
      type: 'docs' as const,
      path: page.path,
      url: page.url,
      markdownUrl: getPageMarkdownUrl(page).url,
      initialTabPreferences: parseTabPreferences(getCookies()),
      pageTree,
    };
  });

const clientLoader = browserCollections.docs.createClientLoader({
  component(
    { toc, frontmatter, default: MDX },
    {
      markdownUrl,
      path,
      url,
    }: {
      markdownUrl: string;
      path: string;
      url: string;
    },
  ) {
    return (
      <DocsPage toc={toc} className="max-w-none">
        <DocsTitle>{frontmatter.title}</DocsTitle>
        <DocsDescription>{frontmatter.description}</DocsDescription>
        <div className="flex flex-row gap-2 items-center border-b -mt-4 pb-6">
          <MarkdownCopyButton markdownUrl={markdownUrl} />
          <OpenOptionsButton
            markdownUrl={markdownUrl}
            githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/docs/${path}`}
          />
        </div>
        <DocsBody>
          <MDX components={useMDXComponents()} />
          <DocsFeedback pageTitle={frontmatter.title} pageUrl={url} />
        </DocsBody>
      </DocsPage>
    );
  },
});

function Page() {
  const page = useFumadocsLoader(Route.useLoaderData());
  let content: ReactNode;

  if (page.type === 'openapi') {
    const APIPageComponent = page.url.startsWith('/code-interpreter/api')
      ? CodeInterpreterAPIPage
      : page.url.startsWith('/metadata-service/api')
        ? MetadataServiceAPIPage
      : page.url.startsWith('/desktop/api')
        ? DesktopAPIPage
        : CoreAPIPage;

    content = (
      <DocsPage full className="max-w-none">
        <DocsTitle>{page.title}</DocsTitle>
        <DocsDescription>{page.description}</DocsDescription>
        <DocsBody>
          <APIPageComponent {...page.props} />
        </DocsBody>
      </DocsPage>
    );
  } else {
    content = clientLoader.useContent(page.path, {
      markdownUrl: page.markdownUrl,
      path: page.path,
      url: page.url,
    });
  }

  const tree = filterSidebarTree(page.pageTree, page.url);
  const section = getSidebarSection(page.url);

  return (
    <DocsLayout
      key={section}
      {...baseOptions()}
      tree={tree}
      containerProps={{
        className: '[--fd-layout-width:100vw]',
      }}
      sidebar={{
        banner: <SidebarReferenceDropdown />,
        collapsible: false,
      }}
      tabs={false}
    >
      <TabPreferencesProvider initialPreferences={page.initialTabPreferences}>
        <Suspense>{content}</Suspense>
      </TabPreferencesProvider>
    </DocsLayout>
  );
}
