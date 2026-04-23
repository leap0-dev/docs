import { createRouter } from "@tanstack/react-router";
import { basePath } from "@/lib/base-path";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  return createRouter({
    basepath: basePath,
    routeTree,
  });
}
