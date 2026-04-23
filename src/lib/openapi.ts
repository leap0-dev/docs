import { createOpenAPI } from "fumadocs-openapi/server";
import { parse } from "yaml";
import codeInterpreterSchema from "../../schemas/code-interpreter.yaml?raw";
import desktopSchema from "../../schemas/desktop.yaml?raw";
import leap0Schema from "../../schemas/leap0.yaml?raw";
import metadataServiceSchema from "../../schemas/metadata-service.yaml?raw";

export const openApiSchemaRawMap = {
  "leap0.yaml": leap0Schema,
  "code-interpreter.yaml": codeInterpreterSchema,
  "desktop.yaml": desktopSchema,
  "metadata-service.yaml": metadataServiceSchema,
} as const;

const schemaMap = {
  "leap0.yaml": parse(leap0Schema),
  "code-interpreter.yaml": parse(codeInterpreterSchema),
  "desktop.yaml": parse(desktopSchema),
  "metadata-service.yaml": parse(metadataServiceSchema),
};

export type OpenApiSchemaId = keyof typeof openApiSchemaRawMap;

export function getOpenApiSchemaRaw(schemaId: string) {
  return openApiSchemaRawMap[schemaId as OpenApiSchemaId];
}

export function getOpenApiSchema(schemaId: string) {
  return schemaMap[schemaId as keyof typeof schemaMap];
}

const openApiProxyUrl = `${import.meta.env.BASE_URL}api/proxy`;

export const coreOpenAPI = createOpenAPI({
  input: () => ({ "leap0.yaml": schemaMap["leap0.yaml"] }),
  proxyUrl: openApiProxyUrl,
});

export const codeInterpreterOpenAPI = createOpenAPI({
  input: () => ({ "code-interpreter.yaml": schemaMap["code-interpreter.yaml"] }),
  proxyUrl: openApiProxyUrl,
});

export const desktopOpenAPI = createOpenAPI({
  input: () => ({ "desktop.yaml": schemaMap["desktop.yaml"] }),
  proxyUrl: openApiProxyUrl,
});

export const metadataServiceOpenAPI = createOpenAPI({
  input: () => ({ "metadata-service.yaml": schemaMap["metadata-service.yaml"] }),
  proxyUrl: openApiProxyUrl,
});
