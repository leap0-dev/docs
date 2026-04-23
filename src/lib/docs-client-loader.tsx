import browserCollections from "@/lib/browser-collections";
import { DocsFeedback } from "@/components/docs-feedback";
import { OpenOptionsButton } from "@/components/page-open-options";
import { useMDXComponents } from "@/components/mdx";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
} from "fumadocs-ui/layouts/docs/page";

export const docsClientLoader = browserCollections.docs.createClientLoader({
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

export async function preloadInitialDocsContent() {
  if (typeof document === "undefined") return;

  const path = document
    .querySelector('meta[name="leap0-doc-path"]')
    ?.getAttribute("content");

  if (!path) return;
  await docsClientLoader.preload(path);
}
