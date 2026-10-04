"""Canonical categories, historical transfers, edition-specific ratings and familiar games."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATE = '2026-10-04'
path = ROOT / 'content/trivia.json'
trivia = json.loads(path.read_text())
aliases = {'Transfers 2025': 'Transfers', 'Transfers 2026': 'Transfers', 'FC 27-Werte': 'FIFA-Ratings'}
trivia['jeopardy'] = [q for q in trivia['jeopardy'] if q.get('expansion') != 7]
for q in trivia['jeopardy']:
    q['cat'] = aliases.get(q['cat'], q['cat'])
clues = []
def clue(cat, question, answer, source, difficulty=2):
    clues.append(dict(cat=cat, q=question, a=str(answer), source=source,
                      verified=DATE, difficulty=difficulty, expansion=7))

R = 'https://www.realmadrid.com/en-US/the-club/history/football-legends/'
BARCA = 'https://www.fcbarcelona.com/en/'
moves = [
    ('Zinédine Zidane',1996,'Girondins Bordeaux|Bordeaux','Juventus Turin',R+'zinedine-zidane'),
    ('Zinédine Zidane',2001,'Juventus Turin|Juventus','Real Madrid',R+'zinedine-zidane'),
    ('Ronaldinho',2003,'Paris Saint-Germain|PSG','FC Barcelona',BARCA+'football/barca-legends/players/1493844/ronaldinho'),
    ('Ronaldinho',2008,'FC Barcelona|Barcelona','AC Mailand',BARCA+'football/barca-legends/players/1493844/ronaldinho'),
    ('Ronaldo Nazário',2002,'Inter Mailand|Inter|Internazionale','Real Madrid',R+'ronaldo-luis-nazario-de-lima'),
    ('Thierry Henry',2007,'FC Arsenal|Arsenal','FC Barcelona',BARCA+'news/755613/ten-years-since-the-arrival-of-thierry-henry-at-fc-barcelona'),
    ('Franck Ribéry',2007,'Olympique Marseille|Marseille','FC Bayern München','https://fcbayern.com/en/photos/2017/07/gallery-riberys-10-years-at-bayern'),
    ('Arjen Robben',2009,'Real Madrid','FC Bayern München','https://fcbayern.com/en/club/history/mile-stones/2010-to-2013-the-historic-treble'),
    ('Luka Modrić',2012,'Tottenham Hotspur|Tottenham','Real Madrid','https://www.realmadrid.com/en-US/football/squad/luka-modric'),
    ('Robert Lewandowski',2014,'Borussia Dortmund|Dortmund|BVB','FC Bayern München','https://fcbayern.com/en/teams/first-team/former-players/robert-lewandowski'),
    ('Luis Suárez',2014,'FC Liverpool|Liverpool','FC Barcelona','https://players.fcbarcelona.com/en/player/855-suarez-luis-alberto-suarez-diaz'),
    ('Neymar',2013,'FC Santos|Santos','FC Barcelona',BARCA+'club/history/legendary-players'),
    ('Mohamed Salah',2017,'AS Rom|Roma|AS Roma','FC Liverpool','https://www.asroma.com/en/news/41866/roma-and-liverpool-agree-salah-transfer'),
]
for i, (name, year, origin, destination, source) in enumerate(moves):
    clue('Transfers', f'Von welchem Verein wechselte {name} {year} zu {destination}?', origin, source, 1+i%4)
    clue('Transfers', f'In welchem Jahr wechselte {name} von {origin.split("|")[0]} zu {destination}?', year, source, 2+i%4)

ratings = [
    ('FIFA 19', 'im archivierten FIFA-19-Datensatz', [('Cristiano Ronaldo',94),('Lionel Messi',94),('Neymar',92)], 'https://fifaindex.com/players/fifa19'),
    ('FIFA 20', 'in der veröffentlichten Basisbewertung', [('Lionel Messi',94),('Jan Oblak',91),('Luka Modrić',90),('Toni Kroos',88)], 'https://www.ea.com/able/news/fifa-20-player-ratings-la-liga-santander'),
    ('FIFA 21', 'in der veröffentlichten Basisbewertung', [('Cristiano Ronaldo',92),('Neymar',91),('Kylian Mbappé',90),('Jadon Sancho',87)], 'https://www.ea.com/es-es/news/fifa-21-player-ratings-five-star-skillers-skill-moves'),
    ('FIFA 22', 'in der veröffentlichten Basisbewertung', [('Robert Lewandowski',92),('Manuel Neuer',90),('Joshua Kimmich',89),('Erling Haaland',88)], 'https://www.ea.com/ea-originals/news/fifa-22-player-ratings-bundesliga'),
    ('FIFA 23', 'in der veröffentlichten Basisbewertung', [('Karim Benzema',91),('Thibaut Courtois',91),('Toni Kroos',88),('Vinícius Júnior',86)], 'https://www.ea.com/able/news/fifa-23-player-ratings-la-liga-santander'),
    ('EA Sports FC 24', 'in der veröffentlichten Basisbewertung', [('Erling Haaland',91),('Alexia Putellas',91),('Lionel Messi',90),('Aitana Bonmatí',90)], 'https://ea-sports.prezly.com/ea-sports-fc-24-donne-le-coup-denvoi-de-la-semaine-des-notes-avec-les-24-joueuses-et-joueurs-les-mieux-notees'),
    ('EA Sports FC 25', 'in der veröffentlichten Basisbewertung', [('Rodri',91),('Erling Haaland',91)], 'https://www.mancity.com/news/club/ea-sports-fc-25-ratings-revealed-63861581'),
]
for edition, scope, players, source in ratings:
    for i,(player, value) in enumerate(players):
        clue('FIFA-Ratings', f'{edition}: Welche Gesamtwertung hatte {player} {scope} (keine Spezialkarte)?', value, source, 1+i)

# Reuse the already reviewed FC-26 snapshots rather than silently reading a later live edition.
catalogue = json.loads((ROOT/'content/catalogue.json').read_text())
for i,name in enumerate(['Kylian Mbappé','Mohamed Salah','Erling Haaland','Jude Bellingham']):
    row = next(r for r in catalogue if r['name']==name)
    fact = next(f for f in row['facts'] if 'FC 26' in f.get('comparison_unit','') and 'gesamt' in f['metric'].lower())
    clue('FIFA-Ratings', f'EA Sports FC 26: Welche Basis-Gesamtwertung hat {name} im geprüften FC-26-Datensatz (keine Spezialkarte)?', fact['value'], fact['source'], i+2)
    clues[-1]['verified'] = fact['verified']

MARIO = 'https://www.nintendo.com/en-ca/explore/characters/mario/friends/'
ZELDA = 'https://play.nintendo.com/activities/skill-quizzes/master-sword-online-trivia-quiz/'
COD = 'https://www.callofduty.com/au/en/blog/2022/05/call-of-duty-modern-warfare-ii-ghost-price-task-force-141'
SONIC = 'https://manuals.sega.com/origins/de/index.html'
games = [
    ('Wie heißt Marios Bruder mit der grünen Mütze?','Luigi',MARIO,1),
    ('Welcher Koopa-König ist Marios bekanntester Gegenspieler?','Bowser',MARIO,1),
    ('Wie heißt die Prinzessin des Pilz-Königreichs, die Mario häufig rettet?','Peach|Prinzessin Peach',MARIO,1),
    ('Welcher grüne Begleiter aus den Mario-Spielen verschluckt Gegner mit seiner langen Zunge?','Yoshi',MARIO,1),
    ('Welchen Beruf hat Mario laut seiner offiziellen Charakterbeschreibung?','Klempner|Installateur',MARIO,2),
    ('Welcher Mario-Charakter trägt üblicherweise eine gelbe Mütze und eine violette Latzhose?','Wario',MARIO,2),
    ('Wie heißt Luigis großer, schlanker Rivale und Warios Partner?','Waluigi',MARIO,3),
    ('Welche Figur aus Super Mario Galaxy kümmert sich um die sternförmigen Lumas?','Rosalina',MARIO,4),
    ('Wie heißt der spielbare Held der Hauptreihe The Legend of Zelda?','Link',ZELDA,1),
    ('Wie heißt das Königreich, das Link und Prinzessin Zelda häufig beschützen?','Hyrule',ZELDA,2),
    ('Wie heißt Links legendäres Schwert, das auf Englisch Master Sword heißt?','Master-Schwert|Master Sword|Masterschwert',ZELDA,2),
    ('Wie heißt der wiederkehrende Zelda-Gegenspieler, gegen den Link mit dem Master-Schwert kämpft?','Ganon|Ganondorf',ZELDA,2),
    ('Welches grüne Minecraft-Monster explodiert typischerweise, wenn man ihm zu nahe kommt?','Creeper', 'https://www.minecraft.net/tr-tr/article/meet-creeper',1),
    ('Wie heißt der große Drachen-Boss von Minecraft?','Enderdrache|Ender Dragon','https://www.minecraft.net/en-us/article/ender-dragon',2),
    ('In welcher Minecraft-Dimension kämpft man gegen den Enderdrachen?','Das Ende|Ende|The End|End','https://www.minecraft.net/en-us/article/ender-dragon',3),
    ('Welcher Captain führt in Call of Duty: Modern Warfare II (2022) die Task Force 141 an?','John Price|Captain Price|Price',COD,2),
    ('Wie lautet der Nachname von John „Soap“ in Call of Duty: Modern Warfare II (2022)?','MacTavish|Mactavish',COD,4),
    ('Wie heißt „Ghost“ aus Call of Duty: Modern Warfare II (2022) mit bürgerlichem Namen?','Simon Riley|Riley',COD,5),
    ('Welche Nummer trägt die Task Force von Price, Soap und Ghost in Modern Warfare II (2022)?','141|Task Force 141',COD,3),
    ('Welcher Operator in Rainbow Six Siege benutzt den Vorschlaghammer „The Caber“?','Sledge','https://www.ubisoft.com/en-ca/game/rainbow-six/siege/game-info/operators/sledge',3),
    ('Welche FBI-Operatorin in Rainbow Six Siege ist für ihr Durchbruchgeschoss bekannt?','Ash','https://www.ubisoft.com/en-us/game/rainbow-six/siege/news-updates/2mEQC66wHsLYFhdNRwCsK7/operator-spotlight-6-ash-fbi-swat-unit',4),
    ('Welchen Pokémon-Typ hat Pikachu?','Elektro|Electric','https://www.pokemon.com/us/pokedex/pikachu',1),
    ('Welche Nummer hat Pikachu im Nationalen Pokédex?','25|025','https://www.pokemon.com/us/pokedex/pikachu',3),
    ('Welches Pokémon steht im ursprünglichen Pokédex an Nummer 1?','Bisasam|Bulbasaur','https://www.pokemon.com/pokedex/',2),
    ('Aus welcher Pokémon-Region stammen die ursprünglichen Starter Bisasam, Glumanda und Schiggy?','Kanto','https://www.pokemon.com/us/pokemon-news/order-the-pokemon-special-series-kanto-region-first-partner-figure-set-from-jazwares-vault',3),
    ('Wie viele verschiedene Hauptfiguren kann man in der Story von GTA V spielen?','3|drei','https://www.rockstargames.com/newswire/article/25o2411819aok8/original-gtav-artwork-michael-franklin-trevor.html',1),
    ('Wie heißt Segas blauer Igel, der vor allem für seine Geschwindigkeit bekannt ist?','Sonic|Sonic the Hedgehog',SONIC,1),
    ('Wie heißt Sonics Fuchsfreund mit den zwei Schwänzen?','Tails|Miles Prower|Miles Tails Prower',SONIC,2),
    ('Welche Sportart verbindet Rocket League mit Fahrzeugen und großen Toren?','Fußball|Fussball|Soccer','https://www.rocketleague.com/?lang=en',1),
    ('Was steuert man in Rocket League anstelle von menschlichen Fußballspielern?','Autos|Auto|Fahrzeuge|Fahrzeug|Raketenautos','https://www.rocketleague.com/?lang=en',1),
]
for q,a,source,d in games:
    clue('Videospiele',q,a,source,d)
seen = {q['q'].strip().casefold() for q in trivia['jeopardy']}
for q in clues:
    if q['q'].strip().casefold() in seen:
        raise ValueError('Duplicate question: '+q['q'])
    seen.add(q['q'].strip().casefold())
trivia['jeopardy'] += clues
path.write_text(json.dumps(trivia, ensure_ascii=False, indent=2)+'\n')
(ROOT/'content/research/2026-10-04/expansion-7.json').write_text(json.dumps(dict(category_aliases=aliases,jeopardy=clues),ensure_ascii=False,indent=2)+'\n')
print(f'Added {len(clues)} clues; {len(trivia["jeopardy"])} total')
