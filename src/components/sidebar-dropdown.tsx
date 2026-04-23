import { SidebarTabsDropdown } from "fumadocs-ui/components/sidebar/tabs/dropdown";
import { referenceTabs } from "@/lib/layout.shared";
import { getSidebarSection } from "@/lib/sidebar-tree";

type Props = {
  currentPath: string;
};

export function SidebarDropdown({ currentPath }: Props) {
  const section = getSidebarSection(currentPath);

  const options = referenceTabs.map((tab) => ({
    ...tab,
    url: tab.url,
    urls: tab.id === section ? new Set([currentPath]) : tab.urls,
  }));

  return (
    <SidebarTabsDropdown options={options} className="w-full" />
  );
}
