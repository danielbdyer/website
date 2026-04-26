import { useRouter } from '@tanstack/react-router';
import type { MouseEvent } from 'react';

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
 * **Scroll-to-top before navigate.** The handler scrolls the window
 * to the top *before* calling `router.navigate`. This timing matters:
 * the router's view transition captures the old + new snapshots
 * around the navigation, and a scroll-to-top in a post-navigation
 * `useEffect` fires *after* the new snapshot is taken — so the
 * morph plays at the source's scroll position and the page snaps to
 * the top only after the transition ends, looking jarring. Scrolling
 * here, before navigate, ensures the new snapshot captures the
 * destination at the top. Wikilinks always Open a new article (per
 * GRAPH_AND_LINKING.md, internal prose links target other works), so
 * the scroll is appropriate; the rare back-via-wikilink case takes
 * a brief flash from 0 to saved-position after the transition.
 *
 * Returns a memoized onClick handler designed to be attached to the
 * outer container; React's event delegation does the rest.
 */
export function useInternalLinkDelegation() {
  const router = useRouter();
  // No `useCallback` wrap — the React Compiler (configured in
  // vite.config.ts) auto-memoizes hooks and handlers at build time.
  // Manual memoization is kept only when the compiler's eslint plugin
  // surfaces a case it can't safely handle. See REACT_NORTH_STAR.md
  // §"React Compiler".
  return (e: MouseEvent<HTMLElement>) => {
    const anchor = (e.target as HTMLElement | null)?.closest?.('a');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href || !href.startsWith('/')) return;
    if (e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const target = anchor.getAttribute('target');
    if (target && target !== '_self') return;
    e.preventDefault();
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    void router.navigate({ to: href });
  };
}
