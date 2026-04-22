import { createOpenAPI } from "fumadocs-openapi/server";
import { parse } from "yaml";
import codeInterpreterSchema from "../../schemas/code-interpreter.yaml?raw";
import desktopSchema from "../../schemas/desktop.yaml?raw";
import leap0Schema from "../../schemas/leap0.yaml?raw";
import metadataServiceSchema from "../../schemas/metadata-service.yaml?raw";

const proxyUrl = "/api/proxy";
const schemaMap = {
  "leap0.yaml": parse(leap0Schema),
  "code-interpreter.yaml": parse(codeInterpreterSchema),
  "desktop.yaml": parse(desktopSchema),
  "metadata-service.yaml": parse(metadataServiceSchema),
};

export const coreOpenAPI = createOpenAPI({
  input: () => ({ "leap0.yaml": schemaMap["leap0.yaml"] }),
  proxyUrl,
});

export const codeInterpreterOpenAPI = createOpenAPI({
  input: () => ({ "code-interpreter.yaml": schemaMap["code-interpreter.yaml"] }),
  proxyUrl,
});

export const desktopOpenAPI = createOpenAPI({
  input: () => ({ "desktop.yaml": schemaMap["desktop.yaml"] }),
  proxyUrl,
});

export const metadataServiceOpenAPI = createOpenAPI({
  input: () => ({ "metadata-service.yaml": schemaMap["metadata-service.yaml"] }),
  proxyUrl,
});
