import { useState } from 'react';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { getPostHog } from '@/lib/posthog';

type FeedbackValue = 'up' | 'down';

export function DocsFeedback({ pageTitle, pageUrl }: { pageTitle: string; pageUrl: string }) {
  const [selection, setSelection] = useState<FeedbackValue | null>(null);

  function submit(value: FeedbackValue) {
    setSelection(value);

    const client = getPostHog();
    client?.capture('docs_feedback_submitted', {
      page_title: pageTitle,
      page_url: pageUrl,
      value,
    });
  }

  return (
    <div className="mt-1 -mb-3 flex items-center gap-3 border-t pt-1 pb-1 text-sm">
      <p className="text-sm font-medium text-fd-foreground">Was this page helpful?</p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => submit('up')}
          aria-pressed={selection === 'up'}
          className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground aria-pressed:bg-fd-primary aria-pressed:text-fd-primary-foreground"
        >
          <ThumbsUp className="size-4" />
          Yes
        </button>
        <button
          type="button"
          onClick={() => submit('down')}
          aria-pressed={selection === 'down'}
          className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground aria-pressed:bg-fd-primary aria-pressed:text-fd-primary-foreground"
        >
          <ThumbsDown className="size-4" />
          No
        </button>
      </div>
    </div>
  );
}
