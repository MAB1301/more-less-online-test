#!/usr/bin/env python3
"""Build reviewed game content and offline image variants from a local catalogue."""
import argparse
import base64
import io
import itertools
import json
import re
from content_sets import annotate
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets/visuals/ugc"


def crop(source, target, size, focus):
    with Image.open(source) as original:
        image = ImageOps.exif_transpose(original).convert("RGB")
        w, h = image.size
        ratio = size[0] / size[1]
        cw, ch = (int(h * ratio), h) if w / h > ratio else (w, int(w / ratio))
        left = max(0, min(w - cw, round(focus[0] * w - cw / 2)))
        top = max(0, min(h - ch, round(focus[1] * h - ch / 2)))
        image.crop((left, top, left + cw, top + ch)).resize(size, Image.Resampling.LANCZOS).save(
            target, "WEBP", quality=82, method=6
        )


def build(catalogue, output, images_dir=OUT, trivia=None):
    records = json.loads(catalogue.read_text(encoding="utf-8"))
    if not isinstance(records, list):
        raise ValueError("Catalogue must be a JSON array")
    pack = {"images": {}, "moreless": [], "estimate": [], "facts": [], "jeopardy": []}
    groups, ids, names = {}, set(), set()
    for record in records:
        if record.get("status") != "approved":
            continue
        ident, name = record["id"], record["name"].strip()
        if not re.fullmatch(r"[a-z0-9-]+", ident) or ident in ids or name in names:
            raise ValueError(f"Duplicate or invalid subject: {ident} / {name}")
        ids.add(ident); names.add(name)
        raw_image = record["image"]
        if raw_image.startswith("data:image/"):
            image = io.BytesIO(base64.b64decode(raw_image.split(",", 1)[1], validate=True))
        else:
            image = (catalogue.parent / raw_image).resolve()
        if (isinstance(image, Path) and not image.is_file()) or not record.get("image_source") or not record.get("image_license"):
            raise ValueError(f"Image, source and license required: {ident}")
        if not record["image_source"].startswith("https://"):
            raise ValueError(f"HTTPS image credit required: {ident}")
        focus = record.get("focus", [0.5, 0.5])
        if len(focus) != 2 or any(not isinstance(v, (int, float)) or not 0 <= v <= 1 for v in focus):
            raise ValueError(f"Invalid focal point: {ident}")
        images_dir.mkdir(parents=True, exist_ok=True)
        variants = record.get("variants")
        if variants:
            for kind in ("card", "detail"):
                asset = variants.get(kind, "")
                if not asset or ".." in Path(asset).parts or not (ROOT / "assets/visuals" / asset).is_file():
                    raise ValueError(f"Invalid prepared image: {ident}")
            pack["images"][name] = {**variants, "source": record["image_source"], "license": record["image_license"], "generated": record.get("generated", False)}
        else:
            for kind, size in (("card", (720, 540)), ("detail", (960, 540))):
                crop(image, images_dir / f"{ident}-{kind}.webp", size, focus)
            pack["images"][name] = {"card": f"ugc/{ident}-card.webp", "detail": f"ugc/{ident}-detail.webp", "source": record["image_source"], "license": record["image_license"]}
        for alias in record.get("aliases", []):
            if alias in names or not isinstance(alias, str) or not alias.strip():
                raise ValueError(f"Invalid duplicate alias: {alias}")
            names.add(alias); pack["images"][alias] = pack["images"][name]
        for fact in record.get("facts", []):
            metric, unit, value, source = (fact[k] for k in ("metric", "unit", "value", "source"))
            if not isinstance(value, (int, float)) or isinstance(value, bool) or not source.startswith("https://") or not metric or not unit:
                raise ValueError(f"Invalid fact: {ident}")
            cat = fact.get("category", "Tierwelt")
            key = (cat, metric, unit, fact.get("comparison_unit", unit))
            if fact.get("sources") and not all(isinstance(url,str) and url.startswith("https://") for url in fact["sources"]):
                raise ValueError(f"HTTPS derived sources required: {ident}")
            groups.setdefault(key, []).append((name, value, source, fact.get("verified"), fact.get("exclude_with", []), fact))
            if fact.get("estimate_question"):
                pack["estimate"].append({"q": fact["estimate_question"], "a": value, "u": unit, "subject": name, "cat": cat, "source": source, "verified": fact.get("verified"), "notes": fact.get("notes", ""), **{k:fact[k] for k in ("subcategory","set","expansion","sources") if k in fact}})
            if fact.get("fact_statement"):
                if not isinstance(fact.get("fact_answer"), bool) or not fact.get("fact_explanation"):
                    raise ValueError(f"Fact or Fake answer/explanation missing: {ident}")
                difficulty = fact.get("fact_difficulty", "easy")
                if difficulty not in ("easy", "medium", "hard"):
                    raise ValueError(f"Invalid Fact or Fake difficulty: {ident}")
                pack["facts"].append({"s": fact["fact_statement"], "a": fact["fact_answer"], "e": fact["fact_explanation"], "cat": cat, "subject": name, "difficulty": difficulty, "source": source, "verified": fact.get("verified")})
            if fact.get("jeopardy_question"):
                if not fact.get("jeopardy_answer"):
                    raise ValueError(f"Jeopardy answer missing: {ident}")
                pack["jeopardy"].append({"cat": cat, "q": fact["jeopardy_question"], "a": fact["jeopardy_answer"], "subject": name})
    for (cat, metric, unit, comparison_unit), entries in groups.items():
        # One pair per entry; never compare different measures or units.
        if len(entries) < 2:
            continue
        for a, b in itertools.combinations(entries, 2):
            left, lv, ls, ld, lx, lf = a
            right, rv, rs, rd, rx, rf = b
            if lv != rv and right not in lx and left not in rx:
                pack["moreless"].append({"l": left, "r": right, "lv": lv, "rv": rv, "u": comparison_unit, "cat": cat, "metric": metric, "sub": metric, "source": ls, "sources": [ls, rs], "verified": ld if ld == rd else None, **{k:lf[k] for k in ("subcategory","set") if k in lf and lf.get(k)==rf.get(k)}, **({"expansion":8} if lf.get("expansion")==8 or rf.get("expansion")==8 else {})})
    if trivia is not None:
        curated = json.loads(trivia.read_text(encoding="utf-8"))
        if curated.get("status") == "approved":
            for kind, prompt in (("facts", "s"), ("jeopardy", "q"), ("estimate", "q")):
                seen = {item[prompt].strip().casefold() for item in pack[kind]}
                for item in curated.get(kind, []):
                    for field in (prompt, "cat", "source", "verified"):
                        if not isinstance(item.get(field), str) or not item[field].strip():
                            raise ValueError(f"Missing trivia field: {kind}/{field}")
                    key = item[prompt].strip().casefold()
                    if key in seen or len(item[prompt]) > 500:
                        raise ValueError(f"Duplicate or oversized trivia prompt: {key}")
                    seen.add(key)
                    sources = item.get("sources", [item["source"]])
                    if not sources or not all(isinstance(url, str) and url.startswith("https://") for url in sources) or not item["source"].startswith("https://"):
                        raise ValueError("HTTPS trivia sources required")
                    if item.get("subject") and item["subject"] not in pack["images"]:
                        raise ValueError(f"Unresolved trivia visual: {item['subject']}")
                    if kind == "facts":
                        if not isinstance(item.get("a"), bool) or not item.get("e") or item.get("difficulty") not in ("easy", "medium", "hard"):
                            raise ValueError("Fact/Fake requires a boolean answer, explanation and level")
                    elif kind == "estimate":
                        if not isinstance(item.get("a"), (int,float)) or isinstance(item["a"],bool) or not item.get("u"):
                            raise ValueError("Estimate requires a numeric answer and unit")
                    elif not isinstance(item.get("a"), str) or not item["a"].strip() or type(item.get("difficulty")) is not int or not 1 <= item["difficulty"] <= 5:
                        raise ValueError("Jeopardy requires an answer and level 1–5")
                    pack[kind].append({**item, "sources": sources})
    annotate(pack)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text("window.GAME_CONTENT_PACK=" + json.dumps(pack, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(f"{len(pack['images'])} images, {len(pack['moreless'])} comparisons, {len(pack['estimate'])} estimates, {len(pack['facts'])} facts, {len(pack['jeopardy'])} Jeopardy clues")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("catalogue", type=Path)
    parser.add_argument("--output", type=Path, default=ROOT / "content/approved.js")
    parser.add_argument("--trivia", type=Path, default=ROOT / "content/trivia.json")
    args = parser.parse_args()
    build(args.catalogue.resolve(), args.output.resolve(), trivia=args.trivia.resolve() if args.trivia.is_file() else None)
