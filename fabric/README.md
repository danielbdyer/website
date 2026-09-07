# The fabric, described

*Generated from the log by `pnpm fabric describe`; do not edit. As of 2026-09-07T06:02:55.762Z. The specification is `FABRIC.md` one level up; this page is what a system that only has this folder needs.*

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
| `reflect` | propose | Record what this session noticed, in the shape the next session can retrieve. Lands in your own space at once; a proposal to carry it into the operator’s memory waits for blessing. Outcomes you report on applied patches are the loop’s own measure. |

Waiting for the operator's blessing: `slice`, `propose`, `recall`, `pending`, `sync`.

## Sources

Where the operator’s space reads from besides the log. A source is proposed and blessed like a verb; blessing it is disclosing it.

| Source | Kind | Path |
| --- | --- | --- |
| — | — | No source is blessed yet. |

Waiting for the operator's blessing: `source/skills`, `source/works`, `source/vault`.

Proposals waiting in `danny`: 2 to carry across, 0 to change a node.

## The loop, pointed at itself

A session proposes a change to one of the operator’s nodes with `propose`: the node’s whole new text, the base it read, why, and a hypothesis the next session can check. The fabric evaluates what it can and the patch waits; the operator applies it from his terminal, only to the base it named. The next session sees the applied patch at start and reports through `reflect` whether the hypothesis held. Graduation is a number the operator reads, and it gates nothing.

| Proposed | Applied | Confirmed | Contradicted | Rate | Floor | Window | Graduated |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | 0 | 0 | 0 | no outcome yet | 0.5 | 5 | not yet |

## Does it compound?

A corpus compounds when outputs become inputs: something stored is surfaced in a context other than the one it was made in, and the next act uses it. Every retrieval a session makes is an event with its candidates in rank order; a use is a later citation or patch by the same session naming a candidate another session made. The numbers below are that measure, folded from the log. They gate nothing; they are what the operator reads before building anything meant to raise them.

| Retrievals | Used | Rate | Hit@3 | MRR | Missed | Proposals decided | Blessed |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | 0 | none yet | none yet | none yet | 0 | 0 | none yet |

## Speaking to it

- **Transport:** stdio. Start the server with `pnpm fabric serve`; it speaks the Model Context Protocol.
- **Resources:** `fabric://manifest`, `fabric://events.schema`, `fabric://readme`.
- **Hooks:** `pnpm fabric orient` at session start prints memory into context; `pnpm fabric stop-check` at stop asks once for a reflection.
- **Blessing:** `pnpm fabric bless <verb | source | bridge | patch>`, in the operator's terminal. Never a verb.
- **The log:** `fabric/spaces/<space>.jsonl`, one event per line, validated by `events.schema.json`. Steps are per tenant.

## Vocabularies

- **consequenceClasses:** `observe`, `derive`, `propose`, `world`
- **spaceKinds:** `operator`, `agent`
- **decisions:** `blessed`, `rejected`
- **changeTargets:** `prompt`, `skill`, `verb`, `policy`
- **sourceKinds:** `vault`, `works`, `skills`
- **eventKinds:** `space.opened`, `verb.proposed`, `verb.blessed`, `verb.retired`, `verb.called`, `verb.refused`, `source.proposed`, `source.blessed`, `reflection.recorded`, `bridge.proposed`, `bridge.resolved`, `reference.cited`, `patch.proposed`, `patch.evaluated`, `patch.resolved`, `patch.outcome`, `retrieval.surfaced`

## Invariants

- **INV-FAB-001** — A call is to a verb in the manifest.
- **INV-FAB-002** — A verb or a source is blessed by the sovereign of its space.
- **INV-FAB-003** — A bridge crosses a wall and is closed once, by the target's sovereign.
- **INV-FAB-004** — A weak reference crosses a wall as text.
- **INV-FAB-005** — The fold is a function: the same log yields the same state.
- **INV-FAB-006** — A tenant sees its own space whole and the other space through blessing.
- **INV-FAB-007** — A signature is frozen at blessing.
- **INV-FAB-008** — A patch is applied only to the base it was proposed against, only by the sovereign, and once.
- **INV-FAB-009** — An outcome cites a patch that was applied.
- **INV-FAB-010** — Every retrieval is an event, with its context and every candidate in rank order; a receipt for a retrieval verb has one.
- **INV-FAB-011** — Every event names its actor in the closed grammar, and an agent event carries a because; the schema refuses one without.
