import type * as PageTree from "fumadocs-core/page-tree";

type Section = "core" | "api" | "python-sdk" | "javascript-sdk";

const SECTION_PREFIXES: Record<Exclude<Section, "core">, string[]> = {
  "python-sdk": ["/reference/python-sdk"],
  "javascript-sdk": ["/reference/javascript-sdk"],
  api: ["/api", "/code-interpreter/api", "/desktop/api", "/metadata-service/api"],
};

function matchesPrefix(url: string, prefix: string) {
  return url === prefix || url.startsWith(`${prefix}/`);
}

function matchesAnyPrefix(url: string, prefixes: string[]) {
  return prefixes.some((prefix) => matchesPrefix(url, prefix));
}

export function getSidebarSection(url: string): Section {
  for (const [section, prefixes] of Object.entries(SECTION_PREFIXES)) {
    if (matchesAnyPrefix(url, prefixes)) return section as Exclude<Section, "core">;
  }

  return "core";
}

function matcherFor(section: Section) {
  const nonCorePrefixes = Object.values(SECTION_PREFIXES).flat();

  switch (section) {
    case "python-sdk":
    case "javascript-sdk":
    case "api":
      return (url: string) => matchesAnyPrefix(url, SECTION_PREFIXES[section]);
    case "core":
      return (url: string) =>
        !matchesAnyPrefix(url, nonCorePrefixes) && !matchesPrefix(url, "/reference");
  }
}

function filterNode(
  node: PageTree.Root["children"][number],
  matches: (url: string) => boolean,
): PageTree.Root["children"][number] | null {
  if (node.type === "separator") return node;

  if (node.type === "page") {
    return matches(node.url) ? node : null;
  }

  const index = node.index && matches(node.index.url) ? node.index : undefined;
  const children = cleanupSeparators(
    node.children
      .map((child) => filterNode(child, matches))
      .filter((child): child is PageTree.Root["children"][number] => child !== null),
  );

  if (!index && children.length === 0) return null;

  return {
    ...node,
    index,
    children,
  };
}

function cleanupSeparators(nodes: PageTree.Root["children"]): PageTree.Root["children"] {
  const cleaned: PageTree.Root["children"] = [];

  for (const node of nodes) {
    if (node.type === "separator") {
      const prev = cleaned.at(-1);
      if (prev?.type === "separator") continue;
    }

    cleaned.push(node);
  }

  while (cleaned.at(-1)?.type === "separator") cleaned.pop();

  return cleaned;
}

function unwrapSingleFolder(nodes: PageTree.Root["children"]): PageTree.Root["children"] {
  if (nodes.length !== 1) return nodes;

  const [only] = nodes;
  if (only.type !== "folder") return nodes;

  return cleanupSeparators([...(only.index ? [only.index] : []), ...only.children]);
}

export function filterSidebarTree(tree: PageTree.Root, url: string): PageTree.Root {
  const matches = matcherFor(getSidebarSection(url));
  const children = cleanupSeparators(
    tree.children
      .map((child) => filterNode(child, matches))
      .filter((child): child is PageTree.Root["children"][number] => child !== null),
  );

  return {
    ...tree,
    children: unwrapSingleFolder(children),
  };
}
