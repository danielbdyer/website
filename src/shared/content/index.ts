export {
  workFrontmatterSchema,
  roomSchema,
  facetSchema,
  workTypeSchema,
  isPublished,
  type Work,
  type WorkFrontmatter,
  type WorkType,
} from './schema';

// Public API is the server-fn wrappers. `loader.ts` is server-only by
// convention (imports marked + gray-matter at top level); client code
// never imports from it, and the barrel deliberately does NOT re-export
// anything from it — re-exporting `parseWork` through here pulled the
// whole loader module into the client chunk via tree-shake. Tests
// import `parseWork` from `./loader` directly.
export { getAllWorks, getWorksByRoom, getWork } from './server-fns';
