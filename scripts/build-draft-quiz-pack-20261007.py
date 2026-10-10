#!/usr/bin/env python3
"""Build the isolated 2026-10-07 TRAPPIST-1 quiz draft."""
import argparse
import datetime as dt
import hashlib
import itertools
import json
import math
import unicodedata
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
DEFAULT = ROOT / "content/research/2026-10-07-trappist-pack"


def norm(value):
    return " ".join(unicodedata.normalize("NFKC", value or "").casefold().split())


def identity(game, row):
    if game == "moreless":
        key = ["pair", *sorted((norm(row["l"]), norm(row["r"]))), norm(row["u"])]
    else:
        key = [game, norm(row["s"] if game == "facts" else row["q"])]
    return json.dumps(key, ensure_ascii=False, separators=(",", ":"))


def fingerprint(game, row):
    return hashlib.sha256(identity(game, row).encode()).hexdigest()


def encoded(value):
    return json.dumps(value, ensure_ascii=False, indent=2) + "\n"


def build(folder):
    sources = json.loads((folder / "sources.json").read_text())
    authored = json.loads((folder / "input.json").read_text())
    daily = json.loads((folder / "daily-catalogue-check.json").read_text())
    parallel = json.loads((folder / "parallel-pr-check.json").read_text())
    verified = authored["verified"]
    checked = dt.date.fromisoformat(verified)

    assert authored["status"] == "draft"
    assert authored["base_commit"] == "0ca6f66d0f1efea5709b7de9f3256413e0a2f5b1"
    assert daily["checked"] == verified and daily["search_term"] == "trappist"
    assert daily["hit_count"] == 0
    assert daily["counts"] == {"total": 7187, "moreless": 4228, "estimate": 1507, "facts": 1452, "jeopardy": 0}
    assert {item["pr"] for item in parallel["open_content_prs"]} == {122, 126, 127, 128}

    baseline_text = (ROOT / "content/approved.js").read_text()
    baseline = json.loads(baseline_text.split("=", 1)[1].rstrip(";\n"))
    schedule = json.loads((ROOT / "content/review-schedule.json").read_text())
    due = [row for row in schedule["records"] if not row.get("next_review") or row["next_review"] <= verified]
    assert not due, "Baseline review schedule has due entries"

    planets = authored["planets"]
    assert len(planets) == 5 and len({p["name"] for p in planets}) == 5
    common = {
        "cat": "Weltraum",
        "subcategory": "Exoplaneten",
        "sets": ["Exoplaneten · TRAPPIST-1 · Entwurf"],
        "visual": "trappist-system",
        "data_years": [2025],
        "time_dependent": False,
        "status": "draft",
    }
    moreless = []
    for left, right in itertools.combinations(planets, 2):
        moreless.append({
            "id": f"trappist-period-{left['key']}-{right['key']}",
            "l": left["name"], "r": right["name"],
            "lv": left["period_days"], "rv": right["period_days"],
            "u": "Tage · Umlaufzeit laut NASA-Exoplanetenkatalog (auf eine Dezimalstelle)",
            "metric": "Umlaufzeit um TRAPPIST-1",
            "sub": "Umlaufzeit um TRAPPIST-1",
            "prompt": "Welcher Planet benötigt länger für einen Umlauf um TRAPPIST-1?",
            "source_refs": [left["source_ref"], right["source_ref"]],
            **common,
        })
    estimates = [{
        "id": f"trappist-estimate-period-{planet['key']}",
        "q": f"Wie viele Erdtage benötigt {planet['name']} laut NASA ungefähr für einen Umlauf?",
        "a": planet["period_days"], "u": "Erdtage", "subject": planet["name"],
        "source_refs": [planet["source_ref"]], **common,
    } for planet in planets]
    facts = [{**row, **common} for row in authored["facts"]]
    jeopardy = [{**row, **{k: v for k, v in common.items() if k != "visual"}} for row in authored["jeopardy"]]
    games = {"moreless": moreless, "estimate": estimates, "facts": facts, "jeopardy": jeopardy}
    assert {game: len(rows) for game, rows in games.items()} == {"moreless": 10, "estimate": 5, "facts": 5, "jeopardy": 5}
    assert sum(row["a"] for row in facts) == 3

    forbidden = {fingerprint(game, row) for game in games for row in baseline[game]}
    seen, reviews = set(), []
    output = {"status": "review-only", "verified": verified, "base_commit": authored["base_commit"], "images": {}}
    for game, rows in games.items():
        output[game] = []
        for row in rows:
            assert row["id"] not in seen
            key = fingerprint(game, row)
            assert key not in forbidden and key not in seen, f"Duplicate: {row['id']}"
            seen.add(key)
            assert row["source_refs"] and row["data_years"] == [2025]
            for ref in row["source_refs"]:
                source = sources[ref]
                assert source["publisher"] == "NASA" and source["verified"] == verified
                assert source["url"].startswith("https://science.nasa.gov/") and source["evidence"]
                assert 2025 in source["data_years"]
            if game == "moreless":
                assert row["lv"] != row["rv"] and all(math.isfinite(row[k]) for k in ("lv", "rv"))
            elif game == "estimate":
                assert math.isfinite(row["a"])
            elif game == "facts":
                assert type(row["a"]) is bool and row["e"] and row["difficulty"] in ("easy", "medium", "hard")
            else:
                assert row["a"].strip() and 1 <= row["difficulty"] <= 5 and "visual" not in row
            cooked = {**row, "source": sources[row["source_refs"][0]]["url"],
                      "sources": [sources[ref]["url"] for ref in row["source_refs"]], "verified": verified}
            if game == "moreless":
                cooked["correct"] = "left" if row["lv"] > row["rv"] else "right"
            output[game].append(cooked)
            reviews.append({
                "id": row["id"], "verified": verified, "data_years": row["data_years"],
                "sources": cooked["sources"], "time_dependent": False,
                "review_interval_days": 365, "next_review": (checked + dt.timedelta(days=365)).isoformat(),
                "review_status": "draft_not_approved",
            })

    motif = ('<circle cx="300" cy="245" r="70" fill="#f48b55"/>'
             '<g fill="none" stroke="#78d9ff" stroke-width="8" opacity=".9">'
             '<ellipse cx="300" cy="245" rx="135" ry="55"/><ellipse cx="300" cy="245" rx="205" ry="90"/>'
             '</g><circle cx="427" cy="215" r="16" fill="#c9a6ff"/>'
             '<circle cx="112" cy="270" r="13" fill="#9ff0d0"/>')
    products = {}
    image = {"license": "CC0-1.0", "generated": False, "answer_neutral": True,
             "description": "Originale schematische Themenillustration ohne Zahlen oder Planetenbezeichnungen."}
    for kind, width in (("card", 720), ("detail", 960)):
        rel = f"visuals/trappist-system-{kind}.svg"
        offset = (width - 600) / 2
        svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="540" viewBox="0 0 {width} 540" role="img">'
               '<title>TRAPPIST-1 – neutrale Systemillustration</title>'
               f'<rect width="{width}" height="540" rx="28" fill="#0b1530"/>'
               f'<g transform="translate({offset:g} 0)">{motif}</g>'
               f'<text x="{width/2:g}" y="475" text-anchor="middle" font-family="sans-serif" font-size="32" fill="#eff4ff">TRAPPIST-1</text></svg>\n')
        products[rel] = svg
        image[kind] = rel
    output["images"]["trappist-system"] = image

    products["draft-pack.json"] = encoded(output)
    products["draft-review-schedule.json"] = encoded({"policy": schedule["policy"], "records": reviews})
    products["validation.json"] = encoded({
        "verified": verified, "counts": {game: len(rows) for game, rows in games.items()},
        "unique_primary_sources": len(sources), "daily_counts": daily["counts"],
        "daily_search_term": daily["search_term"], "daily_search_hits": daily["hit_count"],
        "open_content_prs_checked": [122, 126, 127, 128], "due_baseline_records": len(due),
        "baseline_review_sha256": hashlib.sha256((ROOT / "content/review-schedule.json").read_bytes()).hexdigest(),
        "baseline_pack_sha256": hashlib.sha256(baseline_text.encode()).hexdigest(),
        "release_blockers": ["Redaktionelle Freigabe von Schwierigkeit und Formulierung",
                             "Übernahme ausschließlich über die freigegebene Katalogpipeline"],
        "database_writes": False,
    })
    return products


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--folder", type=Path, default=DEFAULT)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    products = build(args.folder)
    for rel, text in products.items():
        path = args.folder / rel
        if args.check:
            assert path.read_text() == text, f"Stale generated file: {rel}"
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(text)
        if rel.endswith(".svg"):
            root = ET.fromstring(text)
            assert (int(root.attrib["width"]), int(root.attrib["height"])) in ((720, 540), (960, 540))
    print("OK: 10 More/Less, 5 estimates, 5 Fact/Fake, 5 Jeopardy; NASA sources; duplicate checks; deterministic review-only output")
