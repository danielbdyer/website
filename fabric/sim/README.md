# `fabric/sim/` — synthetic proof of the loop

This folder holds the committed output of the fabric's synthetic proof: `baseline.json`, the discrimination curve the §5 regression gate is anchored to. It is not an event log. The real log lives one folder over in `fabric/spaces/`, and the firewall between them is the point of this whole exercise.

## Why it exists

The loop the fabric measures — retrieval → citation → R(t) — is architecturally complete and has, in the real log, never closed: R(t) = 0 of 0. The synthetic proof closes it before a real session runs, so the first real blessing is a small, well-understood act and not a leap. What synthetic data can and cannot establish is stated in `CORPUS.md` Part three §0; the short form is that it proves the plumbing, that the metric discriminates good retrieval from bad, and how the fold scales — and that it proves nothing about whether real retrieval will be useful, which only real sessions produce.

## The firewall

A synthetic event is unrepresentable as a real one, held two ways:

- **Provenance.** Every synthetic event carries actor `import:synthetic`. A real session's activity is `agent:<session>`; the two never collide. The stamp is minted at the log seam over the real verb programs, so every number the instrument reads is the real code's and only the label is the harness's.
- **Physical separation.** A synthetic run writes to a temporary directory and a `sim:<run-id>` tenant, never `fabric/spaces/` and never `danny` or `agent`. No synthetic event log is ever committed; only the regenerable metrics in this folder are. The real fold reads `fabric/spaces/` alone, so it cannot see a synthetic event even in principle.

`packages/fabric/src/sim/quarantine.test.ts` checks both halves, and that the committed real log folds to a synthetic-free R(t) of 0 of 0.

## Regenerating the baseline

```
pnpm fabric sim-baseline
```

runs the discrimination sweep and rewrites `baseline.json`. The numbers are deterministic — the corpus and the seeds are fixed — so a change to the retrieval code (`cut`, `candidatesOf`, `resonate`, or the fold that scores them) that lowers the curve is a regression, not noise. The sweep takes about half a minute; it is a manual command, not part of CI. The fast, asserted version of the proof runs in CI as `packages/fabric/src/sim/discrimination.test.ts`.

## What the code is

- `model.ts` — the generative corpus: planted ground truth, heavy-tailed hubs, an honest miss fraction, all from a seeded hash.
- `resonance.ts` — the quality knob: a retriever whose accuracy is a dial, `θ · signal + (1 − θ) · noise`, that the real `cut` ranks.
- `harness.ts` — the driver: every synthetic session runs through the real `slice` and `reflect` verbs; the θ sweep and the orient-k analysis.
- `quarantine.ts` — the firewall: the `import:synthetic` stamp and the guards.
- `baseline.ts` — the committed baseline and the `sim-baseline` command.
