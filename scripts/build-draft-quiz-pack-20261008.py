#!/usr/bin/env python3
"""Build an isolated, review-only rare-elements quiz draft."""
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
DEFAULT = ROOT / "content/research/2026-10-08-rare-elements-pack"

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
    assert daily["checked"] == verified and daily["hit_count"] == 0 and daily["read_only"]
    assert daily["counts"] == {"total": 7187, "moreless": 4228, "estimate": 1507, "facts": 1452, "jeopardy": 0}
    assert {item["pr"] for item in parallel["open_content_prs"]} == {122, 126, 127, 128, 129}

    baseline_text = (ROOT / "content/approved.js").read_text()
    baseline = json.loads(baseline_text.split("=", 1)[1].rstrip(";\n"))
    schedule = json.loads((ROOT / "content/review-schedule.json").read_text())
    due = [row for row in schedule["records"] if not row.get("next_review") or row["next_review"] <= verified]
    assert not due, "Baseline review schedule has due entries"

    elements = authored["elements"]
    assert len(elements) == 5 and len({row["name"] for row in elements}) == 5
    common = {
        "cat": "Wissenschaft", "subcategory": "Elemente",
        "sets": ["Seltene Elemente · Entwurf"], "visual": "rare-elements",
        "status": "draft", "time_dependent": False,
    }
    moreless = []
    for left, right in itertools.combinations(elements, 2):
        moreless.append({
            "id": f"rare-elements-atomic-{left['key']}-{right['key']}",
            "l": left["name"], "r": right["name"],
            "lv": left["atomic_number"], "rv": right["atomic_number"],
            "u": "Ordnungszahl · Protonenzahl laut RSC-Periodensystem",
            "metric": "Ordnungszahl", "sub": "Ordnungszahl",
            "prompt": "Welches Element hat die höhere Ordnungszahl?",
            "source_refs": [left["source_ref"], right["source_ref"]],
            "data_years": [2015], **common,
        })
    estimates = [{
        "id": f"rare-elements-estimate-{element['key']}",
        "q": f"Welche Ordnungszahl hat {element['name']} laut RSC?",
        "a": element["atomic_number"], "u": "Ordnungszahl", "subject": element["name"],
        "source_refs": [element["source_ref"]], "data_years": [2015], **common,
    } for element in elements]
    facts = [{**row, **common} for row in authored["facts"]]
    jeopardy = [{**row, **{k: value for k, value in common.items() if k != "visual"}} for row in authored["jeopardy"]]
    games = {"moreless": moreless, "estimate": estimates, "facts": facts, "jeopardy": jeopardy}
    assert {game: len(rows) for game, rows in games.items()} == {"moreless": 10, "estimate": 5, "facts": 5, "jeopardy": 5}
    assert sum(row["a"] for row in facts) == 3

    forbidden = {fingerprint(game, row) for game in games for row in baseline[game]}
    seen, ids, reviews = set(), set(), []
    output = {"status": "review-only", "verified": verified, "base_commit": authored["base_commit"], "images": {}}
    for game, rows in games.items():
        output[game] = []
        for row in rows:
            assert row["id"] not in ids
            ids.add(row["id"])
            key = fingerprint(game, row)
            assert key not in forbidden and key not in seen, f"Duplicate: {row['id']}"
            seen.add(key)
            assert row["source_refs"] and row["data_years"]
            for ref in row["source_refs"]:
                source = sources[ref]
                assert source["publisher"] == "Royal Society of Chemistry"
                assert source["verified"] == verified and source["url"].startswith("https://periodic-table.rsc.org/")
                assert source["evidence"] and set(row["data_years"]) <= set(source["data_years"])
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
                "review_interval_days": 730, "next_review": (checked + dt.timedelta(days=730)).isoformat(),
                "review_status": "draft_not_approved",
            })

    motif = ('<g fill="none" stroke="#7edcf6" stroke-width="9"><circle cx="300" cy="235" r="44"/>'
             '<ellipse cx="300" cy="235" rx="150" ry="60"/><ellipse cx="300" cy="235" rx="62" ry="150" transform="rotate(38 300 235)"/>'
             '</g><g fill="#c8a5ff"><circle cx="448" cy="220" r="14"/><circle cx="205" cy="330" r="12"/>'
             '<circle cx="322" cy="88" r="11"/></g><g fill="#5d6ca8" opacity=".55">'
             '<rect x="90" y="390" width="70" height="45" rx="8"/><rect x="170" y="390" width="70" height="45" rx="8"/>'
             '<rect x="250" y="390" width="70" height="45" rx="8"/><rect x="330" y="390" width="70" height="45" rx="8"/>'
             '<rect x="410" y="390" width="70" height="45" rx="8"/></g>')
    products = {}
    image = {"license": "CC0-1.0", "generated": False, "answer_neutral": True,
             "description": "Originale Atom- und Tabellensilhouette ohne Elementsymbole, Zahlen oder Lösungswerte."}
    for kind, width in (("card", 720), ("detail", 960)):
        rel = f"visuals/rare-elements-{kind}.svg"
        offset = (width - 600) / 2
        svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="540" viewBox="0 0 {width} 540" role="img">'
               '<title>Seltene Elemente – neutrale Themenillustration</title>'
               f'<rect width="{width}" height="540" rx="28" fill="#0c1730"/>'
               f'<g transform="translate({offset:g} 0)">{motif}</g>'
               f'<text x="{width/2:g}" y="490" text-anchor="middle" font-family="sans-serif" font-size="30" fill="#eff4ff">Seltene Elemente</text></svg>\n')
        products[rel] = svg
        image[kind] = rel
    output["images"]["rare-elements"] = image
    products["draft-pack.json"] = encoded(output)
    products["draft-review-schedule.json"] = encoded({"policy": schedule["policy"], "records": reviews})
    products["validation.json"] = encoded({
        "verified": verified, "counts": {game: len(rows) for game, rows in games.items()},
        "unique_authoritative_sources": len(sources), "daily_counts": daily["counts"],
        "daily_search_terms": daily["search_terms"], "daily_search_hits": daily["hit_count"],
        "open_content_prs_checked": [122, 126, 127, 128, 129], "due_baseline_records": len(due),
        "baseline_review_sha256": hashlib.sha256((ROOT / "content/review-schedule.json").read_bytes()).hexdigest(),
        "baseline_pack_sha256": hashlib.sha256(baseline_text.encode()).hexdigest(),
        "release_blockers": ["Redaktionelle Freigabe von Schwierigkeit und deutscher Benennung",
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
    print("OK: 10 More/Less, 5 estimates, 5 Fact/Fake, 5 Jeopardy; RSC sources; duplicate checks; deterministic review-only output")
