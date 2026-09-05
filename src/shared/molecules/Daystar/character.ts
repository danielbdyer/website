// The daystar as a default export, for the seat's lazy import
// (layout/DaystarSeat.tsx): a dynamic import resolves its module's
// `default` under that name in every build, where a named export may
// be minified away between chunks.
export { Daystar as default } from './Daystar';
