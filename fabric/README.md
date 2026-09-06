# The fabric, described

*Generated from the log by `pnpm fabric describe`; do not edit. As of 2026-09-06T05:25:38.694Z. The specification is `FABRIC.md` one level up; this page is what a system that only has this folder needs.*

## What this is

An append-only log per tenant, a graph as memory, verbs as blessed nodes projected into a manifest, a receipt on every call, and consent as the only way across a wall. The session that connects is the only reasoner; the fabric remembers and acts deterministically.

## Spaces

| Space | Kind | Sovereign |
| --- | --- | --- |
| `agent` | agent | `agent` |
| `danny` | operator | `danny` |

## Manifest of `danny`

Each verb carries its input and output schema as JSON Schema in `manifest.json`. A session lists these as tools; a call outside this table is refused and the refusal is an event.

| Verb | Consequence | What it does |
| --- | --- | --- |
| — | — | No verb is blessed yet; the manifest is empty. |

Waiting for the operator's blessing: `slice`, `reflect`, `recall`, `pending`, `sync`.

## Sources

Where the operator’s space reads from besides the log. A source is proposed and blessed like a verb; blessing it is disclosing it.

| Source | Kind | Path |
| --- | --- | --- |
| — | — | No source is blessed yet. |

Waiting for the operator's blessing: `source/skills`, `source/works`, `source/vault`.

Proposals waiting in `danny`: 0.

## Speaking to it

- **Transport:** stdio. Start the server with `pnpm fabric serve`; it speaks the Model Context Protocol.
- **Resources:** `fabric://manifest`, `fabric://events.schema`, `fabric://readme`.
- **Hooks:** `pnpm fabric orient` at session start prints memory into context; `pnpm fabric stop-check` at stop asks once for a reflection.
- **Blessing:** `pnpm fabric bless <verb | source | bridge>`, in the operator's terminal. Never a verb.
- **The log:** `fabric/spaces/<space>.jsonl`, one event per line, validated by `events.schema.json`. Steps are per tenant.

## Vocabularies

- **consequenceClasses:** `observe`, `derive`, `propose`, `world`
- **spaceKinds:** `operator`, `agent`
- **decisions:** `blessed`, `rejected`
- **changeTargets:** `prompt`, `skill`, `verb`, `policy`
- **sourceKinds:** `vault`, `works`, `skills`
- **eventKinds:** `space.opened`, `verb.proposed`, `verb.blessed`, `verb.retired`, `verb.called`, `verb.refused`, `source.proposed`, `source.blessed`, `reflection.recorded`, `bridge.proposed`, `bridge.resolved`, `reference.cited`

## Invariants

- **INV-FAB-001** — A call is to a verb in the manifest.
- **INV-FAB-002** — A verb or a source is blessed by the sovereign of its space.
- **INV-FAB-003** — A bridge crosses a wall and is closed once, by the target's sovereign.
- **INV-FAB-004** — A weak reference crosses a wall as text.
- **INV-FAB-005** — The fold is a function: the same log yields the same state.
- **INV-FAB-006** — A tenant sees its own space whole and the other space through blessing.
- **INV-FAB-007** — A signature is frozen at blessing.
