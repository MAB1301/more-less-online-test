#!/usr/bin/env python3
"""Validate a research batch and export review-only comparisons and estimates."""
import argparse
import itertools
import json
import math
import re
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse

PROMPTS = json.loads("{\"Länder\":\"Welches Land hat die größere Staatsfläche?\",\"Städte\":\"Welche Stadt hat mehr Verwaltungsbezirke?\",\"Natur\":\"Welcher Nationalpark wurde später gegründet?\",\"Sport\":\"Bei welcher Sportart stehen regulär mehr Spieler eines Teams gleichzeitig auf dem Feld?\",\"Bauwerke\":\"Welches Bauwerk wurde später offiziell eröffnet?\",\"Tierwelt\":\"Welches Tier hat nach diesen groben Richtwerten die längere Tragzeit?\",\"Fußballer\":\"Welcher Fußballer wurde später geboren?\",\"Autos\":\"Welches Auto hat mehr Zylinder im Verbrennungsmotor?\",\"Weltraum\":\"Welcher Planet braucht länger für einen Umlauf um die Sonne?\",\"Wissenschaft\":\"Welches Element hat mehr Protonen im Atomkern?\",\"Allgemeinwissen\":\"Welches der angegebenen Grunddecks enthält mehr Karten?\",\"Rekorde & Extreme\":\"Welche der angegebenen Männer-Weltrekordzeiten ist länger?\",\"Raumfahrt\":\"Welche Mission wurde später gestartet?\",\"Weltkultur\":\"Welches Bauwerk wurde später erstmals UNESCO-Welterbe?\"}")
EXPECTED = set(PROMPTS)

def build(path):
    records = json.loads(path.read_text(encoding="utf-8"))
    groups = {}
    ids = set()
    estimates = []
    for record in records:
        ident = record["id"]
        if not re.fullmatch(r"[a-z0-9-]+", ident) or ident in ids:
            raise ValueError(f"Duplicate/invalid ID: {ident}")
        ids.add(ident)
        if record["status"] != "draft" or record["visual"]["status"] != "pending":
            raise ValueError("Research exports must remain review-only")
        if not record["name"].strip():
            raise ValueError("Empty subject")
        for fact in record["facts"]:
            cat, metric, unit = fact["category"], fact["metric"], fact["comparison_unit"]
            value = fact["value"]
            if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
                raise ValueError("Invalid numeric value")
            url = urlparse(fact["source"])
            if url.scheme != "https" or not url.hostname:
                raise ValueError("HTTPS source required")
            if fact["verified"] != "2026-10-01" or not fact["estimate_question"].strip():
                raise ValueError("Verification date/question missing")
            groups.setdefault((cat, metric, unit), []).append((record, fact))
            estimates.append({"id": ident + "-estimate", "q": fact["estimate_question"], "a": value,
                              "u": fact["unit"], "cat": cat, "subject": record["name"],
                              "source": fact["source"], "notes": fact["notes"], "status": "draft"})
    if set(k[0] for k in groups) != EXPECTED:
        raise ValueError("Batch must cover all 14 existing categories")
    comparisons = []
    keys = set()
    for (cat, metric, unit), entries in groups.items():
        for (left, lf), (right, rf) in itertools.combinations(entries, 2):
            if lf["value"] == rf["value"]:
                continue
            key = (cat, metric, unit, *sorted([left["name"], right["name"]]))
            if key in keys:
                raise ValueError("Repeated or mirrored comparison")
            keys.add(key)
            comparisons.append({
                "id": left["id"] + "--" + right["id"], "l": left["name"], "r": right["name"],
                "lv": lf["value"], "rv": rf["value"], "u": unit, "cat": cat,
                "metric": metric, "sub": lf["sub"], "prompt": PROMPTS[cat],
                "correct": "left" if lf["value"] > rf["value"] else "right",
                "sources": [lf["source"], rf["source"]], "verified": lf["verified"],
                "notes": [lf["notes"], rf["notes"]], "status": "draft"
            })
    counts = Counter(x["cat"] for x in comparisons)
    if any(counts[cat] < 3 for cat in EXPECTED):
        raise ValueError("At least three unequal comparisons required per category")
    for label, questions in [("estimate", estimates), ("comparison", comparisons)]:
        fingerprints = [q["q"].casefold() if label == "estimate" else q["id"] for q in questions]
        if len(fingerprints) != len(set(fingerprints)):
            raise ValueError(f"Duplicate {label}")
    return {"status": "review-only", "release_blockers": [
        "Complete subject-specific images, rights/credits and crop review",
        "Editorial review, especially approximate gestation and dated record values",
        "Import into approved catalogue, regenerate approved.js and run client regression"
    ], "moreless": comparisons, "estimate": estimates}

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("catalogue", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    pack = build(args.catalogue)
    if args.output:
        args.output.write_text(json.dumps(pack, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"OK: {len(pack['moreless'])} comparisons, {len(pack['estimate'])} estimates; all 14 categories; review-only")

