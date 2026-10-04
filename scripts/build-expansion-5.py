"""Edition-separated FC27 stats and dated, sourced football/space questions."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATE = '2026-10-04'
EA = 'https://www.ea.com/games/ea-sports-fc/ratings/stats-ratings/best-shooters'
NASA = 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/'
NOTES = NASA + 'planetfact_notes.html'
STATS = {
    'Kylian Mbappé': [91, 96, 91, 80, 92, 29, 76],
    'Erling Haaland': [91, 87, 92, 71, 80, 47, 89],
    'Jude Bellingham': [90, 79, 86, 83, 88, 79, 85],
    'Mohamed Salah': [87, 84, 83, 83, 86, 45, 72],
}
LABELS = ['Gesamtwertung', 'Tempo', 'Schuss', 'Passen', 'Dribbling', 'Defensive', 'Physis']
PLANETS = [('Merkur', .330, 3.7), ('Venus', 4.87, 8.9), ('Erde', 5.97, 9.8), ('Mars', .642, 3.7), ('Jupiter', 1898, 23.1), ('Saturn', 568, 9.0), ('Uranus', 86.8, 8.7), ('Neptun', 102, 11.0)]
TRANSFERS = [
    ('Florian Wirtz', 'Bayer Leverkusen', 'Liverpool', 'https://www.liverpoolfc.com/news/liverpool-agree-signing-florian-wirtz-bayer-leverkusen'),
    ('Trent Alexander-Arnold', 'Liverpool', 'Real Madrid', 'https://www.realmadrid.com/es-ES/noticias/club/comunicados/comunicado-oficial-30-05-2025'),
    ('Luis Díaz', 'Liverpool', 'Bayern München', 'https://fcbayern.com/en/news/2025/07/fc-bayern-sign-luis-diaz-from-liverpool'),
    ('Viktor Gyökeres', 'Sporting CP', 'Arsenal', 'https://www.arsenal.com/news/arsenal-transfers-all-the-ins-and-outs-in-202526-auD0y5o806jW'),
]

def main():
    path = ROOT / 'content/catalogue.json'
    catalogue = json.loads(path.read_text())
    additions = []
    for name, values in STATS.items():
        record = next(r for r in catalogue if r['name'] == name)
        for label, value in zip(LABELS, values):
            metric = f'{label} · EA SPORTS FC 27'
            wording = label if label == 'Gesamtwertung' else label + '-Wertung'
            fact = dict(category='Fußballer', metric=metric, value=value, unit='Wertungspunkte', comparison_unit=f'{label}-Wertung · EA SPORTS FC 27 · Basiskarte', source=EA, verified=DATE, estimate_question=f'Welche {wording} hat {name} auf der Basiskarte in EA SPORTS FC 27?', notes='FC 27 Basis-Item zur Veröffentlichung; keine Spezialkarte, kein Live-Form-Update. Quellenstand 4. Oktober 2026. FC 26 bleibt eine eigene Ausgabe.')
            record['facts'] = [f for f in record['facts'] if f['metric'] != metric] + [fact]
            additions.append(dict(subject=name, **fact))
    for name, mass, gravity in PLANETS:
        record = next(r for r in catalogue if r['name'] == name)
        for metric, value, unit, question, note in [
            ('Planetenmasse', mass, '10²⁴ kg', f'Welche Masse hat {name} laut NASA ungefähr, in Einheiten von 10 hoch 24 Kilogramm?', 'Eine Einheit entspricht einer Quadrillion Kilogramm; Masse, nicht Gewichtskraft.'),
            ('Fallbeschleunigung am Äquator', gravity, 'm/s²', f'Welche Fallbeschleunigung nennt die NASA für {name} am Äquator ungefähr, in Metern pro Sekunde zum Quadrat?', 'Einschließlich Rotation; Gasplaneten am 1-bar-Niveau, keine feste Oberfläche.'),
        ]:
            fact = dict(category='Weltraum', metric=metric, value=value, unit=unit, comparison_unit=f'{unit} · {metric}', source=NASA, verified=DATE, estimate_question=question, notes=note)
            if not any(f['metric'] == metric for f in record['facts']): record['facts'].append(fact)
            additions.append(dict(subject=name, **fact))
    path.write_text(json.dumps(catalogue, ensure_ascii=False, indent=2) + '\n')
    facts, clues = [], []
    def statement(s, a, e, cat, source, difficulty, subject=None):
        row = dict(s=s, a=a, e=e, cat=cat, source=source, verified=DATE, difficulty=difficulty, expansion=5)
        if subject: row['subject'] = subject
        facts.append(row)
    def clue(q, a, cat, source, difficulty, subject=None):
        row = dict(q=q, a=a, cat=cat, source=source, verified=DATE, difficulty=difficulty, expansion=5)
        if subject: row['subject'] = subject
        clues.append(row)
    # Six true and six false transfers, explicitly historical rather than current club claims.
    for i, (name, origin, destination, source) in enumerate(TRANSFERS):
        level = ['easy', 'easy', 'medium', 'medium'][i]
        explanation = f'{name} wechselte im Sommer 2025 von {origin} zu {destination}.'
        statement(f'{name} wechselte im Sommer 2025 von {origin} zu {destination}.', True, explanation, 'Fußballer', source, level)
        wrong = ['Bayern München', 'Barcelona', 'Real Madrid', 'Chelsea'][i]
        statement(f'{name} wechselte im Sommer 2025 zu {wrong}.', False, explanation, 'Fußballer', source, level)
        clue(f'Zu welchem Verein wechselte {name} im Sommer 2025 von {origin}?', destination, 'Transfers 2025', source, i + 1)
    for name, origin, destination, source in TRANSFERS[:2]:
        statement(f'Der Sommertransfer 2025 von {name} zu {destination} führte aus der Bundesliga in die Premier League.', name == 'Florian Wirtz', f'{origin} → {destination}: ' + ('Bundesliga → Premier League.' if name == 'Florian Wirtz' else 'Premier League → LaLiga.'), 'Fußballer', source, 'hard')
    for name, origin, destination, source in TRANSFERS[2:]:
        statement(f'{name} wechselte im Sommer 2025 direkt aus der Premier League zu {destination}.', name == 'Luis Díaz', f'Der direkte Vorgängerverein war {origin}.', 'Fußballer', source, 'hard')
    clue('Welcher Spieler wechselte im Sommer 2025 von Sporting CP zu Arsenal?', 'Viktor Gyökeres|Viktor Gyokeres|Gyökeres|Gyokeres', 'Transfers 2025', TRANSFERS[3][3], 5)
    latest = [
        ('Mohamed Salah', 'Trabzonspor', 'Galatasaray', 'https://www.liverpoolfc.com/news/mohamed-salah-signs-trabzonspor', 'easy'),
        ('Marc Cucurella', 'Real Madrid', 'Barcelona', 'https://www.realmadrid.com/es-ES/noticias/club/comunicados/comunicado-oficial-cucurella-15-06-2026', 'medium'),
        ('Iliman Ndiaye', 'Manchester City', 'Manchester United', 'https://www.mancity.com/news/mens/iliman-ndiaye-it-was-always-city-for-men-63923888', 'hard'),
    ]
    for i, (name, destination, wrong, source, level) in enumerate(latest):
        explanation = f'{name} wechselte im Sommer 2026 zu {destination}.'
        statement(explanation, True, explanation, 'Fußballer', source, level)
        statement(f'{name} wechselte im Sommer 2026 zu {wrong}.', False, explanation, 'Fußballer', source, level)
        clue(f'Zu welchem Verein wechselte {name} im Sommer 2026?', destination, 'Transfers 2026', source, i + 1)
    clue('Wie viele Spielzeiten umfasst laut Real Madrids Mitteilung vom 18. Juni 2026 der neue Vertrag von Ibrahima Konaté?', '4|vier', 'Transfers 2026', 'https://www.realmadrid.com/es-ES/noticias/club/comunicados/comunicado-oficial-konate-18-06-2026', 4)
    clue('Bis zu welchem Jahr läuft laut Mitteilung vom 17. Juni 2026 Bernardo Silvas neuer Vertrag bei Real Madrid?', '2028', 'Transfers 2026', 'https://www.realmadrid.com/es-ES/noticias/club/comunicados/comunicado-oficial-bernardo-silva-17-06-2026', 5)
    fc_claims = [
        ('Kylian Mbappé hat in FC 27 auf seiner Basiskarte Tempo 96.', True, 'Mbappés FC-27-Basiskarte hat Tempo 96.', 'easy', 'Kylian Mbappé'),
        ('Mohamed Salah hat in FC 27 auf seiner Basiskarte Tempo 96.', False, 'Salahs Tempo beträgt 84; Tempo 96 gehört zu Mbappé.', 'easy', 'Mohamed Salah'),
        ('Haalands FC-27-Basiskarte hat eine höhere Schusswertung als Mbappés.', True, 'Haaland: 92; Mbappé: 91.', 'medium', 'Erling Haaland'),
        ('Bellingham hat in FC 27 auf seiner Basiskarte Gesamtwertung 91.', False, 'Bellinghams Gesamtwertung beträgt 90.', 'medium', 'Jude Bellingham'),
        ('Salah und Bellingham haben auf ihren FC-27-Basiskarten beide Passen 83.', True, 'Beide Basiskarten haben Passen 83.', 'hard', None),
        ('Mbappés Defensive ist auf seiner FC-27-Basiskarte höher als Salahs.', False, 'Mbappé: 29; Salah: 45.', 'hard', None),
    ]
    for s, a, e, level, subject in fc_claims: statement(s, a, e, 'Fußballer', EA, level, subject)
    space = [
        ('Jupiter hat laut NASA mehr Masse als Saturn.', True, 'Jupiter: 1898; Saturn: 568, jeweils in 10²⁴ kg.', 'easy', None),
        ('Mars hat laut NASA mehr Masse als die Erde.', False, 'Mars: 0,642; Erde: 5,97, jeweils in 10²⁴ kg.', 'easy', None),
        ('Venus hat laut NASA mehr Masse als Merkur.', True, 'Venus: 4,87; Merkur: 0,330, jeweils in 10²⁴ kg.', 'easy', None),
        ('Uranus hat laut NASA mehr Masse als Neptun.', False, 'Uranus: 86,8; Neptun: 102, jeweils in 10²⁴ kg.', 'easy', None),
        ('Die NASA nennt für Erde am Äquator etwa 9,8 m/s² Fallbeschleunigung.', True, 'Der Tabellenwert beträgt 9,8 m/s² und berücksichtigt Rotation.', 'medium', 'Erde'),
        ('Die NASA nennt für Venus am Äquator etwa 3,7 m/s² Fallbeschleunigung.', False, 'Venus: 8,9 m/s²; 3,7 m/s² gilt für Merkur und Mars.', 'medium', 'Venus'),
        ('Merkur und Mars haben in der NASA-Tabelle dieselbe gerundete Fallbeschleunigung am Äquator.', True, 'Beide Tabellenwerte betragen 3,7 m/s².', 'medium', None),
        ('Saturns Fallbeschleunigung am Äquator beträgt laut NASA etwa 23,1 m/s².', False, 'Saturn: 9,0 m/s²; Jupiter: 23,1 m/s², bei Gasplaneten am 1-bar-Niveau.', 'medium', 'Saturn'),
        ('Die Fallbeschleunigung der Gasplaneten wird in der NASA-Vergleichstabelle am 1-bar-Niveau angegeben.', True, 'Das 1-bar-Niveau ist eine Druckhöhe in der Atmosphäre, keine feste Oberfläche.', 'hard', None),
        ('Die Fallbeschleunigung in der NASA-Vergleichstabelle lässt die Planetenrotation unberücksichtigt.', False, 'Die Definition berücksichtigt den Einfluss der Rotation am Äquator.', 'hard', None),
        ('Ein negativer Rotationsperiodenwert in der NASA-Tabelle kennzeichnet rückläufige Rotation.', True, 'Das Vorzeichen beschreibt die Richtung; die Dauer wird dadurch nicht negativ.', 'hard', None),
        ('Die Rotationsperiode in der NASA-Tabelle misst die Zeit von einem Sonnenmittag zum nächsten.', False, 'Rotation wird relativ zu den Hintergrundsternen gemessen. Sonnenmittag zu Sonnenmittag heißt Length of Day.', 'hard', None),
    ]
    for s, a, e, level, subject in space: statement(s, a, e, 'Weltraum', NOTES if level == 'hard' else NASA, level, subject)
    for i, name in enumerate(['Kylian Mbappé', 'Erling Haaland', 'Jude Bellingham', 'Mohamed Salah', 'Kylian Mbappé']):
        label = LABELS[[1, 2, 0, 3, 5][i]]
        value = STATS[name][LABELS.index(label)]
        wording = label if label == 'Gesamtwertung' else label + '-Wertung'
        clue(f'Welche {wording} hat {name} auf seiner FC-27-Basiskarte?', str(value), 'Fußball', EA, i + 1, name)
    for i, (name, mass, gravity) in enumerate(PLANETS[:5]):
        clue(f'Welche Fallbeschleunigung nennt die NASA für {name} am Äquator ungefähr, in m/s²?', f'{gravity:g}|{str(gravity).replace(".", ",")}', 'Planetenkunde', NASA, i + 1, name)
    # Historical professional appearances; fixed cutoffs avoid future ambiguity.
    careers = [
        ('Mohamed Salah', 'vor seinem Liverpool-Wechsel 2017', ['FC Basel', 'Chelsea', 'Fiorentina'], ['Arsenal', 'Inter Mailand', 'Atlético Madrid'], 'Basel, Chelsea, Fiorentina und AS Roma', 'https://www.liverpoolfc.com/news/first-team/266612-in-profile-salah-s-journey-from-egypt-to-anfield', 'easy'),
        ('Luis Suárez (geb. 1987)', 'vor seinem Barcelona-Wechsel 2014', ['Ajax', 'FC Groningen', 'Liverpool'], ['PSV Eindhoven', 'Manchester United', 'Bayern München'], 'Nacional, Groningen, Ajax und Liverpool', 'https://www.fcbarcelona.com/en/card/1841260/luis-suarez', 'medium'),
        ('Robert Lewandowski', 'zwischen 2008 und seinem Bayern-Wechsel 2014', ['Lech Poznań', 'Borussia Dortmund', 'Borussia Dortmunds erster Mannschaft'], ['Bayern München', 'Schalke 04', 'Manchester United'], 'Lech Poznań (2008–2010) und Borussia Dortmund (2010–2014)', 'https://www.uefa.com/uefachampionsleague/news/0211-0e884871b5cb-aaa5fa05e85d-1000--lewandowski-to-join-bayern-in-the-summer/', 'hard'),
    ]
    for name, period, true_clubs, false_clubs, explanation, source, level in careers:
        # Every statement refers to first-team competitive football, including loans.
        for i, club in enumerate(true_clubs):
            s = f'{name} spielte {period} bereits in Pflichtspielen für {club}.'
            if name == 'Robert Lewandowski' and i == 2:
                s = 'Robert Lewandowski spielte vor seinem Bayern-Wechsel 2014 bereits in der Champions League für Borussia Dortmund.'
            statement(s, True, f'Profistationen im genannten Zeitraum: {explanation}.', 'Fußballer', source, level)
        for club in false_clubs:
            statement(f'{name} spielte {period} bereits in Pflichtspielen für {club}.', False, f'Profistationen im genannten Zeitraum: {explanation}; {club} gehört nicht dazu. Jugend und Probetraining zählen nicht.', 'Fußballer', source, level)
    career_clues = [
        ('Für welchen Londoner Verein bestritt Salah vor seinem Liverpool-Wechsel 2017 Pflichtspiele?', 'Chelsea', careers[0][5], 1),
        ('Von welchem Verein wechselte Salah 2017 zu Liverpool?', 'AS Roma|Roma', careers[0][5], 2),
        ('Für welchen Schweizer Verein spielte Salah vor seinem Chelsea-Wechsel?', 'FC Basel|Basel', careers[0][5], 3),
        ('Für welchen italienischen Verein spielte Salah 2015 auf Leihbasis, bevor er zu Roma ging?', 'Fiorentina|ACF Fiorentina', careers[0][5], 4),
        ('Welcher niederländische Verein war Luis Suárez’ erste Profistation in Europa?', 'FC Groningen|Groningen', careers[1][5], 5),
        ('Von welchem englischen Verein wechselte Luis Suárez 2014 zu Barcelona?', 'Liverpool', careers[1][5], 1),
        ('Für welchen Amsterdamer Verein spielte Luis Suárez vor Liverpool?', 'Ajax|Ajax Amsterdam|AFC Ajax', careers[1][5], 2),
        ('Für welchen deutschen Verein spielte Lewandowski unmittelbar vor seinem Bayern-Wechsel 2014?', 'Borussia Dortmund|Dortmund|BVB', careers[2][5], 3),
        ('Von welchem polnischen Verein wechselte Lewandowski 2010 zu Dortmund?', 'Lech Poznań|Lech Poznan|Lech Posen', careers[2][5], 4),
        ('In welchem Jahr wechselte Lewandowski von Dortmund zu Bayern?', '2014', careers[2][5], 5),
    ]
    for q, a, source, difficulty in career_clues: clue(q, a, 'Vereinsstationen', source, difficulty)
    # Bring previously unused reviewed numeric data into Jeopardy, without simply
    # rephrasing the same subject/measure already present in its curated bank.
    already = {
        'Ordnungszahl': {'Wasserstoff', 'Helium', 'Stickstoff', 'Neon', 'Natrium', 'Magnesium', 'Aluminium', 'Silizium', 'Schwefel', 'Chlor', 'Calcium', 'Kupfer'},
        'Geburtsjahr': set(STATS),
        'Zylinderzahl des Verbrennungsmotors': {'Porsche 911 GT3 (PDK, 2025)', 'Ferrari 296 GTB', 'Ferrari SF90 Stradale', 'Ferrari 12Cilindri'},
        'Motorleistung': {'Ferrari 296 GTB', 'Ferrari SF90 Stradale'},
        'Gründungsjahr als Nationalpark': {'Yellowstone-Nationalpark', 'Yosemite-Nationalpark', 'Grand-Canyon-Nationalpark', 'Zion-Nationalpark', 'Rocky-Mountain-Nationalpark', 'Olympic-Nationalpark'},
        'Startjahr der Mission': {'Sputnik 1', 'Hubble-Weltraumteleskop', 'James-Webb-Weltraumteleskop', 'Voyager 1', 'Cassini-Huygens', 'New Horizons'},
        'Erstes UNESCO-Welterbe-Einschreibungsjahr': {'Aachener Dom', 'Taj Mahal', 'Opernhaus von Sydney', 'Kölner Dom'},
        'Umlaufdauer um die Sonne': {p[0] for p in PLANETS},
        'Mittlere Oberflächentemperatur': {'Venus', 'Mars'},
        'Fallbeschleunigung am Äquator': {p[0] for p in PLANETS[:5]},
        'Reguläre Spielerzahl je Team auf dem Feld': {'Basketball', 'Hallenvolleyball', 'Hallenhandball', 'Rugby Union', 'Feldhockey'},
        'Tempo · EA SPORTS FC 27': {'Kylian Mbappé'},
        'Schuss · EA SPORTS FC 27': {'Erling Haaland'},
        'Gesamtwertung · EA SPORTS FC 27': {'Jude Bellingham'},
        'Passen · EA SPORTS FC 27': {'Mohamed Salah'},
        'Defensive · EA SPORTS FC 27': {'Kylian Mbappé'},
    }
    category_map = {'Fußballer': 'Fußball', 'Weltraum': 'Planetenphysik', 'Wissenschaft': 'Chemie', 'Natur': 'Nationalparks', 'Raumfahrt': 'Raumfahrtmissionen', 'Weltkultur': 'Kultur', 'Autos': 'Autotechnik', 'Rekorde & Extreme': 'Leichtathletik-Rekorde', 'Länder': 'Geografie', 'Städte': 'Allgemeinwissen', 'Allgemeinwissen': 'Allgemeinwissen', 'Tierwelt': 'Allgemeinwissen', 'Bauwerke': 'Geschichte'}
    counts = {}
    for record in catalogue:
        for f in record['facts']:
            if f.get('expansion') == 6 or not f.get('estimate_question') or record['name'] in already.get(f['metric'], set()): continue
            cat = 'FC 27-Werte' if 'EA SPORTS FC 27' in f['metric'] else category_map.get(f['category'], 'Allgemeinwissen')
            # Groups with fewer than five questions are merged into existing categories.
            if cat == 'Leichtathletik-Rekorde': cat = 'Sportregeln'
            q = f['estimate_question']
            if any(q == old['q'] for old in clues): continue
            i = counts.get(cat, 0); counts[cat] = i + 1
            value = f['value']; answer = str(value)
            if isinstance(value, float): answer += '|' + str(value).replace('.', ',')
            clue(q, answer, cat, f['source'], i % 5 + 1, record['name'])
            clues[-1]['verified'] = f['verified']
            clues[-1]['content_key'] = record['id'] + '|' + f['metric']
    path = ROOT / 'content/trivia.json'; trivia = json.loads(path.read_text())
    for kind in ('facts', 'jeopardy'): trivia[kind] = [q for q in trivia[kind] if q.get('expansion') != 5]
    original_facts = {q['s'] for q in trivia['facts']}; original_clues = {q['q'] for q in trivia['jeopardy']}
    facts = [q for q in facts if q['s'] not in original_facts]; clues = [q for q in clues if q['q'] not in original_clues]
    for kind, items, prompt in [('facts', facts, 's'), ('jeopardy', clues, 'q')]:
        seen = {q[prompt] for q in trivia[kind]}
        trivia[kind].extend(q for q in items if q[prompt] not in seen)
    path.write_text(json.dumps(trivia, ensure_ascii=False, indent=2) + '\n')
    research = ROOT / 'content/research/2026-10-04'; research.mkdir(exist_ok=True)
    (research / 'expansion-5.json').write_text(json.dumps(dict(numeric=additions, facts=facts, jeopardy=clues), ensure_ascii=False, indent=2) + '\n')
    print(f'{len(additions)} numeric facts, {len(facts)} balanced Fact/Fake statements, {len(clues)} Jeopardy clues')

if __name__ == '__main__': main()
