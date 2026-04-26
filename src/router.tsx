import { createRouter } from '@tanstack/react-router';
import { routeTree } from './app/routeTree.gen';

export function getRouter() {
  return createRouter({
    routeTree,
    scrollRestoration: true,
    // Every internal navigation runs through document.startViewTransition
    // when the browser supports it. Participating elements
    // (FacetCard image, SalonCard hero-morph thumbnail, WorkView hero
    // figure) carry stable `viewTransitionName` values that the browser
    // matches across snapshots — so a card morphs into a hero, a chip
    // toggle reflows its grid, and the rest of the page cross-fades.
    // The router commits the route change inside the transition's
    // update callback, which is what makes the snapshot timing correct
    // (a manual document.startViewTransition wrapping useNavigate
    // returns before React commits the new view). Browsers without
    // support fall through to instant navigation; reduced motion is
    // honored by the ::view-transition CSS in tokens.css.
    defaultViewTransition: true,
  });
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
