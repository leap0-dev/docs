import { useLocation } from "@tanstack/react-router";
import { SidebarTabsDropdown } from "fumadocs-ui/components/sidebar/tabs/dropdown";
import { referenceTabs } from "@/lib/layout.shared";
import { getSidebarSection } from "@/lib/sidebar-tree";

export function SidebarReferenceDropdown() {
  const { pathname } = useLocation();
  const section = getSidebarSection(pathname);

  const options = referenceTabs.map((tab) => {
    if (tab.url === "/api" && section === "api") return { ...tab, urls: new Set([pathname]) };
    if (tab.url === "/" && section === "core") return { ...tab, urls: new Set([pathname]) };

    return tab;
  });

  return <SidebarTabsDropdown options={options} className="w-full" />;
}
