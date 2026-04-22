import { BookOpenText, Braces, MonitorSmartphone, SquareCode } from "lucide-react";
import type { BaseLayoutProps, LayoutTab } from "fumadocs-ui/layouts/shared";
import { Leap0Brand } from "@/components/leap0-brand";
import { githubOrgUrl } from "@/env";

function BrandTitle({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <a
      href={href}
      className={["flex w-full justify-center", className?.replace("me-auto", "")]
        .filter(Boolean)
        .join(" ")}
    >
      <Leap0Brand />
    </a>
  );
}

export const referenceTabs: LayoutTab[] = [
  {
    title: "Core",
    description: "Guides and product documentation",
    url: "/",
    icon: <BookOpenText className="size-4" />,
    urls: new Set([
      "/",
      "/quickstart",
      "/sandboxes",
      "/snapshots",
      "/templates",
      "/presigned-urls",
      "/code-interpreter",
      "/filesystem",
      "/git",
      "/lsp",
      "/process",
      "/pty",
      "/desktop",
      "/ssh",
      "/vnc",
      "/firewall",
      "/metadata-service",
      "/telemetry",
      "/api-keys",
      "/limits",
      "/public-preview",
      "/roadmap",
    ]),
  },
  {
    title: "Python SDK",
    description: "Sync and async client reference",
    url: "/reference/python-sdk",
    icon: <SquareCode className="size-4" />,
  },
  {
    title: "JavaScript SDK",
    description: "Core and services reference",
    url: "/reference/javascript-sdk",
    icon: <Braces className="size-4" />,
  },
  {
    title: "API",
    description: "Core, metadata service, code interpreter, and desktop OpenAPI reference",
    url: "/api",
    icon: <MonitorSmartphone className="size-4" />,
    urls: new Set(["/api", "/metadata-service/api", "/code-interpreter/api", "/desktop/api"]),
  },
];

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: BrandTitle,
    },
    githubUrl: githubOrgUrl,
  };
}
