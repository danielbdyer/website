import { Link, type LinkProps } from '@tanstack/react-router';
import type { MouseEvent, ReactNode } from 'react';
import { useTransitionNavigate } from '@/shared/hooks/useTransitionNavigate';

type TransitionLinkProps = LinkProps & {
  className?: string;
  children?: ReactNode;
  // Standard anchor pass-throughs needed for accessibility chrome.
  'aria-label'?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
  'aria-pressed'?: boolean;
  tabIndex?: number;
};

// A `<Link>` that wraps navigation in `document.startViewTransition`
// when the browser supports it. Falls back to TanStack Router's default
// navigation otherwise. Browsers that don't support the API still get a
// real anchor with a real href, so the page works without JS, and the
// click handler interception only runs once hydration completes.
//
// The intercept respects platform-modifier clicks (cmd/ctrl/shift) so
// "open in new tab" still does the right thing — those click types
// shouldn't run our async navigate at all.
export function TransitionLink({ children, ...props }: TransitionLinkProps) {
  const transitionNavigate = useTransitionNavigate();

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented) return;
    if (e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    transitionNavigate({
      to: props.to,
      params: props.params,
      search: props.search,
      hash: props.hash,
      replace: props.replace,
    } as Parameters<typeof transitionNavigate>[0]);
  };

  return (
    <Link {...props} onClick={onClick}>
      {children}
    </Link>
  );
}
