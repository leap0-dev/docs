import type * as PageTree from "fumadocs-core/page-tree";

type Section = "core" | "sdks" | "apis";
type SidebarScope =
  | "core"
  | "python-sdk"
  | "javascript-sdk"
  | "api"
  | "metadata-service-api"
  | "code-interpreter-api"
  | "desktop-api";

const SIDEBAR_SCOPE_PREFIXES: Record<Exclude<SidebarScope, "core">, string[]> = {
  "python-sdk": ["/reference/python-sdk"],
  "javascript-sdk": ["/reference/javascript-sdk"],
  api: ["/api"],
  "metadata-service-api": ["/metadata-service/api"],
  "code-interpreter-api": ["/code-interpreter/api"],
  "desktop-api": ["/desktop/api"],
};

const SECTION_PREFIXES: Record<Exclude<Section, "core">, string[]> = {
  sdks: [
    ...SIDEBAR_SCOPE_PREFIXES["python-sdk"],
    ...SIDEBAR_SCOPE_PREFIXES["javascript-sdk"],
  ],
  apis: [
    ...SIDEBAR_SCOPE_PREFIXES.api,
    ...SIDEBAR_SCOPE_PREFIXES["metadata-service-api"],
    ...SIDEBAR_SCOPE_PREFIXES["code-interpreter-api"],
    ...SIDEBAR_SCOPE_PREFIXES["desktop-api"],
  ],
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

export function getSidebarScope(url: string): SidebarScope {
  for (const [scope, prefixes] of Object.entries(SIDEBAR_SCOPE_PREFIXES)) {
    if (matchesAnyPrefix(url, prefixes)) return scope as Exclude<SidebarScope, "core">;
  }

  return "core";
}

function matcherFor(scope: SidebarScope) {
  const nonCorePrefixes = Object.values(SIDEBAR_SCOPE_PREFIXES).flat();

  switch (scope) {
    case "python-sdk":
    case "javascript-sdk":
    case "api":
    case "metadata-service-api":
    case "code-interpreter-api":
    case "desktop-api":
      return (url: string) => matchesAnyPrefix(url, SIDEBAR_SCOPE_PREFIXES[scope]);
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
  const matches = matcherFor(getSidebarScope(url));
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
