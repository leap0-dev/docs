import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getCookies } from "@tanstack/react-start/server";
import browserCollections from "@/lib/browser-collections";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
} from "fumadocs-ui/layouts/docs/page";
import { useFumadocsLoader } from "fumadocs-core/source/client";
import { Suspense } from "react";
import { DocsFeedback } from "@/components/docs-feedback";
import { OpenOptionsButton } from "@/components/page-open-options";
import { useMDXComponents } from "@/components/mdx";
import { baseOptions } from "@/lib/layout.shared";
import { TabPreferencesProvider } from "@/components/tab-preferences-provider";
import { parseTabPreferences } from "@/lib/tab-preferences";
import { filterSidebarTree, getSidebarSection } from "@/lib/sidebar-tree";
import { gitConfig } from "@/lib/shared";
import { SidebarReferenceDropdown } from "@/components/sidebar-reference-dropdown";

export const Route = createFileRoute("/")({
  component: Page,
  loader: async () => {
    const data = await serverLoader();
    await clientLoader.preload(data.path);
    return data;
  },
});

const serverLoader = createServerFn({
  method: "GET",
}).handler(async () => {
  const { getPageMarkdownUrl, source } = await import("@/lib/source");
  const page = source.getPage([]);
  if (!page || page.data.type !== "docs") throw notFound();

  return {
    path: page.path,
    url: page.url,
    markdownUrl: getPageMarkdownUrl(page).url,
    initialTabPreferences: parseTabPreferences(getCookies()),
    pageTree: await source.serializePageTree(source.getPageTree()),
  };
});

const clientLoader = browserCollections.docs.createClientLoader({
  component: function IndexDocsContent(
    { toc, frontmatter, default: MDX },
    { markdownUrl, path }: { markdownUrl: string; path: string },
  ) {
    const mdxComponents = useMDXComponents();

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
          <MDX components={mdxComponents} />
          <DocsFeedback pageTitle={frontmatter.title} pageUrl="/" />
        </DocsBody>
      </DocsPage>
    );
  },
});

function Page() {
  const page = useFumadocsLoader(Route.useLoaderData());
  const tree = filterSidebarTree(page.pageTree, page.url);
  const section = getSidebarSection(page.url);

  return (
    <DocsLayout
      key={section}
      {...baseOptions()}
      tree={tree}
      containerProps={{
        className: "[--fd-layout-width:100vw]",
      }}
      sidebar={{
        banner: <SidebarReferenceDropdown />,
        collapsible: false,
      }}
      tabs={false}
    >
      <TabPreferencesProvider initialPreferences={page.initialTabPreferences}>
        <Suspense>
          {clientLoader.useContent(page.path, {
            markdownUrl: page.markdownUrl,
            path: page.path,
          })}
        </Suspense>
      </TabPreferencesProvider>
    </DocsLayout>
  );
}
