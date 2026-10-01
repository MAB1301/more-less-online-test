#!/usr/bin/env python3
"""Smoke test the catalogue build, crop dimensions, draft gate and unit gate."""
import importlib.util
import json
import tempfile
from pathlib import Path

from PIL import Image

spec = importlib.util.spec_from_file_location("builder", Path(__file__).with_name("build-content-pack.py"))
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)

with tempfile.TemporaryDirectory() as temp:
    root = Path(temp)
    for ident in ("tier-a", "tier-b", "tier-c"):
        Image.new("RGB", (100, 200), "blue").save(root / f"{ident}.png")

    def record(ident, value, status="approved", unit="kg"):
        return {"id": ident, "name": ident, "image": f"{ident}.png", "image_source": "https://example.org/photo", "image_license": "CC0", "status": status,
                "focus": [0.5, 0.3], "facts": [{"metric": "Gewicht", "unit": unit, "comparison_unit": unit + " Gewicht ungefähr", "value": value,
                "source": "https://example.org/fact", "category": "Tierwelt", "estimate_question": "Wie schwer?"}]}

    catalogue = root / "catalogue.json"
    first = record("tier-a", 10)
    first["facts"][0].update({"fact_statement": "Die Aussage stimmt.", "fact_answer": True,
                               "fact_explanation": "Beleg im Faktenlink.", "fact_difficulty": "hard"})
    catalogue.write_text(json.dumps([first, record("tier-b", 20), record("tier-c", 30, "draft")]))
    output = root / "approved.js"
    builder.build(catalogue, output, root / "images")
    pack = json.loads(output.read_text().removeprefix("window.GAME_CONTENT_PACK=").rstrip(";\n"))
    assert len(pack["images"]) == 2 and len(pack["moreless"]) == 1 and len(pack["estimate"]) == 2
    assert pack["facts"][0]["difficulty"] == "hard" and pack["facts"][0]["source"] == "https://example.org/fact"
    assert Image.open(root / "images/tier-a-card.webp").size == (720, 540)
    assert Image.open(root / "images/tier-a-detail.webp").size == (960, 540)
    catalogue.write_text(json.dumps([record("tier-a", 10), record("tier-b", 20, unit="cm")]))
    builder.build(catalogue, output, root / "images")
    assert '"moreless":[]' in output.read_text(), "Different units must never be compared"
    left,right=record("tier-a",10),record("tier-b",20)
    left["facts"][0]["exclude_with"]=["tier-b"]
    catalogue.write_text(json.dumps([left,right]));builder.build(catalogue,output,root/"images")
    assert '\"moreless\":[]' in output.read_text(), "Existing semantic comparisons must remain excluded"
print("OK: approval, semantic unit gate, comparison exclusions and both crop formats")

