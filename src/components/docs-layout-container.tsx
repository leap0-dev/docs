import { type CSSProperties, type HTMLAttributes } from "react";
import { useDocsLayout } from "fumadocs-ui/layouts/docs";

type Props = HTMLAttributes<HTMLDivElement> & {
  "data-openapi-layout"?: string;
};

export function DocsLayoutContainer(props: Props) {
  const { slots } = useDocsLayout();
  const { collapsed } = slots.sidebar.useSidebar();
  const isOpenApiLayout = props["data-openapi-layout"] === "true";

  return (
    <div
      id="nd-docs-layout"
      data-sidebar-collapsed={collapsed}
      {...props}
      style={
        {
          gridTemplate: isOpenApiLayout
            ? `"sidebar sidebar header header"
"sidebar sidebar toc-popover toc"
"sidebar sidebar main main" 1fr / minmax(min-content, 1fr) var(--fd-sidebar-col) minmax(0, calc(var(--fd-layout-width,97rem) - var(--fd-sidebar-width))) minmax(min-content, 1fr)`
            : `"sidebar sidebar header header header"
"sidebar sidebar toc-popover toc toc"
"sidebar sidebar main toc toc" 1fr / minmax(min-content, 1fr) var(--fd-sidebar-col) minmax(0, calc(var(--fd-layout-width,97rem) - var(--fd-sidebar-width) - var(--fd-toc-width))) var(--fd-toc-width) minmax(min-content, 1fr)`,
          "--fd-docs-row-1": "var(--fd-banner-height, 0px)",
          "--fd-docs-row-2": "calc(var(--fd-docs-row-1) + var(--fd-header-height))",
          "--fd-docs-row-3": "calc(var(--fd-docs-row-2) + var(--fd-toc-popover-height))",
          "--fd-sidebar-col": collapsed ? "0px" : "var(--fd-sidebar-width)",
          ...props.style,
        } as CSSProperties
      }
      className={[
        "grid overflow-x-clip min-h-(--fd-docs-height) [--fd-docs-height:100dvh] [--fd-header-height:0px] [--fd-toc-popover-height:0px] [--fd-sidebar-width:0px] [--fd-toc-width:0px]",
        props.className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {props.children}
    </div>
  );
}
