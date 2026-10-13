"""Build the 2026-10-13 workplace quiz review bundle offline; never publishes it."""
import argparse
import datetime
import json
import pathlib
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parents[1]
DIR = ROOT / "content/research/2026-10-13-arbeitswelt"
parser = argparse.ArgumentParser()
parser.add_argument("--check", action="store_true")
CHECK = parser.parse_args().check


def read(name):
    return json.loads((DIR / name).read_text())


def write(name, value):
    path = DIR / name
    if CHECK:
        assert path.exists() and path.read_text() == value, "Stale: " + name
    else:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(value)


def dump(name, value):
    write(name, json.dumps(value, ensure_ascii=False, indent=2) + "\n")


source_input = read("input.json")
sources = read("sources.json")
observations = read("rule-observations.json")
checked = datetime.date.fromisoformat(source_input["checked"])
main_ref = ROOT / ".git/refs/heads/Main"
if main_ref.exists():
    assert source_input["base_commit"] == main_ref.read_text().strip()

games = ["moreless", "estimate", "facts", "jeopardy"]
pack = {
    "status": "review-only",
    "verified": source_input["checked"],
    "base_commit": source_input["base_commit"],
    "images": {},
    **{game: [] for game in games},
}
seen_observations = set()
schedule = []

for question in source_input["questions"]:
    assert question["cat"] == "Arbeitswelt"
    assert question["subcategory"] == "Deutsches Arbeitsrecht · Stand 2026"
    assert question["data_year"] == 2026 and question["rounding"] and question["section"]
    assert all(sources[ref]["checked"] == source_input["checked"] and sources[ref]["primary"] for ref in question["source_refs"])
    for key in question["observation_keys"]:
        assert key not in seen_observations, "Repeated observation " + key
        seen_observations.add(key)
    row = {key: value for key, value in question.items() if key != "game"}
    row.update(
        status="draft",
        verified=source_input["checked"],
        source=sources[question["source_refs"][0]]["url"],
        sources=[sources[ref]["url"] for ref in question["source_refs"]],
        sets=["Arbeitswelt · deutsches Arbeitsrecht · Stand 2026"],
        time_dependent=True,
        data_year_note="2026 bezeichnet den am 13.10.2026 geprüften Gesetzesstand; Änderungen sind möglich.",
        visual=None if question["game"] == "jeopardy" else "workplace-neutral",
    )
    if question["game"] != "jeopardy":
        row["subject"] = "workplace-neutral"
    if question["game"] == "moreless":
        assert [observations[key]["value"] for key in question["observation_keys"]] == [question["lv"], question["rv"]]
        assert question["lv"] != question["rv"] and question["metric"]
    elif question["game"] == "estimate":
        assert observations[question["observation_keys"][0]]["value"] == question["a"]
    elif question["game"] == "facts":
        assert type(question["a"]) is bool and question["e"]
    else:
        assert isinstance(question["a"], str) and 1 <= question["difficulty"] <= 5
    pack[question["game"]].append(row)
    schedule.append({
        "id": question["id"],
        "game": question["game"],
        "source": sources[question["source_refs"][0]]["url"],
        "verified": source_input["checked"],
        "data_year": 2026,
        "time_dependent": True,
        "review_interval_days": 90,
        "next_review": str(checked + datetime.timedelta(days=90)),
        "review_status": "draft-review-required",
    })

assert [len(pack[game]) for game in games] == [2, 4, 6, 8]
assert len(seen_observations) == 22 and len({question["id"] for question in source_input["questions"]}) == 20
for level in ["easy", "medium", "hard"]:
    answers = [question["a"] for question in pack["facts"] if question["difficulty"] == level]
    assert sorted(answers) == [False, True]

variants = {
    "card": "visuals/workplace-neutral-card.svg",
    "detail": "visuals/workplace-neutral-detail.svg",
    "license": "CC0-1.0",
    "creator": "Original code-authored vector",
    "answer_neutral": True,
    "safe_margin_px": 40,
    "description": "Abstrakter Arbeitsplatz mit Laptop, Dokument, Helm und Pflanze; ohne Zahlen, Paragraphen, Gesetzesnamen oder Lösungshinweise. Jeopardy-Zeilen haben keinen Bildschlüssel.",
}
pack["images"]["workplace-neutral"] = variants
for question in pack["moreless"]:
    for label in [question["l"], question["r"]]:
        pack["images"][label] = variants

for kind, width in [("card", 720), ("detail", 960)]:
    offset = (width - 720) // 2
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="540" viewBox="0 0 {width} 540" role="img" aria-label="Abstraktes Motiv zur Arbeitswelt">
<defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#071d37"/><stop offset="1" stop-color="#241044"/></linearGradient><radialGradient id="glow"><stop stop-color="#62e6ff" stop-opacity=".28"/><stop offset="1" stop-color="#62e6ff" stop-opacity="0"/></radialGradient></defs>
<rect width="{width}" height="540" fill="url(#bg)"/><rect x="40" y="40" width="{width-80}" height="460" rx="30" fill="none" stroke="#75ddf4" stroke-opacity=".35" stroke-width="2"/>
<g transform="translate({offset},0)"><circle cx="360" cy="245" r="205" fill="url(#glow)"/><rect x="130" y="358" width="460" height="20" rx="10" fill="#4ecde6" opacity=".8"/><path d="M165 378v80M555 378v80" stroke="#90eaff" stroke-width="12" stroke-linecap="round"/>
<rect x="235" y="165" width="250" height="160" rx="18" fill="#132f57" stroke="#8feafa" stroke-width="6"/><path d="M205 338h310l-28 25H233z" fill="#7056d9" stroke="#c8bcff" stroke-width="5"/><circle cx="360" cy="245" r="25" fill="#ff4f9a" opacity=".9"/>
<path d="M490 188h78v110h-78z" fill="#f6fbff" opacity=".95"/><path d="M505 215h46M505 238h46M505 261h32" stroke="#557391" stroke-width="7" stroke-linecap="round"/>
<path d="M150 340q12-85 68-85t68 85" fill="#ffb33b" stroke="#ffd68a" stroke-width="6"/><path d="M142 340h152" stroke="#ffe1a8" stroke-width="12" stroke-linecap="round"/>
<path d="M565 340v-55M565 310q-42-10-43-48 43 4 43 35M565 292q39-9 42-44-39 2-42 31" fill="none" stroke="#69e8aa" stroke-width="10" stroke-linecap="round"/>
<text x="360" y="486" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="700" letter-spacing="2" fill="#c4f4ff">ARBEITSWELT</text></g></svg>\n'''
    ET.fromstring(svg)
    write(f"visuals/workplace-neutral-{kind}.svg", svg)

dump("draft-pack.json", pack)
dump("draft-review-schedule.json", {
    "policy": "Gesetzesstand explizit; 90-Tage-Prüfung auf Änderungen. Keine automatische Freigabe und keine Rechtsberatung.",
    "records": schedule,
})
baseline = json.loads((ROOT / "content/review-schedule.json").read_text())["records"]
due = [record for record in baseline if record["next_review"] <= source_input["checked"]]
dump("validation.json", {
    "checked": source_input["checked"],
    "questions": 20,
    "counts": {game: len(pack[game]) for game in games},
    "numeric_observations_checked": 8,
    "unique_observation_keys": len(seen_observations),
    "balanced_fact_levels": True,
    "svg_variants": 2,
    "main_review_records": len(baseline),
    "due_records": due,
    "review_only": True,
    "database_writes": 0,
})
print(("Checked" if CHECK else "Built") + " 20 questions and two SVG formats")
