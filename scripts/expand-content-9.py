#!/usr/bin/env python3
"""Idempotent reviewed expansion: real football, videogames and identity clues."""
import json
import re
import unicodedata
from pathlib import Path
from content_categories import normalize_category

ROOT = Path(__file__).resolve().parents[1]
DATE = '2026-10-05'
catalogue = json.loads((ROOT/'content/catalogue.json').read_text())
trivia = json.loads((ROOT/'content/trivia.json').read_text())
for record in catalogue:
    record['facts'] = [normalize_category(f, 'category') for f in record['facts'] if f.get('expansion') != 9]
catalogue = [r for r in catalogue if not r.get('expansion') == 9]
for kind in ('estimate', 'facts', 'jeopardy'):
    trivia[kind] = [normalize_category(q) for q in trivia[kind] if q.get('expansion') != 9]

def subject(ident, name, cat):
    existing = next((r for r in catalogue if r['name'] == name), None)
    if existing: return existing
    image = 'sport-field.webp' if cat == 'Fußball' else 'expansion-8/gaming-card.webp'
    ident = re.sub(r'[^a-z0-9-]', '', unicodedata.normalize('NFKD', ident.lower()).encode('ascii','ignore').decode())
    record = dict(id=ident, name=name, image='../assets/visuals/'+image,
        variants={'card':image,'detail':image}, generated=True,
        image_source='https://github.com/MAB1301/more-less-online-test/tree/Main/assets/visuals',
        image_license='AI-generated thematic illustration; not a portrait or screenshot',
        status='approved', expansion=9, facts=[])
    catalogue.append(record)
    return record

def number(record, cat, sub, metric, unit, value, source, prompt, scope):
    record['facts'].append(dict(category=cat, subcategory=sub, metric=metric, unit=unit,
        value=value, source=source, verified=DATE, expansion=9,
        comparison_unit=unit+' · '+metric, estimate_question=prompt, notes=scope))

def clue(cat, hint, answer, source, difficulty=2, sub='Wer ist das?'):
    trivia['jeopardy'].append(dict(cat=cat, subcategory=sub, q='Wer ist das? '+hint,
        a=answer, source=source, verified=DATE, difficulty=difficulty, expansion=9,
        question_type='identity'))

hof='https://www.premierleague.com/en/events/hall-of-fame/inductees/'
players=[('alan-shearer','Alan Shearer',260,64,441,1),
    ('wayne-rooney','Wayne Rooney',208,103,491,5),
    ('thierry-henry','Thierry Henry',175,74,258,2),
    ('frank-lampard','Frank Lampard',177,102,609,3),
    ('paul-scholes','Paul Scholes',107,55,499,11)]
for ident,name,goals,assists,apps,titles in players:
    r=subject(ident,name,'Fußball')
    for label,value,unit in [('Tore',goals,'Tore'),('Assists',assists,'Assists'),('Einsätze',apps,'Einsätze'),('Meisterschaften',titles,'Titel')]:
        metric='Premier-League-'+label+' – abgeschlossene Karriere'
        number(r,'Fußball','Premier League: Karriere',metric,unit,value,hof+ident,
            f'Wie viele {label} hatte {name} insgesamt in der Premier League?',
            'Nur Premier League; abgeschlossene Spielerkarriere. Keine Pokale, Nationalmannschaft oder Videospielwerte.')
    clue('Fußballlegenden',f'Dieser Spieler kommt in der Premier League auf {goals} Tore und {assists} Assists.',name,hof+ident,3)

clubs=[('Thierry Henry',5,'https://www.uefa.com/news-media/news/021c-0e8ec1687d78-c169cffabb8f-1000--france-icon-henry-s-finest-hours/'),
    ('Wayne Rooney',4,'https://www.premierleague.com/en/news/1974550'),
    ('Steven Gerrard',2,'https://www.liverpoolfc.com/news/features/342686-lfc-legends-v-milan-glorie-what-happened-next-to-the-istanbul-contingent'),
    ('Paul Scholes',1,hof+'paul-scholes')]
for name,value,url in clubs:
    r=subject(name.lower().replace(' ','-'),name,'Fußball')
    number(r,'Fußball','Vereinsstationen','Verschiedene Profivereine – abgeschlossene Karriere','Vereine',value,url,
        f'Für wie viele verschiedene Profivereine bestritt {name} Pflichtspiele in der ersten Mannschaft?',
        'Verschiedene Vereine mit Pflichtspieleinsatz in erster Mannschaft; Jugend und Reserven ausgeschlossen; Rückkehr zählt nicht erneut.')

ucl='https://www.uefa.com/uefachampionsleague/news/0285-1906eba1bea4-31faa14228af-1000--champions-league-top-scorers-2023-24-rasmus-hojlund-lead/'
for metric,rows in [('Tore',[('Harry Kane',8),('Kylian Mbappé',8),('Antoine Griezmann',6),('Erling Haaland',6),('Vinícius Júnior',6),('Phil Foden',5)]),
    ('Assists',[('Jude Bellingham',5),('Marcel Sabitzer',5),('Vinícius Júnior',5),('Galeno',4),('İlkay Gündoğan',4),('Bukayo Saka',4)])]:
    for name,value in rows:
        r=subject('ucl-'+name.lower().replace(' ','-').replace('í','i').replace('é','e').replace('ü','u').replace('ğ','g').replace('İ','i'),name,'Fußball')
        number(r,'Fußball','Champions League 2023/24',f'Champions-League-{metric} 2023/24',metric,value,ucl,
            f'Wie viele {metric} erzielte {name} in der Champions-League-Saison 2023/24 laut UEFA?',
            'UEFA-Saisonstatistik 2023/24; kein Karrierewert; Qualifikation ausgeschlossen.')

for ident,name,dex,height,weight in [('bisasam','Bisasam',1,.7,6.9),('glumanda','Glumanda',4,.6,8.5),('schiggy','Schiggy',7,.5,9),('pikachu','Pikachu',25,.4,6),('evoli','Evoli',133,.3,6.5)]:
    r=subject(ident,name,'Videospiele'); url=f'https://in.portal-pokemon.com/pokedex/{dex:04d}/'
    for label,unit,value in [('Nationaldex-Nummer','Nummer',dex),('Pokédex-Größe','m',height),('Pokédex-Gewicht','kg',weight)]:
        number(r,'Videospiele','Pokémon',label,unit,value,url,
            f'Welche {label} nennt der offizielle Pokédex für {name}'+(' in '+unit if unit!='Nummer' else '')+'?',
            'Standardform im offiziellen Pokédex; keine Mega-, Regional- oder Gigadynamaxform.')

honours='https://www.uefa.com/news/0275-1541637ad1db-88aeeefefefd-1000--all-time-honours-board/'
for ident,name,titles in [('real-madrid','Real Madrid',15),('ac-milan','AC Milan',7),('fc-liverpool','Liverpool FC',6),('bayern','FC Bayern München',6),('fc-barcelona','FC Barcelona',5),('ajax','Ajax Amsterdam',4)]:
    r=subject(ident,name,'Fußball')
    number(r,'Fußball','Europapokal: Vereinstitel','Europapokal der Landesmeister / Champions-League-Titel – 05.10.2026','Titel',titles,honours,
        f'Wie viele Titel im Europapokal der Landesmeister beziehungsweise der Champions League gewann {name} bis zum 05.10.2026?',
        'Beide historischen Namen desselben Wettbewerbs; andere internationale Wettbewerbe, Supercups und nationale Titel ausgeschlossen.')

for ident,name,year,url in [('portal-2','Portal 2',2011,'https://store.steampowered.com/app/620/Portal_2/'),('stardew-valley','Stardew Valley',2016,'https://store.steampowered.com/app/413150/Stardew_Valley/'),('elden-ring','Elden Ring',2022,'https://www.bandainamcoent.com/news/elden-ring-now-available-adventure-arrives-for-the-brave'),('mk8','Mario Kart 8 Deluxe',2017,'https://www.nintendo.com/en-gb/News/2017/April/In-shops-and-on-Nintendo-eShop-now-Mario-Kart-8-Deluxe-1218775.html')]:
    r=subject(ident,name,'Videospiele')
    number(r,'Videospiele','Veröffentlichungen','Erstveröffentlichung des benannten Spiels','Jahr',year,url,
        f'In welchem Jahr erschien {name} erstmals?',
        'Erste reguläre Veröffentlichung des ausdrücklich benannten Spiels; kein Early Access, späterer Port oder Vorgängerspiel.')

sales='https://www.nintendo.co.jp/ir/en/finance/software/switch.html'
for ident,name,value in [('mk8','Mario Kart 8 Deluxe',71.53),('acnh','Animal Crossing: New Horizons',50.29),('ssbu','Super Smash Bros. Ultimate',38.14),('botw','The Legend of Zelda: Breath of the Wild',34.06),('odyssey','Super Mario Odyssey',30.8),('totk','The Legend of Zelda: Tears of the Kingdom',22.71)]:
    r=subject(ident,name,'Videospiele')
    number(r,'Videospiele','Nintendo: Verkäufe 30.06.2026','Nintendo-Switch-Verkäufe bis 30.06.2026','Mio. Exemplare',value,sales,
        f'Wie viele Millionen Exemplare von {name} wurden auf Nintendo Switch weltweit bis 30.06.2026 verkauft?',
        'Nintendo: weltweite kumulierte Stückverkäufe, inklusive Downloads und Hardware-Bundles; Stand 30.06.2026; nur Switch-Fassung.')

for i,(dex,statement,wrong,explanation) in enumerate([
    (25,'Pikachu wiegt laut offiziellem Pokédex 6 kg.','Pikachu wiegt laut offiziellem Pokédex 60 kg.','Der Pokédex nennt 6 kg für die Standardform.'),
    (1,'Bisasam trägt die Nationaldex-Nummer 1.','Bisasam trägt die Nationaldex-Nummer 25.','Bisasam hat die Nummer 1; Nummer 25 gehört zu Pikachu.'),
    (4,'Glumanda ist ein Pokémon vom Typ Feuer.','Glumanda ist ein Pokémon vom Typ Wasser.','Glumandas Typ ist Feuer.'),
    (7,'Schiggy ist ein Pokémon vom Typ Wasser.','Schiggy ist ein Pokémon vom Typ Elektro.','Schiggys Typ ist Wasser.'),
    (133,'Evoli ist in seiner Standardform ein Pokémon vom Typ Normal.','Evoli ist in seiner Standardform ein Pokémon vom Typ Geist.','Evoli hat in seiner Standardform den Typ Normal.')]):
    for text,answer in [(statement,True),(wrong,False)]:
        trivia['facts'].append(dict(cat='Videospiele',subcategory='Pokémon',s=text,a=answer,e=explanation,
            source=f'https://in.portal-pokemon.com/pokedex/{dex:04d}/',verified=DATE,
            difficulty=['easy','easy','medium','medium','hard'][i],expansion=9))

mario='https://www.nintendo.com/en-ca/explore/characters/mario/friends/'
for hint,answer in [('Dieser Held trägt meist eine rote Mütze und ist Luigis Bruder.','Mario'),
    ('Dieser grün gekleidete Bruder von Mario ist oft etwas ängstlich.','Luigi'),
    ('Diese Prinzessin herrscht über das Pilzkönigreich und trägt meist Rosa.','Prinzessin Peach'),
    ('Dieser König der Koopas ist Marios großer Gegenspieler.','Bowser'),
    ('Dieser freundliche Dinosaurier hilft Mario und besitzt eine lange Zunge.','Yoshi')]:
    clue('Videospiele',hint,answer,mario,1)
for hint,answer,dex in [('Dieses gelbe Elektro-Pokémon besitzt rote Wangen und entwickelt sich zu Raichu.','Pikachu',25),
    ('Dieses Pflanzen- und Gift-Pokémon trägt einen Samen auf seinem Rücken; seine Nationaldex-Nummer ist 1.','Bisasam',1),
    ('Dieses Feuer-Pokémon trägt eine Flamme an der Schwanzspitze; seine Nationaldex-Nummer ist 4.','Glumanda',4),
    ('Dieses Wasser-Pokémon sieht einer kleinen Schildkröte ähnlich; seine Nationaldex-Nummer ist 7.','Schiggy',7),
    ('Dieses Pokémon vom Typ Normal ist für seine vielen verschiedenen Entwicklungen bekannt; seine Nationaldex-Nummer ist 133.','Evoli',133)]:
    clue('Videospiele',hint,answer,f'https://in.portal-pokemon.com/pokedex/{dex:04d}/',2)
clue('Videospiele','Diese grüne Minecraft-Kreatur nähert sich Spielern und explodiert.','Creeper','https://www.minecraft.net/en-us/article/meet-creeper',1)
clue('Videospiele','Diese große, dunkle Minecraft-Kreatur teleportiert sich und mag keinen direkten Blickkontakt.','Enderman','https://www.minecraft.net/en-us/article/meet-enderman',2)
clue('Videospiele','Dieser maskierte Soldat der Task Force 141 heißt mit bürgerlichem Namen Simon Riley.','Ghost','https://www.callofduty.com/au/en/blog/2022/05/call-of-duty-modern-warfare-ii-ghost-price-task-force-141',3)
clue('Videospiele','Dieser Rainbow-Six-Siege-Operator setzt den Vorschlaghammer The Caber ein.','Sledge','https://www.ubisoft.com/en-ca/game/rainbow-six/siege/game-info/operators/sledge',3)
clue('Videospiele','Dieser Held der Zelda-Reihe führt das Master-Schwert und beschützt Hyrule.','Link','https://play.nintendo.com/activities/skill-quizzes/master-sword-online-trivia-quiz/',2)
sw='https://www.starwars.com/databank/'
for slug,hint,answer,level in [('darth-vader','Dieser Sith-Lord in schwarzer Rüstung hieß früher Anakin Skywalker.','Darth Vader',1),
    ('yoda','Dieser kleine Jedi-Meister unterrichtet Luke auf Dagobah.','Yoda',1),
    ('chewbacca','Dieser Wookiee ist Han Solos treuer Begleiter an Bord des Millennium Falken.','Chewbacca',1),
    ('r2-d2','Dieser kleine Astromech-Droide begleitet C-3PO und transportiert Leias Hilferuf.','R2-D2',2),
    ('leia-organa','Diese Prinzessin von Alderaan wird später Generalin des Widerstands.','Leia Organa',2),
    ('obi-wan-kenobi','Dieser Jedi-Meister bildet Anakin aus und lebt später unter dem Namen Ben auf Tatooine.','Obi-Wan Kenobi',2)]:
    clue('Star Wars',hint,answer,sw+slug,level)

for hint,answer,source in [('Dieser Komponist schrieb die Oper Die Zauberflöte.','Wolfgang Amadeus Mozart','https://kv.mozarteum.at/de/work/die-zauberflote-7137'),
    ('Dieser in Bonn geborene Komponist schuf die 9. Sinfonie mit dem Schlusschor nach Schillers An die Freude.','Ludwig van Beethoven','https://www.beethoven.de/de/work/view/5556714292117504/'),
    ('Dieser englische Dramatiker schrieb Hamlet sowie Romeo und Julia.','William Shakespeare','https://www.shakespeare.org.uk/explore-shakespeare/shakespedia/shakespeares-plays/'),
    ('Dieser niederländische Maler schuf Sonnenblumen und Die Kartoffelesser.','Vincent van Gogh','https://www.vangoghmuseum.nl/en/visit/whats-on/the-permanent-collection-van-goghs-masterpieces'),
    ('Dieser deutsche Schriftsteller verfasste Faust.','Johann Wolfgang von Goethe','https://www.klassik-stiftung.de/ihr-besuch/ausstellung/faust/'),
    ('Dieser Renaissance-Künstler malte die Mona Lisa.','Leonardo da Vinci','https://collections.louvre.fr/ark:/53355/cl010062370')]:
    clue('Kultur',hint,answer,source,2)

(ROOT/'content/catalogue.json').write_text(json.dumps(catalogue,ensure_ascii=False,indent=2)+'\n')
(ROOT/'content/trivia.json').write_text(json.dumps(trivia,ensure_ascii=False,indent=2)+'\n')
print('Reviewed expansion 9 written. Identity clues deliberately omit answer-revealing subject images.')
