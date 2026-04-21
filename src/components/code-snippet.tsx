import { Suspense } from 'react';
import { useShiki } from 'fumadocs-core/highlight/shiki/react';
import { defaultShikiFactory } from 'fumadocs-core/highlight/shiki/full';
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';

type CodeSnippetProps = {
  lang?: string;
  code: string;
};

function HighlightedCodeSnippet({ lang, code }: Required<CodeSnippetProps>) {
  return useShiki(
    () => defaultShikiFactory.getOrInit(),
    code,
    {
      lang,
      defaultColor: false,
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      components: {
        pre: (props) => (
          <CodeBlock {...props} className="my-0">
            <Pre>{props.children}</Pre>
          </CodeBlock>
        ),
      },
    },
    [lang, code],
  );
}

function CodeSnippetPlaceholder({ code }: { code: string }) {
  return (
    <figure className="my-4 overflow-hidden rounded-xl border bg-fd-card text-sm shadow-sm">
      <div aria-hidden className="overflow-auto px-4 py-3.5 opacity-0">
        <pre className="min-w-full whitespace-pre">{code}</pre>
      </div>
    </figure>
  );
}

export function CodeSnippet({ lang = 'text', code }: CodeSnippetProps) {
  return (
    <Suspense fallback={<CodeSnippetPlaceholder code={code} />}>
      <HighlightedCodeSnippet lang={lang} code={code} />
    </Suspense>
  );
}
