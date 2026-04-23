import { createFileRoute, notFound } from "@tanstack/react-router";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { createServerFn } from "@tanstack/react-start";
import { getCookies } from "@tanstack/react-start/server";
import type { Root } from "fumadocs-core/page-tree";
import type { ClientApiPageProps } from "fumadocs-openapi/ui/create-client";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page";
import { baseOptions } from "@/lib/layout.shared";
import { TabPreferencesProvider } from "@/components/tab-preferences-provider";
import { parseTabPreferences } from "@/lib/tab-preferences";
import { filterSidebarTree, getSidebarScope, getSidebarSection } from "@/lib/sidebar-tree";
import { useFumadocsLoader } from "fumadocs-core/source/client";
import { Suspense, type ReactNode } from "react";
import {
  CodeInterpreterAPIPage,
  CoreAPIPage,
  DesktopAPIPage,
  MetadataServiceAPIPage,
} from "@/components/api-page";
import { SidebarDropdown } from "@/components/sidebar-dropdown";
import { DocsTopHeader } from "@/components/docs-top-header";
import { DocsLayoutContainer } from "@/components/docs-layout-container";
import type { HTMLAttributes } from "react";
import { docsClientLoader } from "@/lib/docs-client-loader";

type OpenApiPageData = {
  type: "openapi";
  title: string;
  description: string;
  url: string;
  initialTabPreferences: ReturnType<typeof parseTabPreferences>;
  pageTree: Root;
  props: ClientApiPageProps;
};

type DocsPageData = {
  type: "docs";
  path: string;
  url: string;
  markdownUrl: string;
  initialTabPreferences: ReturnType<typeof parseTabPreferences>;
  pageTree: OpenApiPageData["pageTree"];
};

type RoutePageData = DocsPageData | OpenApiPageData;

const SLUG_SEGMENT_PATTERN = /^[A-Za-z0-9._-]{1,128}$/;

function sanitizeSlugs(slugs: string[]): string[] | null {
  const sanitized = slugs.filter(Boolean);
  if (sanitized.length !== slugs.length) return null;
  if (!sanitized.every((slug) => SLUG_SEGMENT_PATTERN.test(slug))) return null;

  return sanitized;
}

export const Route = createFileRoute("/$")({
  head: ({ loaderData }) => {
    const data = loaderData as RoutePageData | undefined;
    return data?.type === "docs"
      ? {
          meta: [{ name: "leap0-doc-path", content: data.path }],
        }
      : {};
  },
  component: Page,
  loader: async ({ params }) => {
    const slugs = sanitizeSlugs(params._splat?.split("/").filter(Boolean) ?? []);
    if (!slugs) throw notFound();

    const data = await serverLoader({ data: slugs });
    if (data.type === "docs") {
      await docsClientLoader.preload(data.path);
    }
    return data;
  },
});

const serverLoader = createServerFn({
  method: "GET",
})
  .inputValidator((slugs: string[]) => sanitizeSlugs(slugs))
  .handler(async ({ data: slugs }) => {
    if (!slugs) throw notFound();

    const { getPageMarkdownUrl, source } = await import("@/lib/source");
    const page = source.getPage(slugs);
    if (!page) throw notFound();

    const pageTree = await source.serializePageTree(source.getPageTree());

    if (page.data.type !== "docs") {
      return {
        type: "openapi" as const,
        title: page.data.title,
        description: page.data.description,
        url: page.url,
        initialTabPreferences: parseTabPreferences(getCookies()),
        pageTree,
        props: await page.data.getClientAPIPageProps(),
      };
    }

    return {
      type: "docs" as const,
      path: page.path,
      url: page.url,
      markdownUrl: getPageMarkdownUrl(page).url,
      initialTabPreferences: parseTabPreferences(getCookies()),
      pageTree,
    };
  });

function Page() {
  const page = useFumadocsLoader(Route.useLoaderData()) as RoutePageData | undefined;
  if (!page) {
    throw notFound();
  }

  let content: ReactNode;

  if ("type" in page && page.type === "openapi") {
    const APIPageComponent = page.url.startsWith("/code-interpreter/api")
      ? CodeInterpreterAPIPage
      : page.url.startsWith("/metadata-service/api")
        ? MetadataServiceAPIPage
        : page.url.startsWith("/desktop/api")
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
    content = docsClientLoader.useContent(page.path, {
      markdownUrl: page.markdownUrl,
      path: page.path,
      url: page.url,
    });
  }

  const tree = filterSidebarTree(page.pageTree, page.url);
  const section = getSidebarSection(page.url);
  const scope = getSidebarScope(page.url);
  const containerProps = {
    className: "[--fd-layout-width:100vw]",
    "data-openapi-layout": page.type === "openapi" ? "true" : undefined,
  } as HTMLAttributes<HTMLDivElement> & { "data-openapi-layout"?: string };

  return (
      <DocsLayout
        key={`${section}:${scope}`}
        {...baseOptions()}
        tree={tree}
        containerProps={containerProps}
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
        <Suspense>{content}</Suspense>
      </TabPreferencesProvider>
    </DocsLayout>
  );
}
