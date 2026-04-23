import { BookOpenText, Braces, MonitorSmartphone, SquareCode } from "lucide-react";
import type { BaseLayoutProps, LayoutTab } from "fumadocs-ui/layouts/shared";
import { Leap0Brand } from "@/components/leap0-brand";
import { githubOrgUrl } from "@/env";
import { withBase } from "@/lib/base-path";
import { getSidebarSection } from "@/lib/sidebar-tree";

function BrandTitle({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <a
      href={withBase(href)}
      className={["flex w-full justify-center", className?.replace("me-auto", "")]
        .filter(Boolean)
        .join(" ")}
    >
      <Leap0Brand />
    </a>
  );
}

export type ReferenceTab = LayoutTab & {
  id: "core" | "sdks" | "apis";
};

export const referenceTabs: ReferenceTab[] = [
  {
    id: "core",
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
    id: "sdks",
    title: "SDKs",
    description: "Python and TypeScript/JavaScript references",
    url: "/reference/python-sdk",
    icon: <SquareCode className="size-4" />,
    urls: new Set(["/reference/python-sdk", "/reference/javascript-sdk"]),
  },
  {
    id: "apis",
    title: "APIs",
    description: "Core, metadata service, code interpreter, and desktop OpenAPI reference",
    url: "/api",
    icon: <MonitorSmartphone className="size-4" />,
    urls: new Set(["/api", "/metadata-service/api", "/code-interpreter/api", "/desktop/api"]),
  },
];

const sdkTabs: LayoutTab[] = [
  {
    title: "Python",
    description: "Python SDK reference",
    url: "/reference/python-sdk",
    icon: <SquareCode className="size-4" />,
  },
  {
    title: "TypeScript / JavaScript",
    description: "TypeScript and JavaScript SDK reference",
    url: "/reference/javascript-sdk",
    icon: <Braces className="size-4" />,
  },
];

const apiTabs: LayoutTab[] = [
  {
    title: "Leap0 API",
    description: "Core platform API",
    url: "/api",
    icon: <MonitorSmartphone className="size-4" />,
  },
  {
    title: "Metadata Service API",
    description: "Metadata service endpoints",
    url: "/metadata-service/api",
    icon: <MonitorSmartphone className="size-4" />,
  },
  {
    title: "Code Interpreter API",
    description: "Code interpreter endpoints",
    url: "/code-interpreter/api",
    icon: <MonitorSmartphone className="size-4" />,
  },
  {
    title: "Desktop API",
    description: "Desktop automation endpoints",
    url: "/desktop/api",
    icon: <MonitorSmartphone className="size-4" />,
  },
];

export function getTopTabs(url: string): LayoutTab[] | false {
  switch (getSidebarSection(url)) {
    case "sdks":
      return sdkTabs;
    case "apis":
      return apiTabs;
    default:
      return false;
  }
}

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: BrandTitle,
    },
    githubUrl: githubOrgUrl,
  };
}
