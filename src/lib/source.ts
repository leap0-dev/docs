import { InferPageType, loader, multiple } from "fumadocs-core/source";
import type { DocsCollectionEntry } from "fumadocs-mdx/runtime/server";
import { docs } from "./server-collections";
import { lucideIconsPlugin } from "fumadocs-core/source/lucide-icons";
import { openapiPlugin, openapiSource } from "fumadocs-openapi/server";
import {
  codeInterpreterOpenAPI,
  coreOpenAPI,
  desktopOpenAPI,
  metadataServiceOpenAPI,
} from "./openapi";

const [coreAPI, codeInterpreterAPI, desktopAPI, metadataServiceAPI] = await Promise.all([
  openapiSource(coreOpenAPI, {
    baseDir: "(api)/api",
    groupBy: "tag",
    meta: { folderStyle: "separator" },
  }),
  openapiSource(codeInterpreterOpenAPI, {
    baseDir: "(api)/code-interpreter/api",
    groupBy: "tag",
    meta: { folderStyle: "separator" },
  }),
  openapiSource(desktopOpenAPI, {
    baseDir: "(api)/desktop/api",
    groupBy: "tag",
    meta: { folderStyle: "separator" },
  }),
  openapiSource(metadataServiceOpenAPI, {
    baseDir: "(api)/metadata-service/api",
    groupBy: "tag",
    meta: { folderStyle: "separator" },
  }),
]);

export const source = loader({
  source: multiple({
    docs: (docs as DocsCollectionEntry).toFumadocsSource(),
    coreAPI,
    codeInterpreterAPI,
    desktopAPI,
    metadataServiceAPI,
  }),
  baseUrl: "/",
  slugs(file) {
    if (file.data.type !== "docs" || !("slug" in file.data)) return undefined;

    const slug = file.data.slug;

    if (typeof slug !== "string") return undefined;

    const normalized = slug.replace(/^\/+|\/+$/g, "");
    return normalized.length > 0 ? normalized.split("/") : [];
  },
  plugins: [lucideIconsPlugin(), openapiPlugin()],
});

export function getPageMarkdownUrl(page: InferPageType<typeof source>) {
  const path = page.slugs.join("/");

  return {
    path,
    url: `/${path}.mdx`,
  };
}
