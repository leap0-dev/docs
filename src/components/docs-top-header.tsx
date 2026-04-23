import { useLocation } from "@tanstack/react-router";
import Link from "fumadocs-core/link";
import { useDocsLayout } from "fumadocs-ui/layouts/docs";
import { buttonVariants } from "fumadocs-ui/components/ui/button";
import { SidebarIcon } from "lucide-react";
import type { LayoutTab } from "fumadocs-ui/layouts/shared";
import { getTopTabs } from "@/lib/layout.shared";

function isActive(pathname: string, tab: LayoutTab) {
  if (tab.urls && tab.urls.size > 0) {
    return [...tab.urls].some((url) => pathname === url || pathname.startsWith(`${url}/`));
  }

  return pathname === tab.url || pathname.startsWith(`${tab.url}/`);
}

export function DocsTopHeader() {
  const { pathname } = useLocation();
  const tabs = getTopTabs(pathname) || [];
  const { isNavTransparent, slots, props: { nav } } = useDocsLayout();
  const hasTabs = tabs.length > 0;

  return (
    <header
      id="nd-subnav"
      data-transparent={isNavTransparent}
      className={[
        "[grid-area:header] sticky top-(--fd-docs-row-1) z-30 border-b transition-colors backdrop-blur-sm data-[transparent=false]:bg-fd-background/90",
        hasTabs
          ? "layout:[--fd-header-height:6.5rem] lg:layout:[--fd-header-height:3.25rem]"
          : "layout:[--fd-header-height:--spacing(14)] lg:layout:[--fd-header-height:0px] lg:border-b-0",
      ].join(" ")}
    >
      <div className="flex h-14 items-center ps-4 pe-2.5 md:hidden">
        {slots.navTitle && <slots.navTitle className="inline-flex items-center gap-2.5 font-semibold" />}
        <div className="flex-1">{nav?.children}</div>
        {slots.searchTrigger && (
          <slots.searchTrigger.sm hideIfDisabled className="p-2" />
        )}
        {slots.sidebar && (
          <slots.sidebar.trigger
            className={buttonVariants({
              color: "ghost",
              size: "icon-sm",
              className: "p-2",
            })}
          >
            <SidebarIcon />
          </slots.sidebar.trigger>
        )}
      </div>

      {hasTabs && (
        <div className="border-t px-4 lg:hidden">
          <nav className="flex h-12 w-full items-center gap-5 overflow-x-auto">
            {tabs.map((tab) => {
              const active = isActive(pathname, tab);

              return (
                <Link
                  key={tab.url}
                  href={tab.url}
                  className={[
                    "inline-flex h-12 shrink-0 items-center border-b-2 px-0 text-sm font-medium whitespace-nowrap transition-colors",
                    active
                      ? "border-fd-primary text-fd-foreground"
                      : "border-transparent text-fd-muted-foreground hover:text-fd-foreground",
                  ].join(" ")}
                >
                  {tab.title}
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {hasTabs && (
        <div className="hidden h-[3.25rem] items-end border-b px-6 lg:flex xl:px-8">
          <div className="w-full max-w-[1168px]">
            <nav className="flex w-full items-center gap-6 overflow-x-auto">
            {tabs.map((tab) => {
              const active = isActive(pathname, tab);

              return (
                <Link
                  key={tab.url}
                  href={tab.url}
                  className={[
                    "inline-flex h-[3.25rem] items-center border-b-2 px-0 text-sm font-medium whitespace-nowrap transition-colors",
                    active
                      ? "border-fd-primary text-fd-foreground"
                      : "border-transparent text-fd-muted-foreground hover:text-fd-foreground",
                  ].join(" ")}
                >
                  {tab.title}
                </Link>
              );
            })}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
