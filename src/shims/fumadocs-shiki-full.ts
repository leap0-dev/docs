import { createShikiFactory } from "fumadocs-core/highlight/shiki";

const factory = createShikiFactory({
  async init(options) {
    const { createHighlighter, createJavaScriptRegexEngine } = await import("shiki");

    return createHighlighter({
      langs: [],
      themes: [],
      langAlias: options?.langAlias,
      engine: createJavaScriptRegexEngine(),
    });
  },
});

export const defaultShikiFactory = factory;
export const wasmShikiFactory = factory;
