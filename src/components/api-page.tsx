import { createClientAPIPage } from 'fumadocs-openapi/ui/create-client';

export const CoreAPIPage = createClientAPIPage({
  client: {
    storageKeyPrefix: 'leap0-docs-openapi-core-',
  },
});

export const CodeInterpreterAPIPage = createClientAPIPage({
  playground: {
    enabled: false,
  },
  client: {
    storageKeyPrefix: 'leap0-docs-openapi-code-interpreter-',
  },
});

export const DesktopAPIPage = createClientAPIPage({
  playground: {
    enabled: false,
  },
  client: {
    storageKeyPrefix: 'leap0-docs-openapi-desktop-',
  },
});

export const MetadataServiceAPIPage = createClientAPIPage({
  playground: {
    enabled: false,
  },
  client: {
    storageKeyPrefix: 'leap0-docs-openapi-metadata-service-',
  },
});
