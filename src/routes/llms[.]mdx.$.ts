import { createFileRoute, notFound } from "@tanstack/react-router";
import { getLLMText, isLLMPage } from "@/lib/get-llm-text";
import { source } from "@/lib/source";

export const Route = createFileRoute("/llms.mdx/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const slugs = params._splat?.split("/").filter(Boolean) ?? [];
        const page = source.getPage(slugs);

        if (!isLLMPage(page)) throw notFound();

        return new Response(await getLLMText(page), {
          headers: {
            "Content-Type": "text/markdown",
          },
        });
      },
    },
  },
});
