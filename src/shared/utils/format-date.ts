// A work's date is a calendar day, not an instant. The frontmatter's
// `2026-04-24` parses (via YAML) as midnight UTC; formatting that
// instant in the visitor's local zone shifts it to April 23 anywhere
// west of the meridian — and the prerender bakes in the build
// machine's zone, so the static HTML and the hydrating client can
// disagree about the day. Formatting in UTC keeps the day the author
// wrote, on every clock.
export function formatWorkDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
