import path from 'node:path';
import { createOpenAPI } from 'fumadocs-openapi/server';

const proxyUrl = '/api/proxy';

export const coreOpenAPI = createOpenAPI({
  input: [path.resolve('./schemas/leap0.yaml')],
  proxyUrl,
});

export const codeInterpreterOpenAPI = createOpenAPI({
  input: [path.resolve('./schemas/code-interpreter.yaml')],
  proxyUrl,
});

export const desktopOpenAPI = createOpenAPI({
  input: [path.resolve('./schemas/desktop.yaml')],
  proxyUrl,
});

export const metadataServiceOpenAPI = createOpenAPI({
  input: [path.resolve('./schemas/metadata-service.yaml')],
  proxyUrl,
});
