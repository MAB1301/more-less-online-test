"""Reviewed additions. Optional World Bank source snapshots are read from argv[1]."""
import json,sys
from pathlib import Path
records=[]
def f(k,l,v,u,s,scope=''):return dict(criterion=k,label=l,value=v,unit=u,source=s,scope=scope)
def add(c,n,fs):records.append(dict(category=c,name=n,facts=fs))
source_root=Path(sys.argv[1])
wb_urls=json.loads((source_root/'urls.json').read_text())
wb_keys=[('pop','population','Einwohnerzahl','Menschen'),('area','country_area','Gesamtfläche','km²'),('gdp','gdp','BIP pro Kopf, laufende US-Dollar','US$'),('forest','forest','Waldanteil an der Landfläche','%'),('density','population_density','Bevölkerungsdichte (Landfläche)','Einw./km²')]
for code,name in [('DEU','Deutschland'),('FRA','Frankreich'),('JPN','Japan'),('BRA','Brasilien')]:
 fs=[]
 for file,k,l,u in wb_keys:
  data=json.loads((source_root/('wb_'+file+'.txt')).read_text())[1]
  v=next(d for d in data if d['countryiso3code']==code)
  assert v['value'] is not None
  fs.append(f(k,l,round(v['value'],2) if k in ['gdp','forest','population_density'] else v['value'],u,wb_urls['wb_'+file],f"Weltbank · {v['date']} · Gebietsdefinition laut Quelle"))
 add('Länder',name,fs)
citypop=[('Berlin',3897145,891.1,'https://download.statistik-berlin-brandenburg.de/9673209d56d43e64/bd35b2b2f78d/SB_A01-16-00_2024h02_BE.pdf','Einwohnerregister · 31.12.2024'),('Hamburg',1973896,755,'https://www.statistik-nord.de/fileadmin/Dokumente/A_I_S_1_j24.pdf','Melderegister · 31.12.2024'),('Wien',2028289,414.9,'https://www.wien.gv.at/spezial/migration-integration-jugendliche/daten-zur-wiener-bevolkerung/gesamtbevolkerung-wiens-2025/','01.01.2025'),('München',1603776,310.73,'https://stadt.muenchen.de/dam/jcr%3Aa520e26a-2650-469e-9cc0-837cebc2807b/2025-07-16_DemografieberichtTeil1A2025_Web.pdf','Hauptwohnsitze · 31.12.2024')]
for n,pop,area,s,scope in citypop:
 fs=[f('population','Registrierte Einwohnerzahl',pop,'Menschen',s,scope),f('city_density','Bevölkerungsdichte, berechnet',round(pop/area),'Einw./km²',s,scope+f' · Einwohner / {area} km²')]
 if n=='München':fs+=[f('city_area','Stadtfläche',310.73,'km²','https://www.muenchen.de/sehenswuerdigkeiten/muenchen-zahlen-interessante-fakten-ueber-die-stadt'),f('boroughs','Stadtbezirke',25,'','https://stadt.muenchen.de/dam/jcr%3Ac6eefa3d-b28b-4609-8277-e3445398cae5/mb260102.pdf')]
 add('Städte',n,fs)
for n,km,stations,s in [('Berlin',155,175,'https://www.berlin.de/tourismus/infos/nahverkehr/1742343-1721041-ubahn.html'),('Hamburg',106,93,'https://www.hochbahn.de/resource/blob/107306/44774c8aec49a343d4f6cd1749f4be56/ub2024-group-management-report-2024-data.pdf'),('Wien',83,109,'https://www.wienerlinien.at/die-wiener-oeffis-in-zahlen'),('München',95,100,'https://www.muenchen.de/verkehr/oeffentlicher-nahverkehr/u-bahn-muenchen-strecken-linien-tickets')]:add('Städte',n,[f('metro_length','U-Bahn-Netzlänge, gerundet',km,'km',s,'Quellenstand 09.10.2026; Hamburg Bericht 2024'),f('stations','U-Bahn-Stationen',stations,'',s,'Quellenstand 09.10.2026; Hamburg Bericht 2024')])
add('Natur','Rocky-Mountain-Nationalpark',[f('park_area','Parkfläche laut NPS',265807,'Acres','https://www.nps.gov/romo/'),f('visits','Freizeitbesuche',4171431,'Besuche','https://www.nps.gov/orgs/1207/03-13-26-2025-visitation-statsitics.htm','Kalenderjahr 2025')])
add('Natur','Lake Superior',[f('lake_area','Seeoberfläche',82100,'km²','https://www.nps.gov/piro/learn/nature/lake-superior.htm'),f('lake_depth','Maximale Seetiefe',406,'m','https://www.nps.gov/piro/learn/nature/lake-superior.htm'),f('lake_length','Seelänge',560,'km','https://www.nps.gov/piro/learn/nature/lake-superior.htm')])
add('Natur','Yellowstone Lake',[f('lake_area','Seeoberfläche',342,'km²','https://www.nps.gov/yell/learn/nature/yellowstone-lake.htm'),f('lake_length','Seelänge',32.2,'km','https://www.nps.gov/yell/learn/nature/yellowstone-lake.htm'),f('lake_elevation','Höhe über dem Meeresspiegel',2357,'m','https://www.nps.gov/yell/learn/nature/yellowstone-lake.htm')])
wfall='https://www.nps.gov/yose/planyourvisit/waterfalls.htm'
add('Natur','Yosemite Falls',[f('waterfall_height','Gesamthöhe des Wasserfalls',740,'m',wfall,'NPS, gerundet'),f('upper_fall','Höhe des oberen Falls',1430,'ft',wfall),f('lower_fall','Höhe des unteren Falls',320,'ft',wfall)])
for n,slug,clutch,length,width,days in [('Weißkopfseeadler','Bald_Eagle','1–3','5,8–8,4','4,7–6,3','34–36'),('Wanderdrossel','American_Robin','3–5','2,8–3,0','2,1','12–14')]:
 s='https://www.allaboutbirds.org/guide/'+slug+'/lifehistory';add('Tierwelt',n,[f('clutch','Gelegegröße',clutch,'Eier',s),f('egg_length','Eilänge',length,'cm',s),f('egg_width','Eibreite',width,'cm',s),f('incubation','Brutdauer',days,'Tage',s)])
hand='https://www.ihf.info/sites/default/files/2025-07/09A%20-%20Rules%20of%20the%20Game_Indoor%20Handball_E.pdf'
for n,source,weight,length,height,scope in [('Handball Männer (Harz)',hand,'425–475',40,2,'IHF 2025 · Erwachsene · Ballgröße 3 mit Harz'),('Volleyball Männer','https://www.fivb.com/wp-content/uploads/2025/01/FIVB-Volleyball_Rules2025_2028-EN-v05.pdf','260–280',18,2.43,'FIVB 2025–2028 · Halle · Männer'),('Beachvolleyball Männer','https://www.fivb.com/wp-content/uploads/2025/02/FIVB-BeachVolleyball_Rules2025_2028-EN-v01.pdf','260–280',16,2.43,'FIVB 2025–2028 · Männer')]:add('Sport',n,[f('ball_weight','Regelkonformes Ballgewicht',weight,'g',source,scope),f('pitch_length','Spielfeldlänge',length,'m',source,scope),f('net_height','Netz- bzw. Torhöhe',height,'m',source,scope)])
add('Sport','Fußball (international)',[f('ball_weight','Regelkonformes Ballgewicht','410–450','g','https://www.thefa.com/football-rules-governance/lawsandrules/laws/football-11-11/law-2---the-ball','IFAB 2026/27 · bei Spielbeginn'),f('pitch_length','Erlaubte Spielfeldlänge','100–110','m','https://www.theifab.com/laws/latest/the-field-of-play/','Internationales Spiel'),f('net_height','Netz- bzw. Torhöhe',2.44,'m','https://www.theifab.com/laws/latest/the-field-of-play/','Tor-Innenhöhe')])
add('Sport','Allianz Arena',[f('capacity','Stadionkapazität',75024,'Plätze','https://allianz-arena.com/en/arena/facts/general-information','Gesamtkapazität · Quellenstand 09.10.2026'),f('opening','Stadion-Eröffnungsjahr',2005,'','https://allianz-arena.com/en/arena/facts/general-information'),f('pitch_length','Spielfeldlänge',105,'m','https://allianz-arena.com/en/arena/facts/general-information')])
add('Videospiele','The Legend of Zelda: Breath of the Wild',[f('expansions','DLC-Pakete im Erweiterungspass',2,'Pakete','https://www.nintendo.com/au/games/nintendo-switch/the-legend-of-zelda-breath-of-the-wild/','Switch · The Master Trials und The Champions’ Ballad')])
for n,k,l,v,u,s in [('Hubble-Weltraumteleskop','mirror','Hauptspiegeldurchmesser',2.4,'m','https://esahubble.org/about/general/fact_sheet/'),('James-Webb-Weltraumteleskop','mirror','Hauptspiegeldurchmesser',6.5,'m','https://www.esa.int/Science_Exploration/Space_Science/Webb/Webb_factsheet'),('Voyager 1','antenna','Durchmesser der Hauptantenne',3.7,'m','https://science.nasa.gov/mission/voyager/frequently-asked-questions/'),('Explorer 1','satellite_length','Satellitenlänge',203,'cm','https://www.nasa.gov/missions/explorer/explorer-1-fast-facts/')]:add('Raumfahrt',n,[f(k,l,v,u,s)])
for name,id,count in [('Aachener Dom',3,4),('Opernhaus Sydney',166,1),('Kölner Dom',292,3),('Petra',326,3)]:add('Weltkultur',name,[f('heritage_criteria','UNESCO-Aufnahmekriterien',count,'Kriterien',f'https://whc.unesco.org/en/list/{id}/','Anzahl laut UNESCO-Eintrag')])
Path('content/research/2026-10-09/connections-additions.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n')
print(len(records),'addition records')
