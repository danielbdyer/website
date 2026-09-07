# NORTH STAR — section 28 (addendum, v3.2)

<!-- Persisted 2026-09-07 from Danny's PDF export (NORTH_STAR_s28_multitenancy.pdf, 11 pages). The words are unchanged; headings and tables are restored from the PDF's layout. Never edited by a session. Splices in after NORTH_STAR_v3.md §27; v4 §28 is the lock's portion of it. -->

## 28. Multi-tenancy, epistemic networking, and the local/deployed stack

Splices in after section 27. Adds tenants as identities, cross-tenant provenance, capability delegation for specialized agents, ATProto's semantics adopted locally, the local/deployed stack with the semantics that do not change between them, inference tiers, reachability, and the place of orchestration. Introduces INV-NS-006 through INV-NS-011 and extends Appendix A and C.

### 28.1 The governing sentence

**Canonicality is per-tenant.** There is no global projection of record. Each tenant folds its own log into its own canonical and shadow projections, and a fact that crosses a tenant boundary is always an import — proposed in the receiving tenant, never canonical — until that tenant's blessing, or a blessed policy of that tenant, admits it. Multi-tenant means multi-canonical. Every rule below is a consequence.

### 28.2 Tenants are identities

- **Every tenant has a stable, host-independent identity:** a keypair, expressed as a DID (`did:key` locally; `did:plc` or `did:web` if it ever federates). The operator is a tenant. Each specialized agent is a tenant. A `sim:<run>` is a tenant with a throwaway key.
- **Every event is signed by its tenant's key.** Provenance stops being a trusted label and becomes verifiable. `actor` carries the DID alongside the grammar (`author:<space>@did:…`, `agent:<session>@did:…`). INV-NS-006: an event whose signature does not verify against its actor's DID is rejected at the schema level.
- **Addressing.** Any node, edge, or event is addressable as `fabric://<did>/<collection>/<rkey>` — the AT-URI shape. A node's identity is its address, not its position in any projection. Cross-tenant edges point at addresses.
- **Key custody is local.** Private keys never enter the log, the projection, or any export. Rotation is an event (`key.rotated`) chained to the prior key.

### 28.3 Namespaced kinds — Lexicons, locally

- Event kinds and metamodel types are namespaced identifiers, reverse-DNS style: `dyer.fabric.reflection`, `dyer.fabric.retrieval.surfaced`, `dyer.tesseract.browser.action`, `dyer.meta.type`. The schema of record is the Lexicon registry.
- Plugins declare kinds in their own namespace (`<plugin>.<kind>`) and cannot define kinds in `dyer.fabric.*`. A plugin's kinds enter the schema of record by proposal and blessing like any other type.
- Another tenant's kind is readable by its namespace without being adopted. Adopting it into your metamodel is a `type.proposed` with the source tenant as provenance.
- **Versioning.** A kind carries a version; a change to a kind is a new version with a migration in the log's migration story. Old events fold under the version they were written in.

### 28.4 Cross-tenant provenance and trust

Extend the provenance table (section 5) with one row that covers every foreign source:

| Actor | May reach canonical? | Notes |
|---|---|---|
| `import:tenant:<did>` | Only through the receiving tenant's blessing or a blessed policy | Any event originating in another tenant's log, however trusted the source |

- **Trust is a policy, and a policy is a blessed node.** A tenant may bless a `trust.policy` node: "auto-admit `dyer.fabric.alias` from did:X; never auto-admit `dyer.meta.type` from anyone; hold everything from did:Y in shadow." Policies are per source and per kind. Absent a policy, everything foreign is held.
- **A foreign claim carries its source's blessing state as metadata, not as authority.** That the DBA agent blessed something in its own tenant is evidence, surfaced alongside the proposal; it is not a blessing here. INV-NS-007: no event reaches a tenant's canonical projection by virtue of any other tenant's blessing.
- **Contradiction across tenants is a relation, not an error.** Two tenants holding incompatible claims produce a `contradicts` edge across addresses in whichever tenant notices; neither projection changes. Section 14 applies across boundaries.
- **Retrieval may span tenants the current tenant subscribes to,** and every foreign candidate is marked as foreign in `retrieval.surfaced`, so R(t) can be reported per source. Foreign use — citing another tenant's node — is the beginning of a cross-tenant compounding number.

### 28.5 Specialized agents as tenants with delegated capability

A dedicated agent — the DBA agent, the writing agent, a browser-routine runner — is a tenant of its own, with its own log, its own projections, its own key, and a manifest scoped to its verbs. It is not a space inside the operator's tenant.

- **Capability is delegated, attenuated, and signed.** The operator issues a capability grant to an agent tenant: which verbs it may invoke, which of the operator's spaces it may propose into, which kinds it may propose, an expiry, and an optional budget. Grants chain and only narrow — an agent may sub-delegate a subset of what it holds, never more. Model this on UCAN-style delegation; implement the minimal signed grant first and adopt the standard when a second issuer exists.
- **The grant is an event in both tenants' logs** (`capability.granted`, `capability.revoked`), which makes the delegation graph a projection and revocation a fold.
- **An agent's verbs run under its own DID.** Its receipts, reflections, and proposals land in its own log as canonical for it, and cross into the operator's tenant as `import:tenant:<did>` proposals, gated by policy. Directive 4 (records in its own space without asking) is satisfied literally: its own space is its own tenant.
- **Specialization is a manifest and a corpus, not a fork.** The DBA agent is the fabric with a different manifest, a different skill tree branch unlocked, and a different log. Nothing in the runtime is duplicated per agent.
- **Compounding is measured per agent tenant with the same fold.** A specialized agent whose own R(t) does not move is a specialization that is not paying for itself.

### 28.6 Subscription and the local firehose

- **A tenant subscribes to another tenant's stream by kind:** "give me `dyer.fabric.alias.*` and `dyer.fabric.evaluation.*` from did:X." Locally this is reading another log directory through a Layer; over a network it is a relay. The subscriber folds what arrives into its shadow projection under `import:tenant`, and policy decides the rest.
- **The stream is the same Effect Stream that feeds the TTY and the dashboard.** There is one event stream abstraction; subscription is a filter on it with a foreign source.
- **Backpressure and replay are the log's.** A subscriber that falls behind replays from its last seen `(did, step)`; nothing is lost because nothing is pushed that is not already persisted at the source.

### 28.7 The stack, local and deployed

The system does not have a deployment architecture; each tenant does. A tenant is an actor — one DID, one log, one projection, one mailbox, one Layer — and the actor is the same code whether it runs in-process on Danny's machine or as a Durable Object at the edge. The operator's tenant may stay local forever while a specialized agent's tenant runs deployed because it must answer from anywhere. Every row below is a Layer swap on a trigger; nothing on the write path changes.

#### 28.7.1 The semantics that never change

These hold identically for a local tenant and a deployed one. They are the contract; the tables that follow are implementations of it.

| Semantic | Statement |
|---|---|
| Source of truth | The tenant's signed, append-only log. Never a projection, a cache, a gateway log, or a remote replica. |
| Write path | Never depends on the network. A writer that cannot reach the tenant actor writes a session file under its own short-lived key and is merged by `step` on reconnect. INV-NS-009. |
| Canonicality | Per tenant. A deployed tenant's canonical is no more authoritative than a local one's; both admit foreign events only by blessing or blessed policy. INV-NS-007. |
| Identity and signing | The DID is the tenant wherever it runs. A deployed actor holds its own key in its own custody; the operator never shares a key with a deployed agent. INV-NS-006. |
| Provenance and `because` | Every event carries actor, model, and reason regardless of where inference or execution happened. A receipt from an edge model is as accountable as one from a frontier model. INV-FAB-011. |
| Projection disposability | Any projection — local SQLite, D1, Vectorize, a dashboard, an AppView — can be dropped and replayed from the log. Never repaired in place. |
| Surfaces are stateless | A deployed admin panel, a phone, the Electron app, the CLI: all invoke verbs and read projections. None holds state. |
| Compounding is measured everywhere | R(t) folds per tenant with one `compounding()`, wherever the tenant lives. A deployed tenant that does not compound is a deployment that is not paying for itself. |
| Deployment is per tenant, by trigger | Nothing deploys because it can. The house's no-production-runtime stance for the site stands. |

#### 28.7.2 Data and execution — local implementation, deployed mirror, trigger

| Layer | What it is | Local | Deployed (Cloudflare) | Trigger to deploy |
|---|---|---|---|---|
| Tenant actor | One owner of one log; serialized appends; co-located projection | In-process actor behind an Effect Layer; mailbox serializes writes | Durable Object (SQLite-backed), one per tenant, addressed by DID | A tenant that must be reachable from more than one machine |
| Log | Signed JSONL, append-only | Filesystem, git | The DO's storage, mirrored to R2 as JSONL; git remains the archive of record | Off-machine durability beyond git |
| Projection | The fold's target: FTS5, sqlite-vec, nodes, edges, retrieval log | One SQLite file per tenant | The DO's own SQLite; D1 only for a shared read-mostly AppView across tenants | A shared view many tenants query |
| Dense axis | Vectors for retrieval | sqlite-vec in the tenant's file | Vectorize | A tenant whose embeddings outgrow one file |
| Event stream | Fan-out to TTY, dashboard, subscribers | Effect Stream with filters | Queues feeding subscribers' DOs | Subscribers on other machines |
| Verb runtime | Where verbs execute | The resident process (Electron main or daemon) | Workers, invoking the tenant's DO | A verb that must run where the caller is |
| Durable verbs | Multi-step verbs with checkpoints and retry | Effect program appending a checkpoint event per step; resumes from the last | Workflows | A verb that must outlive a process on a machine that may sleep |
| Inference | The LLM behind a Layer | Local model or API, per tier (28.8) | Workers AI per tier; frontier API through AI Gateway | A verb whose model must run at the edge |
| Reachability | How a surface finds a tenant | Loopback | Cloudflare Tunnel from the local actor; Access for identity (28.9) | A surface on another device |
| Archive | Cold copy of everything | git | R2 | Off-machine durability |

#### 28.7.3 What a deployed tenant looks like, end to end

A specialized agent tenant that has fired its trigger: its DO holds its log and SQLite; its Worker exposes its blessed verbs; its Workflow runs its long browser routines with a checkpoint event per step; its Queue emits the kinds other tenants subscribe to; its key lives only in its own custody; its receipts name the model that ran each verb. The operator's local tenant subscribes to it over a filtered stream, folds what arrives into shadow, and blesses by policy or by hand. The operator's own log never left the machine. Two tenants, two truths, one contract.

### 28.8 Inference tiers — Workers AI as a Layer

The LLM is a service behind an Effect Layer, and the schema of record already produces Ax signatures, so a provider is a swap the verbs do not see. What changes by provider is which tier of work it is trusted with.

| Tier | Work | Model class | Where it runs | Governance |
|---|---|---|---|---|
| Edge | Classification, summarization, the rerank step of retrieval, alias-candidate scoring, verdict prediction on labeled data | Small open models, hosted rerankers | Workers AI (deployed) or a local small model | Instructions authored by a teacher model during Ax optimization; artifact scored against baseline before proposal |
| Judgment | Schema induction, evaluation with a counterfactual, reconciliation, anything requiring reasons | Frontier | API, locally or through AI Gateway | Never delegated to the edge tier; the `because` must be one a human would accept |
| Author-facing | Prose in a voice, proposals Danny will read | Frontier, governed by the skill that owns the voice | API | Voice separation (site vs author) enforced by skill |

- **The model is on the receipt.** Every receipt names the model that ran the verb, so tiering is auditable per event and R(t) can be reported per model.
- **Teacher–student is the bridge between tiers.** A frontier model authors instructions during optimization; an edge model runs them at verb time; the optimizer artifact records both, its training window, and its score. Section 16.
- **AI Gateway is telemetry, not corpus.** Its caching, rate limits, and request logs are operational. They never become a source of truth, never feed the fold, and never hold a prompt the log does not already hold. INV-NS-010: no inference gateway or cache is read by any fold.
- **No tier is chosen by cost alone.** A tier change is a decision record with the discrimination-harness numbers before and after.

### 28.9 Reachability — Tunnel and Access

Local-first gains reachability without giving anything up.

- **Cloudflare Tunnel exposes the local tenant actor** — its mailbox, projection, and verb surface — to a phone, a second machine, or a deployed admin panel, with no open ports. Access puts identity in front of it. The local actor remains the source of truth; the tunnel is a path to it.
- **Remote surfaces are stateless** (section 19). A deployed admin panel invokes verbs over the tunnel and reads projections; it holds nothing.
- **The write path still does not depend on the tunnel.** Capture on the phone with the tunnel down is a short-lived actor writing its own session file under its own key; it merges by `step` on reconnect. Nothing is lost; nothing is written to a remote store first.
- **Reachability is per tenant.** This is the "reachable from another machine" trigger firing for one tenant without that tenant moving off the machine.
- **Access identity is not fabric identity.** Access authenticates a person to a surface; the DID authenticates a tenant to the log. A surface authenticated by Access still signs with the key of the tenant it is acting for, never with an Access identity.

### 28.10 Orchestration — a projection, not a framework

Orchestration frameworks do not enter the house. LangGraph, CrewAI, and their family would be a second way to do what the verb runtime, capability grants, tenant actors, and Effect Streams already do — and they do not carry a `because` on each step. A framework that chooses the next action makes a choice with no provenance, which is the one thing the system exists to prevent.

What orchestration is here:

| Need | What it is in the fabric |
|---|---|
| Who may do what | The delegation graph: a fold over `capability.granted` / `.revoked`. |
| What happened, in what order, caused by what | The execution trace: a fold over receipts and `causedBy`. |
| An "orchestrating agent" | A tenant with grants that sub-delegates a narrowed subset to other tenants. Its decisions are receipts with `because`. |
| Multi-step work that outlives a process | A durable verb: an Effect program appending a checkpoint event per step, resuming from the last; Workflows when deployed. |
| Parallelism and retry | Effect's, inside a verb. Never a scheduler above the verb runtime. |
| Subagents | Claude Code's subagents or Ax's `agent()` — permitted as the *inside* of a verb, whose receipt carries the outcome and the `because`. Never as a layer that decides which verbs run. |

INV-NS-011: no action is taken in any tenant except through a verb in that tenant's manifest, and every verb's execution is a receipt. There is no execution that is not a receipt, and no receipt without a reason.

### 28.11 Federation is held

ATProto's semantics are adopted now — DIDs, signed repos, namespaced kinds, addresses, the PDS/AppView/relay decomposition — because they are the right local semantics for multiple tenants with separate truths. Running an actual PDS, publishing to the actual network, or speaking the actual wire protocol is held, with a trigger: a second operator whose tenant Danny wants to subscribe to, who is not on this machine. Until then the shapes are the same and the wire is git.

### 28.12 Invariants added

| Id | Statement |
|---|---|
| INV-NS-006 | An event whose signature does not verify against its actor's DID is unrepresentable in the log. |
| INV-NS-007 | No event reaches a tenant's canonical projection by virtue of another tenant's blessing. |
| INV-NS-008 | A delegated capability can only narrow; no grant confers more than its issuer holds. |
| INV-NS-009 | A tenant's log is appended only by that tenant's actor; sessions and disconnected surfaces append to their own files and are merged by the actor. |
| INV-NS-010 | No inference gateway, cache, or telemetry store is read by any fold. |
| INV-NS-011 | No action is taken in any tenant except through a verb in its manifest, and every verb execution is a receipt with a `because`. |

### 28.13 Event kinds added (Appendix A)

| Kind | Actor | State on arrival | Notes |
|---|---|---|---|
| `dyer.fabric.key.rotated` | author / agent (own tenant) | canonical | chained to prior key |
| `dyer.fabric.capability.granted` / `.revoked` | issuer | canonical in both tenants | delegation graph |
| `dyer.fabric.trust.policy` | author | canonical | per source, per kind |
| `dyer.fabric.subscription.opened` / `.closed` | subscriber | canonical | by kind, from a DID |
| `dyer.fabric.checkpoint` | agent | canonical (bookkeeping) | durable verbs; one per step |
| `dyer.fabric.tier.decided` | author | canonical | inference tier change, with harness numbers |
| `import:tenant:<did>` (any kind) | import | proposal | gated by policy |

### 28.14 Triggers added (Appendix C)

| Trigger | Unlocks |
|---|---|
| a second tenant on this machine (the first specialized agent) | DIDs, signing, capability grants — the local semantics |
| the first cross-tenant citation | per-source R(t) |
| a second issuer of capabilities | UCAN adoption |
| a surface on another device | Tunnel and Access for that tenant |
| a verb that must outlive a process on a machine that may sleep | durable verb checkpoints; Workflows when deployed |
| a verb whose model must run at the edge | Workers AI for the edge tier, with harness numbers |
| a tenant that must be reachable from another machine | that tenant's actor on a Durable Object |
| a second operator off-machine | the wire; federation |

### 28.15 What this section does not change

- **Two graph primitives.** A DID is an actor, not a primitive; a capability is an event, not a primitive; a checkpoint is an event.
- **The schema of record is one place.** Namespacing is how it holds many tenants' kinds; it is not a second schema.
- **The bless gate is one piece of code.** Policy is a blessed input to it, not a bypass.
- **Directive 12.** `tenant`, `space`, `actor` keep their meanings; a DID is what a tenant *is*, not a new name for it.
- **The write path never depends on the network,** and the site has no production runtime.
