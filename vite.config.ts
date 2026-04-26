import { defineConfig } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { visualizer } from 'rollup-plugin-visualizer';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    // tanstackStart must come before viteReact per Start's plugin contract.
    // The plugin subsumes @tanstack/router-vite-plugin and also generates
    // the route tree at ./src/app/routeTree.gen.ts.
    tanstackStart({
      // Paths resolve relative to srcDirectory (default 'src').
      router: {
        routesDirectory: 'app/routes',
        generatedRouteTree: 'app/routeTree.gen.ts',
        // Co-located test files (Foo.test.tsx) live next to the route
        // files they exercise. Without this they trip a "does not export
        // a Route" warning on every build pass.
        routeFileIgnorePattern: '\\.test\\.',
      },
      // SSG: every known route is prerendered to static HTML at build time.
      // crawlLinks follows links from each page to discover paths the static
      // list misses (the content loader will add /{room}/{slug} per work
      // once content exists). failOnError makes a prerender failure fail
      // the build — a quiet deploy with a broken route is worse than a
      // loud build failure.
      // `/` is the foyer; no separate /foyer route. Room landings below.
      // Per-work routes (/$room/$slug) are discovered via crawlLinks once
      // content exists; autoStaticPathsDiscovery handles the enumeration.
      pages: [
        { path: '/' },
        { path: '/studio' },
        { path: '/garden' },
        { path: '/study' },
        { path: '/salon' },
        // The eight facet pages. Listed explicitly so an unused facet
        // (no work currently carries it) still renders its empty state
        // — crawlLinks would otherwise miss it because no chip points
        // there. The set is closed (DOMAIN_MODEL.md §"The eight").
        { path: '/facet/craft' },
        { path: '/facet/consciousness' },
        { path: '/facet/language' },
        { path: '/facet/leadership' },
        { path: '/facet/beauty' },
        { path: '/facet/becoming' },
        { path: '/facet/relation' },
        { path: '/facet/body' },
      ],
      prerender: {
        enabled: true,
        crawlLinks: true,
        failOnError: true,
        // Cap multi-facet prerender to depth 2. The full power set of
        // 8 facets (255 combinations) was 65% of the dist with most of
        // it empty-intersection pages. Single (8) + pairs (28) = 36
        // facet routes, all reachable, all carrying real intersections
        // when works exist. Three-or-more-facet selections aren't
        // generated; FacetToggleBar disables the off-chips at depth 2
        // so those URLs aren't reachable from the UI in the first place.
        // Trigger to revisit (cap to depth 3, or back to powerset):
        // when authored work in 30+ pieces makes 3-facet intersections
        // meaningful and the bundle still has room.
        filter: (page) => {
          const m = /^\/facet\/(.+?)\/?$/.exec(page.path);
          if (!m) return true;
          const facets = decodeURIComponent(m[1]!).split(',').filter(Boolean);
          return facets.length <= 2;
        },
        onSuccess: ({ page, html }) => {
          if (html.includes('content="noindex, nofollow"')) {
            return {
              sitemap: {
                ...page.sitemap,
                exclude: true,
              },
            };
          }
        },
      },
      // sitemap.xml generated from the prerender set, written to dist/client.
      // `host` is required for absolute-URL <loc> entries.
      sitemap: {
        enabled: true,
        host: 'https://danielbdyer.com',
      },
    }),
    viteReact(),
    tailwindcss(),
    // Visualizer is gated: it adds noticeable build time and only earns
    // its keep when a contributor is hunting bundle weight. Run via
    // `pnpm build:analyze` to enable; CI builds skip it.
    process.env.ANALYZE === '1' &&
      visualizer({
        filename: '.stats/bundle.html',
        gzipSize: true,
        brotliSize: true,
        template: 'treemap',
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  // Cloudflare Web Analytics token. Inlined as a build-time constant
  // so the value is identical in the prerender pass and the client
  // build — using `import.meta.env.VITE_*` here would inline the token
  // in client chunks but not in the prerender HTML, producing a
  // hydration mismatch where the beacon script appears post-hydration
  // but not in the SSG output. PRIVACY.md describes the beacon's
  // privacy posture; if the env var is unset (local dev, anyone-without-
  // the-secret), `__CFWA_TOKEN__` is the empty string and no beacon
  // ships.
  define: {
    __CFWA_TOKEN__: JSON.stringify(process.env.VITE_CLOUDFLARE_ANALYTICS_TOKEN ?? ''),
  },
});
