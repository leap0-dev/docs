import { createFileRoute, notFound } from "@tanstack/react-router";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { createServerFn } from "@tanstack/react-start";
import { getCookies } from "@tanstack/react-start/server";
import browserCollections from "@/lib/browser-collections";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
} from "fumadocs-ui/layouts/docs/page";
import { baseOptions } from "@/lib/layout.shared";
import { TabPreferencesProvider } from "@/components/tab-preferences-provider";
import { parseTabPreferences } from "@/lib/tab-preferences";
import { filterSidebarTree, getSidebarScope, getSidebarSection } from "@/lib/sidebar-tree";
import { useFumadocsLoader } from "fumadocs-core/source/client";
import { Suspense, type ReactNode } from "react";
import { useMDXComponents } from "@/components/mdx";
import {
  CodeInterpreterAPIPage,
  CoreAPIPage,
  DesktopAPIPage,
  MetadataServiceAPIPage,
} from "@/components/api-page";
import { OpenOptionsButton } from "@/components/page-open-options";
import { DocsFeedback } from "@/components/docs-feedback";
import { SidebarReferenceDropdown } from "@/components/sidebar-reference-dropdown";
import { DocsTopHeader } from "@/components/docs-top-header";
import { DocsLayoutContainer } from "@/components/docs-layout-container";

const SLUG_SEGMENT_PATTERN = /^[A-Za-z0-9._-]{1,128}$/;

function sanitizeSlugs(slugs: string[]): string[] | null {
  const sanitized = slugs.filter(Boolean);
  if (sanitized.length !== slugs.length) return null;
  if (!sanitized.every((slug) => SLUG_SEGMENT_PATTERN.test(slug))) return null;

  return sanitized;
}

export const Route = createFileRoute("/$")({
  component: Page,
  loader: async ({ params }) => {
    const slugs = sanitizeSlugs(params._splat?.split("/").filter(Boolean) ?? []);
    if (!slugs) throw notFound();

    const data = await serverLoader({ data: slugs });
    if (data.type === "docs") {
      await clientLoader.preload(data.path);
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

const clientLoader = browserCollections.docs.createClientLoader({
  component: function DocsContent(
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
    const mdxComponents = useMDXComponents();

    return (
      <DocsPage toc={toc} className="max-w-none">
        <DocsTitle>{frontmatter.title}</DocsTitle>
        <DocsDescription>{frontmatter.description}</DocsDescription>
        <div className="flex flex-row gap-2 items-center border-b -mt-4 pb-6">
          <MarkdownCopyButton markdownUrl={markdownUrl} />
          <OpenOptionsButton
            markdownUrl={markdownUrl}
            githubUrl={`https://github.com/leap0-dev/docs/blob/main/content/docs/${path}`}
          />
        </div>
        <DocsBody>
          <MDX components={mdxComponents} />
          <DocsFeedback pageTitle={frontmatter.title} pageUrl={url} />
        </DocsBody>
      </DocsPage>
    );
  },
});

function Page() {
  const page = useFumadocsLoader(Route.useLoaderData());
  let content: ReactNode;

  if (page.type === "openapi") {
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
    content = clientLoader.useContent(page.path, {
      markdownUrl: page.markdownUrl,
      path: page.path,
      url: page.url,
    });
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
        banner: <SidebarReferenceDropdown />,
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
