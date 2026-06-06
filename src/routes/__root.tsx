import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import * as React from "react";
import appCss from "../styles/app.css?url";
import faviconIcoUrl from "/favicon.ico";
import faviconSvgUrl from "/favicon.svg";
import ogImagePath from "/og-image.png";
import logoPath from "/logo-large.png";
import { DefaultNotFound } from "fumadocs-ui/layouts/home/not-found";
import { RootProvider } from "fumadocs-ui/provider/tanstack";
import { PostHogInit } from "@/components/posthog-init";
import { withBase } from "@/lib/base-path";
import { siteOrigin, siteUrl } from "@/env";

const siteTitle = "Leap0 Docs";
const siteDescription =
  "Documentation for Leap0 — cloud sandboxes for AI agents and developers.";
const ogImageUrl = `${siteOrigin}${ogImagePath}`;
const ogLogoUrl = `${siteOrigin}${logoPath}`;

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
        title: siteTitle,
      },
      // OpenGraph
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "en_US" },
      { property: "og:site_name", content: siteTitle },
      { property: "og:title", content: siteTitle },
      { property: "og:description", content: siteDescription },
      { property: "og:url", content: siteUrl || "" },
      { property: "og:image", content: ogImageUrl },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:logo", content: ogLogoUrl },
      // Twitter / X
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: siteTitle },
      { name: "twitter:description", content: siteDescription },
      { name: "twitter:image", content: ogImageUrl },
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
