/// <reference types="vite/client" />

declare module '*.css' {
  const content: string;
  export default content;
}

// Build-time constants injected by Vite's `define` config in vite.config.ts.
// See PRIVACY.md and __root.tsx for the Cloudflare Web Analytics wiring.
declare const __CFWA_TOKEN__: string;
