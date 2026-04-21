import type * as PageTree from 'fumadocs-core/page-tree';

type Section = 'core' | 'api' | 'python-sdk' | 'javascript-sdk';

function matchesPrefix(url: string, prefix: string) {
  return url === prefix || url.startsWith(`${prefix}/`);
}

export function getSidebarSection(url: string): Section {
  if (matchesPrefix(url, '/reference/python-sdk')) return 'python-sdk';
  if (matchesPrefix(url, '/reference/javascript-sdk')) return 'javascript-sdk';
  if (
    matchesPrefix(url, '/api') ||
    matchesPrefix(url, '/code-interpreter/api') ||
    matchesPrefix(url, '/desktop/api') ||
    matchesPrefix(url, '/metadata-service/api')
  ) {
    return 'api';
  }

  return 'core';
}

function matcherFor(section: Section) {
  switch (section) {
    case 'python-sdk':
      return (url: string) => matchesPrefix(url, '/reference/python-sdk');
    case 'javascript-sdk':
      return (url: string) => matchesPrefix(url, '/reference/javascript-sdk');
    case 'api':
      return (url: string) =>
        matchesPrefix(url, '/api') ||
        matchesPrefix(url, '/code-interpreter/api') ||
        matchesPrefix(url, '/desktop/api') ||
        matchesPrefix(url, '/metadata-service/api');
    case 'core':
      return (url: string) =>
        !matchesPrefix(url, '/reference') &&
        !matchesPrefix(url, '/api') &&
        !matchesPrefix(url, '/code-interpreter/api') &&
        !matchesPrefix(url, '/desktop/api') &&
        !matchesPrefix(url, '/metadata-service/api');
  }
}

function filterNode(
  node: PageTree.Root['children'][number],
  matches: (url: string) => boolean,
): PageTree.Root['children'][number] | null {
  if (node.type === 'separator') return node;

  if (node.type === 'page') {
    return matches(node.url) ? node : null;
  }

  const index = node.index && matches(node.index.url) ? node.index : undefined;
  const children = cleanupSeparators(
    node.children
    .map((child) => filterNode(child, matches))
    .filter((child): child is PageTree.Root['children'][number] => child !== null),
  );

  if (!index && children.length === 0) return null;

  return {
    ...node,
    index,
    children,
  };
}

function cleanupSeparators(nodes: PageTree.Root['children']): PageTree.Root['children'] {
  const cleaned: PageTree.Root['children'] = [];

  for (const node of nodes) {
    if (node.type === 'separator') {
      const prev = cleaned.at(-1);
      if (prev?.type === 'separator') continue;
    }

    cleaned.push(node);
  }

  while (cleaned.at(-1)?.type === 'separator') cleaned.pop();

  return cleaned;
}

function unwrapSingleFolder(nodes: PageTree.Root['children']): PageTree.Root['children'] {
  if (nodes.length !== 1) return nodes;

  const [only] = nodes;
  if (only.type !== 'folder') return nodes;

  return cleanupSeparators([
    ...(only.index ? [only.index] : []),
    ...only.children,
  ]);
}

export function filterSidebarTree(tree: PageTree.Root, url: string): PageTree.Root {
  const matches = matcherFor(getSidebarSection(url));
  const children = cleanupSeparators(
    tree.children
      .map((child) => filterNode(child, matches))
      .filter((child): child is PageTree.Root['children'][number] => child !== null),
  );

  return {
    ...tree,
    children: unwrapSingleFolder(children),
  };
}
