import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import * as React from "react";
import appCss from "../styles/app.css?url";
import faviconIcoUrl from "/favicon.ico";
import faviconSvgUrl from "/favicon.svg";
import { DefaultNotFound } from "fumadocs-ui/layouts/home/not-found";
import { RootProvider } from "fumadocs-ui/provider/tanstack";
import { PostHogInit } from "@/components/posthog-init";
import { withBase } from "@/lib/base-path";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Leap0 Docs",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: faviconIcoUrl, sizes: "any" },
      { rel: "icon", type: "image/svg+xml", href: faviconSvgUrl },
    ],
  }),
  notFoundComponent: DefaultNotFound,
  component: RootComponent,
});

function RootComponent() {
  return (
    <html suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="flex flex-col min-h-screen">
        <RootProvider
          search={{
            options: {
              api: withBase("/api/search"),
            },
          }}
        >
          <PostHogInit />
          <Outlet />
        </RootProvider>
        <Scripts />
      </body>
    </html>
  );
}
