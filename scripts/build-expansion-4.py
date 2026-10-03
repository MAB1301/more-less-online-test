#!/usr/bin/env python3
"""Reproducible sourced facts and original answer-free vector assets."""
import json
from html import escape
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/visuals/research-4'
DATE='2026-10-03'
PLANETS=[('Merkur',5429,4.3,47.4),('Venus',5243,10.4,35.0),('Erde',5514,11.2,29.8),('Mars',3934,5.0,24.1),('Jupiter',1326,59.5,13.1),('Saturn',687,35.5,9.7),('Uranus',1270,21.3,6.8),('Neptun',1638,23.5,5.4)]
ELEMENTS=[('boron','Bor','B',5),('fluorine','Fluor','F',9),('phosphorus','Phosphor','P',15),('potassium','Kalium','K',19),('silver','Silber','Ag',47),('gold','Gold','Au',79)]
PARKS=[('grand-teton','Grand-Teton-Nationalpark',1929,'https://www.nps.gov/grte/learn/historyculture/cultural.htm'),('shenandoah','Shenandoah-Nationalpark',1935,'https://www.nps.gov/shen/faqs.htm?fullweb=1'),('arches','Arches-Nationalpark',1971,'https://www.nps.gov/articles/arch-timeline.htm'),('canyonlands','Canyonlands-Nationalpark',1964,'https://www.nps.gov/cany/learn/historyculture/parkfounders.htm'),('joshua-tree','Joshua-Tree-Nationalpark',1994,'https://www.nps.gov/jotr/learn/historyculture/parkhistory.htm')]
MISSIONS=[('explorer-1','Explorer 1',1958,'https://science.nasa.gov/mission/explorer-1/'),('mariner-2','Mariner 2',1962,'https://science.nasa.gov/mission/mariner-2/'),('pioneer-10','Pioneer 10',1972,'https://science.nasa.gov/mission/pioneer-10/'),('galileo','Galileo',1989,'https://science.nasa.gov/mission/galileo/'),('juno','Juno',2011,'https://www.jpl.nasa.gov/missions/juno/')]
HERITAGE=[('rome','Historisches Zentrum von Rom',1980,91),('machu-picchu','Machu Picchu',1983,274),('petra','Petra',1985,326),('angkor','Angkor',1992,668)]

def fact(cat,metric,value,unit,comparison,source,question,notes=''):
 return dict(category=cat,metric=metric,value=value,unit=unit,comparison_unit=comparison,source=source,verified=DATE,estimate_question=question,notes=notes)

def visual(ident,name,body):
 OUT.mkdir(parents=True,exist_ok=True)
 for kind,width in [('card',720),('detail',960)]:
  offset=(width-720)//2
  svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="540" viewBox="0 0 {width} 540" role="img"><title>{escape(name)} – frei gestaltetes Symbol</title><rect width="{width}" height="540" fill="#122238"/><g transform="translate({offset} 0)">{body}</g></svg>\n'
  (OUT/f'{ident}-{kind}.svg').write_text(svg)

def record(ident,name,body,f):
 visual(ident,name,body)
 return dict(id=ident,name=name,status='approved',image=f'../assets/visuals/research-4/{ident}-card.svg',variants=dict(card=f'research-4/{ident}-card.svg',detail=f'research-4/{ident}-detail.svg'),generated=False,image_source='https://github.com/MAB1301/more-less-online-test/blob/Main/assets/visuals/research-4/README.md',image_license='CC0-1.0 original vector illustration',facts=[f])

def build():
 catalogue=ROOT/'content/catalogue.json';records=json.loads(catalogue.read_text());new=[]
 nasa='https://nssdc.gsfc.nasa.gov/planetary/factsheet/'
 for name,density,escape_speed,orbital_speed in PLANETS:
  r=next(x for x in records if x['name']==name)
  additions=[fact('Weltraum','Mittlere Planetendichte',density,'kg/m³','kg/m³ · mittlere Planetendichte',nasa,f'Welche mittlere Dichte hat {name} laut NASA ungefähr, in Kilogramm pro Kubikmeter?','Mittlere Dichte des gesamten Planeten, keine lokale Materialdichte.'),fact('Weltraum','Fluchtgeschwindigkeit',escape_speed,'km/s','km/s · Fluchtgeschwindigkeit',nasa,f'Welche Fluchtgeschwindigkeit nennt die NASA für {name} ungefähr, in Kilometern pro Sekunde?','Tabellenwert ohne Atmosphärenwiderstand; bei Gasplaneten am 1-bar-Niveau. Keine reale Raketen-Startgeschwindigkeit.'),fact('Weltraum','Mittlere Bahngeschwindigkeit um die Sonne',orbital_speed,'km/s','km/s · mittlere Bahngeschwindigkeit um die Sonne',nasa,f'Mit welcher mittleren Geschwindigkeit bewegt sich {name} laut NASA um die Sonne, in Kilometern pro Sekunde?','Gemittelte heliozentrische Bahngeschwindigkeit, keine momentane Geschwindigkeit oder Rotation.')]
  for f in additions:
   if not any(x['metric']==f['metric'] for x in r['facts']):r['facts'].append(f)
  new.append(dict(name=name,facts=additions))
 for ident,name,symbol,value in ELEMENTS:
  body=f'<rect x="195" y="105" width="330" height="330" rx="38" fill="#b0d4d5"/><text x="360" y="325" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="155" fill="#122238">{symbol}</text>'
  f=fact('Wissenschaft','Ordnungszahl',value,'Protonen','Protonen',f'https://periodic-table.rsc.org/element/{value}/{ident}',f'Wie viele Protonen enthält ein Atomkern des Elements {name}?','Ordnungszahl gleich Protonenzahl. Grafik zeigt nur das Elementsymbol.')
  new.append(record(ident,name,body,f))
 park_shapes=[
  '<path d="M175 390l110-220 55 95 65-145 145 270z" fill="#96a7ba"/><path d="M260 220l25-50 25 43-25-10zM382 170l23-50 35 65-35-20z" fill="#f1f5fa"/><path d="M180 405q180-45 360 0" fill="none" stroke="#79bad5" stroke-width="24"/>',
  '<path d="M170 365q100-200 210-80t170 20v110H170z" fill="#5d9590"/><path d="M170 390q130-120 240-20t140-10v60H170z" fill="#92c5a4"/><path d="M215 230l-40 140h80zM480 190l-50 170h100z" fill="#365c63"/>',
  '<path d="M200 400V280q0-155 160-155t160 155v120h-75V290q0-75-85-75t-85 75v110z" fill="#d0926a"/><path d="M180 418h360" stroke="#efcb9a" stroke-width="14"/>',
  '<path d="M175 190h370v80H175z" fill="#c69873"/><path d="M195 280h135v130H195zM395 280h130v130H395z" fill="#936750"/><path d="M350 260l-20 190h65z" fill="#72b5c7"/>',
  '<path d="M360 410V220m0 35-90-40-25-60m115 140 100-70 25-60m-125 75 35-110" stroke="#a2b77b" stroke-width="28" fill="none" stroke-linecap="round"/><path d="M180 430q150-80 360 0" stroke="#d9ae72" stroke-width="35" fill="none"/>'
 ]
 for (ident,name,year,source),body in zip(PARKS,park_shapes):
  q=f'In welchem Jahr erhielt der {name} erstmals den Status eines Nationalparks?'
  notes='Erste Ausweisung als Nationalpark; nicht National Monument, Genehmigung, spätere Erweiterung oder Umbenennung.'
  new.append(record(ident,name,body,fact('Natur','Gründungsjahr als Nationalpark',year,'Jahr','Jahr · Gründungsjahr als Nationalpark',source,q,notes)))
 for i,(ident,name,year,source) in enumerate(MISSIONS):
  colors=['#9fc7f1','#d8c098','#c2b0e4','#9ed5c1','#e4a898'];color=colors[i]
  if i==0:body=f'<circle cx="360" cy="275" r="130" fill="none" stroke="#496385" stroke-width="14"/><g transform="rotate(-25 360 270)"><rect x="320" y="140" width="80" height="250" rx="30" fill="{color}"/><path d="M290 195h140m-140 140h140" stroke="#fff" stroke-width="10"/></g>'
  elif i==4:body=f'<circle cx="360" cy="270" r="52" fill="{color}"/><g fill="{color}"><path d="M345 205V100h30v105zM413 285l110 65-15 26-110-65zM305 285l-110 65 15 26 110-65z"/></g><circle cx="360" cy="270" r="21" fill="#122238"/>'
  else:body=f'<path d="M310 250l50-110 50 110z" fill="{color}"/><rect x="305" y="250" width="110" height="110" rx="20" fill="{color}"/><path d="M175 275h110v60H175zM435 275h110v60H435z" fill="#718eb7"/><path d="M330 365l30 55 30-55" fill="#e2a471"/><circle cx="360" cy="282" r="25" fill="#122238"/>'
  new.append(record(ident,name,body,fact('Raumfahrt','Startjahr der Mission',year,'Jahr','Jahr · Startjahr der Mission',source,f'In welchem Jahr startete die Raumfahrtmission {name} von der Erde?','Startjahr, nicht Jahr des Vorbeiflugs oder der Ankunft am Ziel. Missionsgrafik ist ein allgemeines Symbol, kein maßstabsgetreues Sondenmodell.')))
 heritage_shapes=[
  '<rect x="180" y="195" width="360" height="205" rx="35" fill="#d2ba95"/><g fill="#122238"><path d="M225 360v-65a30 30 0 0160 0v65zM330 360v-65a30 30 0 0160 0v65zM435 360v-65a30 30 0 0160 0v65z"/></g><path d="M195 245h330" stroke="#917b65" stroke-width="14"/>',
  '<path d="M175 335l120-210 130 210zM340 335l90-160 115 160z" fill="#72998a"/><path d="M195 355h330v30H195zM215 395h290v25H215z" fill="#c3c19b"/><g fill="#d4d3b7"><path d="M230 335v-60h65v60zM335 335v-80h85v80z"/></g>',
  '<path d="M195 180l165-60 165 60v240H195z" fill="#c28b72"/><path d="M225 220l135-55 135 55z" fill="#f0c4a3"/><path d="M235 235v130m60-130v130m130-130v130m60-130v130" stroke="#f0c4a3" stroke-width="20"/><rect x="330" y="280" width="60" height="130" fill="#604c48"/>',
  '<path d="M185 415V290l45-100 45 100v125zM300 415V240l60-125 60 125v175zM445 415V290l45-100 45 100v125z" fill="#b2bead"/><path d="M180 425h360" stroke="#728c87" stroke-width="20"/><path d="M345 415v-75a15 15 0 0130 0v75" fill="#122238"/>'
 ]
 for (ident,name,year,num),body in zip(HERITAGE,heritage_shapes):
  new.append(record(ident,name,body,fact('Weltkultur','Erstes UNESCO-Welterbe-Einschreibungsjahr',year,'Jahr','Jahr · Erstes UNESCO-Welterbe-Einschreibungsjahr',f'https://whc.unesco.org/en/list/{num}/',f'In welchem Jahr wurde die Welterbestätte {name} erstmals in die UNESCO-Welterbeliste aufgenommen?','Erste Einschreibung der gesamten Welterbestätte; nicht Baujahr, Entdeckung oder spätere Erweiterung.')))
 for r in new:
  if 'id' in r and not any(x['id']==r['id'] for x in records):records.append(r)
 catalogue.write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n')
 research=ROOT/'content/research/2026-10-03';research.mkdir(exist_ok=True)
 (research/'expansion-4.json').write_text(json.dumps(new,ensure_ascii=False,indent=2)+'\n')
 (OUT/'README.md').write_text('''# Originale Vektorgrafiken der vierten Erweiterung

20 Motive, je als Karte (720×540, 4:3) und Detail (960×540, 16:9). Freie stilisierte Symbole unter CC0-1.0, erstellt mit scripts/build-expansion-4.py. Keine Fotos, exakten Karten oder technischen Sondenmodelle. Keine Zahlen oder Antworten in den Motiven.

Der zentrale Motivbereich bleibt innerhalb x=170…550 und y=100…435 im Kartenkoordinatensystem; die Detailversion zentriert denselben Inhalt. Elementsymbole sind groß gesetzt. Namen stehen im Spieltext und nicht als winzige Grafikbeschriftung. SVGs werden in beiden Spielansichten mit object-fit:contain dargestellt.
''')
 print('44 new sourced facts and 20 illustrated subjects; 40 SVG variants')

if __name__=='__main__':build()
