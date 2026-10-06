"""Reproducible source-reviewed expansion for the least populated categories."""
import json, itertools, re
from pathlib import Path
from html import escape
ROOT=Path(__file__).resolve().parents[1]
DATE='2026-10-06'
TAG='small-categories-20261006'
ECB='https://www.ecb.europa.eu/euro/coins/common/html/index.de.html'
EU='https://www.consilium.europa.eu/en/policies/how-enlargement-works/timeline-accession-eu-member-states/'
ZOO='https://animals.sandiegozoo.org/animals/'
AOC='https://www.olympics.com.au/games/'
COINS=[('1-Cent-Münze',16.25,2.30,1.67),('2-Cent-Münze',18.75,3.06,1.67),('5-Cent-Münze',21.25,3.92,1.67),('10-Cent-Münze',19.75,4.10,1.93),('20-Cent-Münze',22.25,5.74,2.14),('50-Cent-Münze',24.25,7.80,2.38),('1-Euro-Münze',23.25,7.50,2.33),('2-Euro-Münze',25.75,8.50,2.20)]
COUNTRIES=[('Dänemark',1973),('Griechenland',1981),('Spanien',1986),('Österreich',1995),('Polen',2004),('Rumänien',2007),('Kroatien',2013)]
CITIES=[('Athen',1896,'athens'),('London',1908,'london'),('Stockholm',1912,'stockholm'),('Berlin',1936,'berlin'),('Helsinki',1952,'helsinki'),('Melbourne',1956,'melbourne')]
ANIMALS=[('Elefant',22,'elephant'),('Giraffe',14,'giraffe'),('Löwe',4,'lion')]
def save(path,obj):path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
def main():
 rows=json.loads((ROOT/'content/catalogue.json').read_text()); trivia=json.loads((ROOT/'content/trivia.json').read_text())
 # Remove only this release's previous output before rebuilding.
 rows=[r for r in rows if r.get('release')!=TAG]
 for r in rows:r['facts']=[f for f in r['facts'] if f.get('release')!=TAG]
 for game in ('facts','jeopardy'):trivia[game]=[q for q in trivia[game] if q.get('release')!=TAG]
 numeric=[];sources={};visuals=ROOT/'assets/visuals/small-categories';visuals.mkdir(parents=True,exist_ok=True)
 def add(name,cat,metric,value,unit,source,question,year,notes,theme):
  sources[source]={'verified':DATE,'data_years':sorted(set(sources.get(source,{}).get('data_years',[])+[year])),'method':'Primary publisher page retrieved and relevant field read on 2026-10-06.'}
  r=next((r for r in rows if r['name']==name),None)
  if not r:
   ident=TAG+'-'+str(len(rows));variants={}
   motifs={'coins':'<circle cx="300" cy="230" r="105" fill="#e5bb62"/><circle cx="300" cy="230" r="78" fill="none" stroke="#fff0b3" stroke-width="8"/>','countries':'<circle cx="300" cy="230" r="105" fill="none" stroke="#71dfd0" stroke-width="12"/><path d="M195 230h210M300 125c-80 55-80 155 0 210M300 125c80 55 80 155 0 210" fill="none" stroke="#71dfd0" stroke-width="8"/>','cities':'<path d="M160 340V190h80v150M260 340V130h80v210M360 340V220h80v120" fill="#a296ee"/><path d="M140 350h320" stroke="#70dbdc" stroke-width="12"/>'}
   for kind,w in [('card',720),('detail',960)]:
    filename=f'{ident}-{kind}.svg';variants[kind]='small-categories/'+filename
    # Same illustration size for each subject: no measurement or timeline clue.
    (visuals/filename).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="540" viewBox="0 0 {w} 540" role="img"><title>{escape(name)} – Themenmotiv</title><rect width="{w}" height="540" fill="#111d34"/><g transform="translate({(w-600)/2:g} 0)">{motifs[theme]}</g><text x="{w/2:g}" y="455" text-anchor="middle" font-family="sans-serif" font-size="30" fill="#f5f3ff">{escape(name)}</text></svg>\n')
   r={'id':ident,'name':name,'release':TAG,'status':'approved','image':'../assets/visuals/'+variants['card'],'variants':variants,'generated':False,'image_source':'https://github.com/MAB1301/more-less-online-test/blob/Main/content/research/2026-10-06-small-categories/README.md','image_license':'CC0-1.0 original thematic vector','facts':[]};rows.append(r)
  assert not any(f['metric']==metric for f in r['facts']),name+' duplicate metric'
  f={'category':cat,'metric':metric,'value':value,'unit':unit,'comparison_unit':unit+' · '+metric,'source':source,'verified':DATE,'data_year':year,'estimate_question':question,'notes':notes,'subcategory':{'coins':'Euro-Münzmaße','countries':'Europäische Geschichte','cities':'Olympiastädte','animals':'Fortpflanzung'}[theme],'release':TAG}
  r['facts'].append(f);numeric.append({'subject':name,**f})
 for name,diameter,mass,thickness in COINS:
  for metric,value,unit in [('Euro-Umlaufmünze: Durchmesser',diameter,'mm'),('Euro-Umlaufmünze: Masse',mass,'g'),('Euro-Umlaufmünze: Dicke',thickness,'mm')]:
   add(name,'Allgemeinwissen',metric,value,unit,ECB,f'Welchen Wert hat die {name} bei „{metric}“, in {unit}?',2026,'Technische Sollgröße der regulären Euro-Umlaufmünze laut EZB; keine Sammlermünze.','coins')
 for name,year in COUNTRIES:
  add(name,'Länder','Beitrittsjahr zur EU beziehungsweise EG',year,'Jahr',EU,f'In welchem Jahr trat {name} der EU beziehungsweise ihrer Vorgängerin EG bei?',year,'Historischer Beitritt, nicht Euro-Einführung oder Schengen-Beitritt.','countries')
 for name,year,slug in CITIES:
  add(name,'Städte','Jahr der ersten regulären Olympischen Sommerspiele als Hauptgastgeber',year,'Jahr',AOC+f'{slug}-{year}/',f'In welchem Jahr war {name} erstmals Hauptgastgeber regulärer Olympischer Sommerspiele?',year,'Erste reguläre Sommerspiele als Hauptgastgeber; keine Winter- oder Jugendspiele. Melbourne 1956: Reitsport separat in Stockholm.','cities')
 for name,value,slug in ANIMALS:
  add(name,'Tierwelt','Oberer gerundeter Tragzeit-Richtwert laut San Diego Zoo',value,'Monate',ZOO+slug,f'Welchen oberen gerundeten Tragzeit-Richtwert nennt der San Diego Zoo für {name}, in Monaten?',2026,'Zoo-Richtwerte: Elefant 20–22 Monate, Giraffe 14 Monate, Löwe fast 4 Monate (hier auf 4 gerundet). Keine exakte individuelle Dauer.','animals')
 facts=[('Die 50-Cent-Münze hat einen größeren Durchmesser als die 1-Euro-Münze.',True,'24,25 mm gegenüber 23,25 mm.', 'Allgemeinwissen',ECB),('Die 2-Euro-Münze ist dicker als die 50-Cent-Münze.',False,'2,20 mm gegenüber 2,38 mm.','Allgemeinwissen',ECB),('Dänemark trat der EG vor Österreichs EU-Beitritt bei.',True,'Dänemark 1973; Österreich 1995.','Länder',EU),('Kroatien trat der EU im selben Jahr wie Polen bei.',False,'Kroatien 2013; Polen 2004.','Länder',EU),('Stockholm war vor Helsinki erstmals Hauptgastgeber regulärer Sommerspiele.',True,'Stockholm 1912; Helsinki 1952.','Städte',AOC+'stockholm-1912/'),('Berlin war vor London erstmals Hauptgastgeber regulärer Sommerspiele.',False,'Berlin 1936; London 1908.','Städte',AOC+'berlin-1936/'),('Der obere gerundete Tragzeit-Richtwert des Zoos ist für Elefanten länger als für Giraffen.',True,'22 gegenüber 14 Monaten.','Tierwelt',ZOO+'elephant'),('Der San Diego Zoo nennt für Löwen eine Tragzeit von 14 Monaten.',False,'Fast 4 Monate; 14 Monate gilt auf der Zoo-Seite für Giraffen.','Tierwelt',ZOO+'lion')]
 for s,a,e,cat,src in facts:trivia['facts'].append({'s':s,'a':a,'e':e,'cat':cat,'source':src,'sources':[src,EU] if cat=='Länder' else [src,AOC+'helsinki-1952/',AOC+'london-1908/'] if cat=='Städte' else [src,ZOO+'giraffe'] if cat=='Tierwelt' else [src],'verified':DATE,'difficulty':'medium','release':TAG})
 clues=[('Welche Euro-Umlaufmünze wiegt laut EZB 8,50 Gramm?','2-Euro-Münze|2 Euro','Allgemeinwissen',ECB),('Welche Euro-Umlaufmünze hat die charakteristische Form „Spanische Blume“?','20-Cent-Münze|20 Cent','Allgemeinwissen',ECB),('Welcher Balkanstaat trat am 1. Juli 2013 der EU bei?','Kroatien','Geografie',EU),('Welcher Staat mit der Hauptstadt Wien trat 1995 der EU bei?','Österreich|Oesterreich','Geografie',EU),('Welche Stadt wurde Hauptgastgeber der Sommerspiele 1908, nachdem Rom zurückgezogen hatte?','London','Geschichte',AOC+'london-1908/'),('Welche australische Stadt war Hauptgastgeber der Sommerspiele 1956?','Melbourne','Geografie',AOC+'melbourne-1956/'),('Bei welchem Tier nennt der San Diego Zoo eine Tragzeit von 20 bis 22 Monaten?','Elefant|Elefanten','Allgemeinwissen',ZOO+'elephant'),('Welches besonders langhalsige Tier hat laut San Diego Zoo eine Tragzeit von 14 Monaten?','Giraffe','Allgemeinwissen',ZOO+'giraffe')]
 for q,a,cat,src in clues:trivia['jeopardy'].append({'q':q,'a':a,'cat':cat,'source':src,'verified':DATE,'difficulty':2,'release':TAG})
 save(ROOT/'content/catalogue.json',rows);save(ROOT/'content/trivia.json',trivia)
 save(ROOT/'content/research/2026-10-06-small-categories/data.json',{'verified':DATE,'sources':sources,'numeric':numeric,'facts':[q for q in trivia['facts'] if q.get('release')==TAG],'jeopardy':[q for q in trivia['jeopardy'] if q.get('release')==TAG]})
 print(f'{len(numeric)} sourced measurements; 8 balanced facts; 8 Jeopardy clues')
if __name__=='__main__':main()
