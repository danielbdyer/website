"""The memory compile, as a sidecar.

Reads one JSON document on stdin — the reflections a viewer may see as
source turns, one question, and the time — and prints one JSON document
on stdout: the vendor's compiled claims, events with their times and
quantities, entities, conflicts, and its answer, reported as it gave it.

The vendor is activegraph-memory (Yohei Nakajima), run with its
deterministic extractor and no reasoner, so the same input prints the
same output. Install it into the interpreter FABRIC_PYTHON names:

    pip install "git+https://github.com/yoheinakajima/activegraph-memory"

Nothing here reasons. The session that asked is the only reasoner.
"""

import json
import sys


def _read():
    return json.load(sys.stdin)


def _turns(raw):
    from activegraph_memory import SourceTurn

    return [
        SourceTurn(
            turn_id=turn["id"],
            session_id=turn["session"],
            session_date=turn["date"],
            session_idx=int(turn["sessionIndex"]),
            turn_idx=int(turn["turnIndex"]),
            role=turn.get("role", "agent"),
            content=turn["text"],
            text=turn["text"],
        )
        for turn in raw.get("turns", [])
    ]


def _claim(record):
    claim = record.claim
    return {
        "id": record.claim_id,
        "text": claim.text,
        "kind": getattr(claim, "claim_kind", "fact"),
        "validFrom": getattr(claim, "valid_from", None),
        "observedAt": getattr(claim, "observed_at", None),
        "sources": list(getattr(claim, "source_ids", []) or []),
    }


def _event(record):
    quantities = []
    for quantity in getattr(record, "quantity_claims", []) or []:
        value = getattr(quantity, "value", None)
        if value is None:
            continue
        quantities.append(
            {
                "property": str(getattr(quantity, "property_name", "")),
                "value": float(value),
                "unit": str(getattr(quantity, "unit", "")),
            }
        )
    return {
        "id": record.event_id,
        "text": record.text,
        "predicate": getattr(record, "predicate", "state"),
        "start": getattr(record, "event_start", None),
        "end": getattr(record, "event_end", None),
        "observedAt": getattr(record, "observed_at", None),
        "quantities": quantities,
    }


def _entity(record):
    return {"id": record.entity_id, "label": record.label}


def _conflict(record):
    ids = getattr(record, "claim_ids", None) or getattr(record, "source_claim_ids", None) or []
    return {"id": getattr(record, "conflict_id", ""), "claims": list(ids)}


def _values(collection):
    return list(collection.values()) if isinstance(collection, dict) else list(collection)


def main():
    raw = _read()
    from activegraph_memory import (
        DeterministicMemoryExtractor,
        MemoryRuntime,
        compile_memory_index,
        extract_claim_inputs,
    )

    try:
        from importlib.metadata import version

        compiler = "activegraph-memory " + version("activegraph-memory")
    except Exception:  # noqa: BLE001 — the version is a courtesy, not a contract
        compiler = "activegraph-memory"

    turns = _turns(raw)
    claims, _ = extract_claim_inputs(turns, extractor=DeterministicMemoryExtractor())
    index = compile_memory_index(turns=turns, claims=claims)
    answer = MemoryRuntime("balanced").retrieve(
        index, raw.get("query", ""), question_date=str(raw.get("asOf", ""))[:10]
    )
    compiled = index.compiled
    document = {
        "compiler": compiler,
        "claims": [_claim(record) for record in _values(index.claims)],
        "events": [_event(record) for record in _values(index.events)],
        "entities": [_entity(record) for record in _values(index.entities)],
        "conflicts": [_conflict(record) for record in _values(getattr(compiled, "conflicts", []))],
        "answer": {
            "text": answer.context_text or "",
            "selected": list(answer.selected_claim_ids or []),
            "status": getattr(answer, "epistemic_status", None),
        },
    }
    json.dump(document, sys.stdout, default=str)


if __name__ == "__main__":
    main()
