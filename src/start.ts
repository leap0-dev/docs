import { redirect } from "@tanstack/react-router";
import { createMiddleware, createStart } from "@tanstack/react-start";
import type { CustomFetch } from "@tanstack/react-start";
import { rewritePath } from "fumadocs-core/negotiation";
import { basePath } from "@/lib/base-path";
import { preloadInitialDocsContent } from "@/lib/docs-client-loader";

function withBasePath(pathname: string) {
  if (basePath === "/") return pathname;
  return `${basePath}${pathname}`;
}

void preloadInitialDocsContent();

const { rewrite: rewriteLLM } = rewritePath("/{*path}.mdx", "/llms.mdx{/*path}");

const llmMiddleware = createMiddleware().server(({ next, request }) => {
  const url = new URL(request.url);

  if (url.pathname === "/llms.mdx" || url.pathname.startsWith("/llms.mdx/")) {
    return next();
  }

  const path = rewriteLLM(url.pathname);

  if (path) {
    throw redirect({ href: path });
  }

  return next();
});

const docsServerFnFetch: CustomFetch = (input, init) => {
  const requestUrl =
    typeof input === "string"
      ? new URL(input, window.location.origin)
      : input instanceof URL
        ? new URL(input.toString())
        : new URL(input.url);

  if (requestUrl.origin === window.location.origin && requestUrl.pathname.startsWith("/_serverFn/")) {
    requestUrl.pathname = withBasePath(requestUrl.pathname);
  }

  if (input instanceof Request) {
    return fetch(new Request(requestUrl, input), init);
  }

  return fetch(requestUrl.toString(), init);
};

export const startInstance = createStart(() => ({
  requestMiddleware: [llmMiddleware],
  serverFns: {
    fetch: docsServerFnFetch,
  },
}));
