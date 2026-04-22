import { createShikiFactory } from "fumadocs-core/highlight/shiki";

// Keep Fumadocs on the JS regex engine path so the build does not pull in the Oniguruma WASM variant.
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
