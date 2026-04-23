import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getCookies } from "@tanstack/react-start/server";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { useFumadocsLoader } from "fumadocs-core/source/client";
import { Suspense } from "react";
import { baseOptions } from "@/lib/layout.shared";
import { TabPreferencesProvider } from "@/components/tab-preferences-provider";
import { parseTabPreferences } from "@/lib/tab-preferences";
import { filterSidebarTree, getSidebarScope, getSidebarSection } from "@/lib/sidebar-tree";
import { SidebarDropdown } from "@/components/sidebar-dropdown";
import { DocsTopHeader } from "@/components/docs-top-header";
import { DocsLayoutContainer } from "@/components/docs-layout-container";
import { docsClientLoader } from "@/lib/docs-client-loader";

export const Route = createFileRoute("/")({
  head: ({ loaderData }) =>
    loaderData
      ? {
          meta: [{ name: "leap0-doc-path", content: loaderData.path }],
        }
      : {},
  component: Page,
  loader: async () => {
    const data = await serverLoader();
    await docsClientLoader.preload(data.path);
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

function Page() {
  const page = useFumadocsLoader(Route.useLoaderData());
  if (!page) {
    throw notFound();
  }

  const tree = filterSidebarTree(page.pageTree, page.url);
  const section = getSidebarSection(page.url);
  const scope = getSidebarScope(page.url);

  return (
    <DocsLayout
      key={`${section}:${scope}`}
      {...baseOptions()}
      tree={tree}
      containerProps={{
        className: "[--fd-layout-width:100vw]",
      }}
          sidebar={{
            banner: <SidebarDropdown currentPath={page.url} />,
            collapsible: false,
          }}
      slots={{
        container: DocsLayoutContainer,
        header: DocsTopHeader,
      }}
      tabs={false}
    >
      <TabPreferencesProvider initialPreferences={page.initialTabPreferences}>
        <Suspense>
          {docsClientLoader.useContent(page.path, {
            markdownUrl: page.markdownUrl,
            path: page.path,
            url: page.url,
          })}
        </Suspense>
      </TabPreferencesProvider>
    </DocsLayout>
  );
}
