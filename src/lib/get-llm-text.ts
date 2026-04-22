import type { InferPageType } from "fumadocs-core/source";
import { source } from "./source";

type LLMPage = InferPageType<typeof source> & {
  data: {
    title: string;
    getText(mode: "processed"): Promise<string>;
  };
};

export function isLLMPage(page: InferPageType<typeof source> | undefined): page is LLMPage {
  const data = page?.data as { getText?: unknown } | undefined;

  return typeof data === "object" && typeof data?.getText === "function";
}

export async function getLLMText(page: LLMPage) {
  const processed = await page.data.getText("processed");

  return `# ${page.data.title} (${page.url})

${processed}`;
}
