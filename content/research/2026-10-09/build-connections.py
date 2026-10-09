"""Build the offline matching pack from reviewed catalogue facts and attributed additions.
Run from repository root. Numeric estimates retain their original range or scope.
"""
import json, re
from pathlib import Path
subjects=[];criteria={}
def fact(key,label,value,unit,source,scope=''):
 criteria.setdefault(key,label)
 return dict(criterion=key,label=label,value=value,unit=unit,source=source,scope=scope)
def add(cat,name,fs):subjects.append(dict(category=cat,name=name,facts=fs))
def row(cat,name,source,columns,values,scope=''):
 add(cat,name,[fact(key,label,v,unit,source,scope) for (key,label,unit),v in zip(columns,values)])
def mapkey(metric):
 pairs=[('Motorleistung','power'),('Beschleunigungszeit','acceleration'),('Drehmoment','torque'),('Hubraum','displacement'),('Zylinderzahl','cylinders'),('Motordrehzahl','rpm'),('Fahrzeuglänge','car_length'),('Radstand','wheelbase'),('Tragzeit','gestation'),('Geburtsgewicht','birthweight'),('Körpermassenwert','weight'),('Gründungsjahr als Nationalpark','park_year'),('Parkfläche','park_area'),('Freizeitbesuche','visits'),('Verwaltungsbezirke','boroughs'),('Stadtfläche','city_area'),('Stiftungsjahr','university_year'),('Staatsfläche','country_area'),('Telefon','dialcode'),('höchsten natürlichen','peak_height'),('Startjahr','launch_year'),('Masse beim Start','launch_mass'),('UNESCO-Welterbe','unesco_year'),('UNESCO-Kernfläche','heritage_area')]
 return next((k for text,k in pairs if text in metric),metric)
# Preserve the catalogue's explicit units and metric definitions.
for s in json.loads(Path('content/catalogue.json').read_text()):
 for cat in ['Autos','Tierwelt','Natur','Städte','Länder','Raumfahrt','Weltkultur']:
  fs=[f for f in s['facts'] if f.get('category')==cat and isinstance(f.get('value'),(int,float))]
  if fs:add(cat,s['name'],[fact(mapkey(f['metric']),f['metric'],f['value'],f['unit'],f['source']) for f in fs])
zoo='https://animals.sandiegozoo.org/animals/cheetah'
row('Tierwelt','Gepard',zoo,[('gestation','Tragzeit, ungefähr','Monate'),('birthweight','Geburtsgewicht, oberer Richtwert','kg'),('weight','Körpergewicht, oberer Richtwert','kg'),('animal_length','Körperlänge, oberer Richtwert','m')],[3,.3,65,1.4])
# WWF page estimates: access date is explicit, not misrepresented as a census year.
for name,slug,weight,stock,length in [('Tiger','tiger','99,8–299,4','ca. 5.700','1,83–3,05'),('Eisbär','polar-bear','362,9–589,7','ca. 26.000','1,83–2,74'),('Schneeleopard','snow-leopard','27,2–54,4','4.000–6.500','0,61–1,52')]:
 source='https://www.worldwildlife.org/species/'+slug+'/'
 row('Tierwelt',name,source,[('weight','Körpergewicht laut WWF','kg'),('animal_stock','Bestand in freier Wildbahn','Tiere'),('animal_length','Länge laut WWF','m')],[weight,stock,length],'WWF-Seitenstand 09.10.2026; Schätzwerte')
 if slug=='polar-bear':subjects[-1]['facts'][0]['scope']+='; Männchen'
row('Tierwelt','Großer Panda','https://www.worldwildlife.org/species/giant-panda/',[('weight','Körpergewicht laut WWF','kg'),('animal_stock','Bestand in freier Wildbahn','Tiere'),('daily_food','Tägliche Bambusmenge laut WWF','kg')],['99,8–149,7',1864,'11,8–38,1'],'WWF-Seitenstand 09.10.2026; Schätzwerte')
# Conversion of lb to kg / ft to m is rounded to the displayed precision.
for name,slug,clutch,egg_length,egg_width,incubation in [('Stockente','Mallard','1–13','5,3–6,4','3,9–4,5','23–30'),('Brautente','Wood_Duck','6–16','4,6–6,1','3,5–4,2','28–37')]:
 row('Tierwelt',name,'https://www.allaboutbirds.org/guide/'+slug+'/lifehistory',[('clutch','Gelegegröße','Eier'),('egg_length','Eilänge','cm'),('egg_width','Eibreite','cm'),('incubation','Brutdauer','Tage')],[clutch,egg_length,egg_width,incubation],'Cornell Lab; publizierter Bereich')
ferrari='https://www.ferrari.com/en-EN/corporate/articles/ferrari-12cilindri-for-the-few'
next(s for s in subjects if s['name']=='Ferrari 12Cilindri')['facts'] += [fact(k,l,v,u,ferrari,scope) for k,l,v,u,scope in [('power','Motorleistung',830,'PS','Coupé'),('torque','Maximales Motordrehmoment',678,'Nm','Coupé'),('displacement','Hubraum',6496,'cm³','Coupé'),('weight_car','Trockengewicht',1560,'kg','mit optionaler Leichtbauausstattung'),('car_length','Fahrzeuglänge',4733,'mm','Coupé'),('wheelbase','Radstand',2700,'mm','Coupé'),('top_speed','Höchstgeschwindigkeit','> 340','km/h','Coupé'),('acceleration','0–100 km/h',2.9,'s','Coupé'),('boot','Kofferraumvolumen',270,'Liter','Coupé')]]
kba='https://www.kba.de/DE/Presse/Pressemitteilungen/Fahrzeugbestand/2025/pm10_fz_bestand_pm_komplett.html'
for name,stock,share,growth in [('VW – gesamte Marke',10288048,20.9,.4),('BMW – gesamte Marke',3453884,7,.7),('Mercedes – gesamte Marke',4721019,9.6,.4),('Porsche – gesamte Marke',402411,.8,3.9),('Audi – gesamte Marke',3308722,6.7,.2)]:
 row('Autos',name,kba,[('car_stock','Zugelassener Pkw-Bestand','Pkw'),('stock_share','Anteil am Pkw-Bestand','%'),('stock_change','Bestandsänderung zum Vorjahr','%')],[stock,share,growth],'Deutschland · 01.01.2025 · gesamte Marke')
science_cols=[('atomic_number','Ordnungszahl',''),('density','Dichte bei Raumtemperatur','g/cm³'),('melting','Schmelzpunkt','°C'),('boiling','Siedepunkt','°C'),('atomic_mass','Relative Atommasse','')]
for name,num,slug,vals in [('Eisen',26,'iron',[26,7.87,1538,2861,55.845]),('Aluminium',13,'aluminium',[13,2.70,660.323,2519,26.982]),('Kupfer',29,'copper',[29,8.96,1084.62,2560,63.546]),('Gold',79,'gold',[79,19.3,1064.18,2836,196.967])]:row('Wissenschaft',name,f'https://periodic-table.rsc.org/element/{num}/{slug}',science_cols,vals,'Royal Society of Chemistry')
nasa='https://nssdc.gsfc.nasa.gov/planetary/factsheet/'
planet_cols=[('planet_mass','Masse','10²⁴ kg'),('diameter','Äquatordurchmesser','km'),('gravity','Schwerkraft am Äquator','m/s²'),('rotation','Rotationsperiode, Betrag','h'),('orbit','Umlaufzeit um die Sonne','Tage'),('planet_density','Mittlere Dichte','kg/m³')]
for name,vals in [('Merkur',[.330,4879,3.7,1407.6,88,5429]),('Venus',[4.87,12104,8.9,5832.5,224.7,5243]),('Erde',[5.97,12756,9.8,23.9,365.2,5514]),('Mars',[.642,6792,3.7,24.6,687,3934]),('Jupiter',[1898,142984,23.1,9.9,4331,1326]),('Saturn',[568,120536,9,10.7,10747,687]),('Uranus',[86.8,51118,8.7,17.2,30589,1270]),('Neptun',[102,49528,11,16.1,59800,1638])]:row('Weltraum',name,nasa,planet_cols,vals,'NASA Fact Sheet 18.03.2025')
for name,slug,height,floors,year in [('Burj Khalifa','burj-khalifa/3',828,163,2010),('Empire State Building','empire-state-building/261',381,102,1931),('Shanghai Tower','shanghai-tower/56',632,128,2015),('Merdeka 118','merdeka-118/10115',678.9,118,2023)]:row('Bauwerke',name,'https://www.skyscrapercenter.com/building/'+slug,[('building_height','Architektonische Höhe','m'),('floors','Oberirdische Geschosse',''),('completion','Fertigstellungsjahr','')],[height,floors,year],'CVU / ehemals CTBUH')
row('Bauwerke','Golden Gate Bridge','https://www.goldengate.org/bridge/history-research/statistics-data/design-construction-stats/',[('bridge_span','Hauptspannweite','m'),('bridge_length','Gesamtlänge inkl. Zufahrten','m'),('building_height','Turmhöhe über dem Wasser','m')],[1280,2737,227])
artcols=[('art_year','Entstehungsjahr / Zeitraum',''),('art_height','Bildhöhe','cm'),('art_width','Bildbreite','cm')]
for name,work,values in [('Sternennacht – van Gogh',79802,[1889,73.7,92.1]),('Die Beständigkeit der Erinnerung – Dalí',79018,[1931,24.1,33]),("Les Demoiselles d’Avignon – Picasso",79766,[1907,243.9,233.7]),('Seerosen – Monet (MoMA, drei Tafeln)',80220,['1914–1926',200,1276])]:row('Weltkultur',name,f'https://www.moma.org/collection/works/{work}',artcols,values,'MoMA; bei Monet Gesamtbreite der drei Tafeln')
# One subject can have different fact kinds; a round still has exactly three fact cards per name.
for name,goals,assists,minutes in [('Kylian Mbappé',8,2,597),('Lionel Messi',7,3,690),('Olivier Giroud',4,0,424),('Julián Álvarez',4,0,466)]:row('Fußballer',name,'https://www.fifa.com/en/articles/top-goalscorers-leading-marksmen-golden-boot-fifa-world-cup-qatar-2022',[('goals','Tore',''),('assists','Torvorlagen laut FIFA',''),('minutes','Spielminuten laut FIFA','min'),('appearances','Spieleinsätze','')],[goals,assists,minutes,7 if name!='Olivier Giroud' else 6],'Männer-WM 2022; ohne Elfmeterschießen')
sales='https://www.nintendo.co.jp/ir/en/finance/software/switch.html'
for name,slug,date,players,sold in [('Mario Kart 8 Deluxe','mario-kart-8-deluxe','28.04.2017',4,71.53),('Animal Crossing: New Horizons','animal-crossing-new-horizons','20.03.2020',4,50.29),('Super Smash Bros. Ultimate','super-smash-bros-ultimate','07.12.2018',8,38.14),('The Legend of Zelda: Breath of the Wild','the-legend-of-zelda-breath-of-the-wild','03.03.2017',1,34.06),('Super Mario Odyssey','super-mario-odyssey','27.10.2017',2,30.80)]:
 source=f'https://www.nintendo.com/us/store/products/{slug}-switch/'
 add('Videospiele',name,[fact('release','Erstveröffentlichung auf Switch',date,'',source),fact('players','Max. Spieler an einer Switch',players,'',source),fact('sales','Weltweit verkaufte Switch-Exemplare',sold,'Mio.',sales,'30.06.2026 · inkl. Downloads und Bundles')])
# More additions are collected in additions.json; keep exact per-fact attribution.
extra=Path('content/research/2026-10-09/connections-additions.json')
if extra.exists():
 for s in json.loads(extra.read_text()):
  for f in s['facts']:criteria.setdefault(f['criterion'],f['label'])
  existing=next((x for x in subjects if x['name']==s['name'] and x['category']==s['category']),None)
  if existing:existing['facts']+=s['facts']
  else:subjects.append(s)
# Consolidate subjects so imported and new records are not sampled as two names.
merged={}
for s in subjects:
 key=(s['category'],s['name'])
 if key not in merged:merged[key]=s
 else:merged[key]['facts']+=s['facts']
subjects=list(merged.values())
for s in subjects:
 seen=set();s['facts']=[f for f in s['facts'] if f['criterion'] not in seen and not seen.add(f['criterion'])]
# Unready catalogue objects never appear as misleading selectable rounds.
subjects=[s for s in subjects if len(s['facts'])>=3]
used={f['criterion'] for s in subjects for f in s['facts']};criteria={k:v for k,v in criteria.items() if k in used}
criteria.update({k:v for k,v in {'power':'Leistung','acceleration':'0–100 km/h','torque':'Drehmoment','displacement':'Hubraum','cylinders':'Zylinderzahl','rpm':'Motordrehzahl','car_length':'Fahrzeuglänge','wheelbase':'Radstand','gestation':'Tragzeit','birthweight':'Geburtsgewicht','weight':'Gewicht','weight_car':'Fahrzeuggewicht','animal_stock':'Bestand (Wildtiere)','car_stock':'Bestand (zugelassene Pkw)','park_year':'Nationalpark-Gründungsjahr','park_area':'Nationalparkfläche','visits':'Besucherzahl','population':'Einwohnerzahl','population_density':'Bevölkerungsdichte','country_area':'Landesfläche','city_area':'Stadtfläche','university_year':'Universitäts-Gründungsjahr','boroughs':'Stadtbezirke','dialcode':'Telefonvorwahl','peak_height':'Höchster Gipfel','launch_year':'Startjahr','launch_mass':'Startmasse','unesco_year':'UNESCO-Aufnahmejahr','heritage_area':'UNESCO-Kernfläche','gdp':'BIP pro Kopf','forest':'Waldanteil','stock_share':'Bestandsanteil','stock_change':'Bestandsänderung','net_height':'Netz- / Torhöhe','art_year':'Entstehungsjahr','art_height':'Bildhöhe','art_width':'Bildbreite','sales':'Verkaufte Exemplare','release':'Veröffentlichung','players':'Maximale Spielerzahl','expansions':'Erweiterungen'}.items() if k in criteria})
pack=dict(version=1,reviewed='2026-10-09',criteria=criteria,subjects=subjects)
Path('assets/fact-connections-data.js').write_text('window.FACT_CONNECTIONS_PACK='+json.dumps(pack,ensure_ascii=False,separators=(',',':'))+';\n')
print(len(subjects),'subjects;',len(criteria),'criteria;',sum(len(s['facts']) for s in subjects),'facts')
