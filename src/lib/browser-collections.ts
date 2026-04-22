// @ts-nocheck
import { browser } from "fumadocs-mdx/runtime/browser";

const create = browser<any, any>();
const docsEntries = import.meta.glob("../../content/docs/**/*.mdx");

const normalizedDocsEntries = Object.fromEntries(
  Object.entries(docsEntries).map(([path, loader]) => [
    path.replace("../../content/docs/", ""),
    loader,
  ]),
);

const browserCollections = {
  docs: create.doc("docs", normalizedDocsEntries),
};

export default browserCollections;
