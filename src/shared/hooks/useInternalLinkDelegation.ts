import { useRouter } from '@tanstack/react-router';
import { useCallback, type MouseEvent } from 'react';

/**
 * Click delegation for any container that renders raw HTML containing
 * internal anchors — e.g., a `dangerouslySetInnerHTML` div that holds
 * markdown-rendered prose with `[[wikilinks]]` resolved as `<a href>`.
 *
 * Without this, clicking a wikilink triggers a full document navigation
 * because TanStack Router only intercepts clicks on its own `<Link>`
 * components, not on raw anchors. The full reload bypasses view
 * transitions, scroll restoration, and the SPA's render lifecycle.
 *
 * The handler walks up to the closest anchor; if the href is internal
 * (starts with `/`), is a left-click, and carries no
 * platform-modifier (cmd/ctrl/shift/alt — those mean "open in new
 * tab" and the browser should keep its default), it preventDefaults
 * and routes through the router. Anything else (external links,
 * hash anchors, mailto:, modifier-clicks) falls through to the
 * browser's default behavior.
 *
 * Returns a memoized onClick handler designed to be attached to the
 * outer container; React's event delegation does the rest.
 */
export function useInternalLinkDelegation() {
  const router = useRouter();
  return useCallback(
    (e: MouseEvent<HTMLElement>) => {
      const anchor = (e.target as HTMLElement | null)?.closest?.('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || !href.startsWith('/')) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const target = anchor.getAttribute('target');
      if (target && target !== '_self') return;
      e.preventDefault();
      void router.navigate({ to: href });
    },
    [router],
  );
}
