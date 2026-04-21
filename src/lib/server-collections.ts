// @ts-nocheck
import { server } from 'fumadocs-mdx/runtime/server';

const create = server();
const docEntries = import.meta.glob('../../content/docs/**/*.mdx', { eager: true });
const metaEntries = import.meta.glob('../../content/docs/**/meta.json', {
  eager: true,
  import: 'default',
});

function normalizeEntries(entries: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(entries).map(([path, value]) => [path.replace('../../content/docs/', ''), value]),
  );
}

export const docs = await create.docs(
  'docs',
  'content/docs',
  normalizeEntries(metaEntries),
  normalizeEntries(docEntries),
);
