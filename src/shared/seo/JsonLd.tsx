import type { SchemaOrgNode } from './schema-org';

interface JsonLdProps {
  data: SchemaOrgNode | SchemaOrgNode[];
}

// Renders Schema.org structured data as a JSON-LD script tag.
// Search engines and semantic crawlers parse this; visitors do not see it.
// Rendered in the body rather than document <head> — both are valid per
// Schema.org guidance, and in-body avoids a head-manager dependency.
export function JsonLd({ data }: JsonLdProps) {
  const payload = Array.isArray(data) ? data : [data];
  return (
    <>
      {payload.map((node, i) => (
        <script
          key={`${node['@type']}-${i}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(node) }}
        />
      ))}
    </>
  );
}
