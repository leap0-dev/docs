// @ts-nocheck
import { server } from "fumadocs-mdx/runtime/server";

const create = server<{ docs: any }>();
const docEntries = import.meta.glob("../../content/docs/**/*.{mdx,md}", {
  eager: true,
  query: {
    collection: "docs",
  },
});
const rawDocEntries = import.meta.glob("../../content/docs/**/*.mdx", {
  eager: true,
  query: "?raw",
  import: "default",
});
const metaEntries = import.meta.glob("../../content/docs/**/*.{json,yaml}", {
  eager: true,
  query: {
    collection: "docs",
  },
  import: "default",
});

function normalizeEntries(entries: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(entries).map(([path, value]) => [
      path.replace("../../content/docs/", ""),
      value,
    ]),
  );
}

export const docs = await create.docs(
  "docs",
  "content/docs",
  normalizeEntries(metaEntries),
  normalizeEntries(docEntries),
);

export const rawDocs = normalizeEntries(rawDocEntries) as Record<string, string>;
