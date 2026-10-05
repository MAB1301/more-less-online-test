"""Broad, additive content release; canonical sources, explicit units and set metadata."""
import itertools, json, re, hashlib
from pathlib import Path
from html import escape
ROOT=Path(__file__).resolve().parents[1]
DATE='2026-10-05'
RESEARCH=ROOT/'content/research/2026-10-05'
SOURCE='https://github.com/MAB1301/more-less-online-test/blob/Main/assets/visuals/expansion-8/README.md'
NPS='https://www.nps.gov/orgs/1207/03-13-26-2025-visitation-statsitics.htm'
RSC='https://periodic-table.rsc.org/element/'
NASA='https://nssdc.gsfc.nasa.gov/planetary/factsheet/'
def number(v): return (str(int(v)) if float(v).is_integer() else str(v)).replace('.',',')
def vector(ident,name,symbol):
    out=ROOT/'assets/visuals/expansion-8';out.mkdir(parents=True,exist_ok=True)
    for kind,w in [('card',720),('detail',960)]:
        svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="540" viewBox="0 0 {w} 540" role="img"><title>{escape(name)} – Elementsymbol</title><rect width="{w}" height="540" fill="#122238"/><rect x="{w/2-180:g}" y="90" width="360" height="360" rx="35" fill="#8ed5b1"/><text x="{w/2:g}" y="320" text-anchor="middle" fill="#122238" font-family="sans-serif" font-weight="bold" font-size="165">{symbol}</text></svg>\n'
        (out/f'{ident}-{kind}.svg').write_text(svg)
    return dict(card=f'expansion-8/{ident}-card.svg',detail=f'expansion-8/{ident}-detail.svg')
def main():
    rows=json.loads((ROOT/'content/catalogue.json').read_text())
    trivia=json.loads((ROOT/'content/trivia.json').read_text())
    for r in rows:r['facts']=[f for f in r['facts'] if f.get('expansion')!=8]
    for kind in ['facts','jeopardy']:trivia[kind]=[q for q in trivia[kind] if q.get('expansion')!=8]
    numeric=[];added_clues=[];added_facts=[]
    def subject(ident,name,variants,generated=False):
        old=next((r for r in rows if r['name']==name),None)
        if old:return old
        r=dict(id=ident,name=name,status='approved',image='../assets/visuals/'+variants['card'],variants=variants,generated=generated,image_source=SOURCE,image_license='AI-generated thematic illustration' if generated else 'CC0-1.0 original vector illustration',facts=[])
        rows.append(r);return r
    def add(name,cat,metric,value,unit,source,question,statement,sub,notes='',verified=DATE):
        r=next(r for r in rows if r['name']==name)
        f=dict(category=cat,metric=metric,value=value,unit=unit,comparison_unit=unit if metric=='Ordnungszahl' else unit+' · '+metric,source=source,verified=verified,estimate_question=question,notes=notes,subcategory=sub,expansion=8)
        r['facts'].append(f);numeric.append(dict(subject=name,**f))
        difficulty=['easy','medium','hard'][(len(numeric)-1)%3]
        for correct in [True,False]:
            wrong=round(value*1.5,2) if not float(value).is_integer() else int(value)+max(2,int(abs(value)*.2))
            s=statement.format(value=number(value if correct else wrong))
            added_facts.append(dict(s=s,a=correct,e=statement.format(value=number(value))+' '+notes,cat=cat,subject=name,source=source,verified=verified,difficulty=difficulty,subcategory=sub,expansion=8))
        jc={'Autos':'Autotechnik','Fußballer':'Fußball','Länder':'Geografie','Städte':'Allgemeinwissen','Natur':'Nationalparks','Sport':'Sportregeln','Bauwerke':'Geschichte','Tierwelt':'Allgemeinwissen','Weltraum':'Planetenkunde','Wissenschaft':'Chemie','Allgemeinwissen':'Mix','Rekorde & Extreme':'Rekorde & Extreme','Weltkultur':'Weltkultur','Raumfahrt':'Raumfahrtmissionen'}[cat]
        answer=number(value)+'|'+f'{value:g}'
        added_clues.append(dict(q=question,a=answer,cat=jc,source=source,verified=verified,difficulty=1+(len(numeric)-1)%5,subject=name,subcategory=sub,expansion=8))
    cars=[('Porsche 911 GT3 (PDK, 2025)',4570,2457,'https://newsroom.porsche.com/dam/jcr%3A92acdfd9-962b-4c3c-a40c-050427b42cc3/pag-911-gt3-pdk-de.pdf'),('Ferrari 296 GTB',4565,2600,'https://www.ferrari.com/content/dam/ferrari-fcom/old/pdf/CS_296_GTB_final_gbr.pdf'),('Ferrari SF90 Stradale',4710,2650,'https://cdn.ferrari.com/cms/network/media/pdf/pr_ferrari_sf90_stradale_gbr.pdf')]
    for name,length,wheelbase,src in cars:
        for metric,val in [('Fahrzeuglänge laut Hersteller',length),('Radstand laut Hersteller',wheelbase)]:
            add(name,'Autos',metric,val,'mm',src,f'Wie groß ist bei {name} die {"Fahrzeuglänge" if "länge" in metric else "Radstandlänge"} laut Hersteller, in Millimetern?',f'{name}: '+('Die Fahrzeuglänge' if 'länge' in metric else 'Der Radstand')+' beträgt laut Hersteller {value} mm.','Abmessungen','Benannte Straßenversion; kein Rennwagen, Spider oder Sondermodell.')
    for name,height,src in [('Kylian Mbappé',178,'https://www.realmadrid.com/en-US/football/first-team/players/kylian-mbappe'),('Jude Bellingham',186,'https://www.realmadrid.com/en-US/football/squad/jude-bellingham'),('Mohamed Salah',175,'https://www.premierleague.com/players/5178/Mohamed-Salah/overview')]:
        add(name,'Fußballer','Körpergröße laut Spielerprofil',height,'cm',src,f'Welche Körpergröße wird für {name} im Spielerprofil angegeben, in Zentimetern?',name+' ist laut Spielerprofil {value} cm groß.','Spielerprofile','Gerundete Angabe des verlinkten Spielerprofils.')
    for name,height,src in [('Österreich',3798,'https://www.nationalpark.at/en/nationalpark'),('Schweiz',4634,'https://www.myswitzerland.com/en-ch/destinations/dufourspitze-4634m-asl/'),('Belgien',694,'https://www.ostbelgien.eu/media/c7847e15-49c0-4bda-afec-f916adc1f80c.pdf')]:
        add(name,'Länder','Höhe des höchsten natürlichen Gipfels',height,'m',src,f'Wie hoch liegt der höchste natürliche Punkt von {name}, gerundet in Metern über dem Meer?',name+': Der höchste natürliche Punkt liegt bei ungefähr {value} m über dem Meer.','Gipfel & Landschaften','Natürlicher Gipfel; künstliche Plattformen und Türme zählen nicht.')
    for name,uni,year,src in [('Berlin','Humboldt-Universität',1810,'https://www.hu-berlin.de/en/about/profile/history'),('Hamburg','Universität Hamburg',1919,'https://www.uni-hamburg.de/en/uhh/profil/geschichte.html'),('Wien','Universität Wien',1365,'https://www.univie.ac.at/en/about-us/')]:
        add(name,'Städte','Stiftungsjahr der benannten Universität',year,'Jahr',src,f'In welchem Jahr wurde die {uni} in {name} gegründet?',f'Die {uni} in {name} wurde im Jahr '+'{value} gegründet.','Universitäten',f'Verglichen wird das Gründungsjahr der {uni}, nicht das Gründungsjahr der Stadt.')
    for name,visits in [('Yellowstone-Nationalpark',4762988),('Yosemite-Nationalpark',4278413),('Grand-Canyon-Nationalpark',4430653)]:
        add(name,'Natur','Registrierte Freizeitbesuche im Kalenderjahr 2025',visits,'Besuche',NPS,f'Wie viele Freizeitbesuche registrierte der {name} laut NPS im gesamten Kalenderjahr 2025?',f'Der {name} registrierte 2025 laut NPS '+'{value} Freizeitbesuche.','Besucherzahlen 2025','Gezählt werden Besuche, nicht unterschiedliche Personen; fester Kalenderjahresstand 2025.')
    for name,length,width,src in [('Basketball',28,15,'https://www.fiba.basketball/documents/official-basketball-rules'),('Hallenvolleyball',18,9,'https://www.fivb.com/volleyball/the-game/official-volleyball-rules/'),('Hallenhandball',40,20,'https://www.ihf.info/regulations-documents/3')]:
        area=length*width
        add(name,'Sport','Fläche des regulären Spielfelds ohne Auslauf',area,'m²',src,f'Wie viele Quadratmeter hat das reguläre {name}-Spielfeld ({length} m × {width} m), ohne Auslaufzone?',f'Das reguläre {name}-Spielfeld ohne Auslaufzone umfasst '+'{value} m².','Spielfeldmaße',f'Berechnet aus {length} × {width} m nach dem benannten Regelwerk; keine Sicherheits- oder Freizone.')
    for name in ['Eiffelturm','Empire State Building','Burj Khalifa']:
        r=next(r for r in rows if r['name']==name)
        a=next(f for f in r['facts'] if f['metric']=='Baubeginn (einschließlich Gründungsarbeiten)')
        b=next(f for f in r['facts'] if f['metric']=='Jahr der offiziellen Eröffnung')
        delta=b['value']-a['value']
        add(name,'Bauwerke','Differenz zwischen Baubeginn- und Eröffnungsjahr',delta,'Kalenderjahre',b['source'],f'Wie viele Kalenderjahre liegen zwischen dem Baubeginnjahr ({a["value"]}) und Eröffnungsjahr ({b["value"]}) von {name}?',f'Bei {name} beträgt die Differenz zwischen Baubeginn- und Eröffnungsjahr '+'{value} Kalenderjahre.','Baugeschichte','Differenz der Jahreszahlen, keine taggenau gemessene Bauzeit.',b['verified'])
        r['facts'][-1]['sources']=[a['source'],b['source']]
    for name,weight,animal in [('Elefant',3600,'elephant'),('Giraffe',680,'giraffe'),('Löwe',180,'lion')]:
        add(name,'Tierwelt','Oberer genannter Körpermassenwert ausgewachsener Weibchen',weight,'kg','https://animals.sandiegozoo.org/animals/'+animal,f'Welchen oberen Körpermassenwert nennt der San Diego Zoo für ausgewachsene {"afrikanische Elefantenweibchen" if name=="Elefant" else "Giraffenweibchen" if name=="Giraffe" else "Löwinnen"}, in Kilogramm?',f'Der San Diego Zoo nennt für ausgewachsene {"afrikanische Elefantenweibchen" if name=="Elefant" else "Giraffenweibchen" if name=="Giraffe" else "Löwinnen"} bis zu '+'{value} kg.','Tiergrößen','Oberer genannter Richtwert für Weibchen; kein Mittelwert oder individueller Gewichtsrekord.')
    for ident,name,value,src in [('moon','Erdmond',1737.4,NASA+'moonfact.html'),('europa','Europa (Jupitermond)',1560.8,NASA+'joviansatfact.html'),('titan','Titan (Saturnmond)',2575,NASA+'saturniansatfact.html')]:
        variants=dict(card=f'expansion-8/{ident}-card.webp',detail=f'expansion-8/{ident}-detail.webp')
        subject('e8-'+ident,name,variants,True)
        add(name,'Weltraum','Mittlerer Mondradius laut NASA',value,'km',src,f'Welchen mittleren Radius hat {name} laut NASA ungefähr, in Kilometern?',f'{name} hat laut NASA einen mittleren Radius von ungefähr '+'{value} km.','Monde','Radius, nicht Durchmesser; mittlerer Radius des jeweiligen Mondes.')
    for ident,name,symbol,value in [('lithium','Lithium','Li',3),('argon','Argon','Ar',18),('nickel','Nickel','Ni',28)]:
        subject('e8-'+ident,name,vector(ident,name,symbol))
        add(name,'Wissenschaft','Ordnungszahl',value,'Protonen',RSC+str(value)+'/'+ident,f'Welche Protonenzahl hat ein Atomkern des Elements {name}?',f'Ein Atomkern von {name} enthält '+'{value} Protonen.','Elemente','Die Ordnungszahl entspricht der Protonenzahl; die Grafik verrät nur das Elementsymbol.')
    for ident,name,value,src in [('chess','Schachbrett',64,'https://handbook.fide.com/chapter/E012023'),('connect4','Vier gewinnt',42,'https://instructions.hasbro.com/en-us/instruction/connect-4-game'),('sudoku','Standard-Sudoku',81,'https://www.sudoku.com/how-to-play/sudoku-rules-for-complete-beginners/')]:
        subject('e8-'+ident,name,dict(card='expansion-8/gaming-card.webp',detail='expansion-8/gaming-detail.webp'),True)
        add(name,'Allgemeinwissen','Felder im vollständigen Standardspielraster',value,'Felder',src,f'Wie viele Felder hat das vollständige Standardraster von {name}?',f'Das vollständige Standardraster von {name} hat '+'{value} Felder.','Brettspiele & Rätsel','Schach: 8×8; Vier gewinnt: 7 Spalten×6 Reihen; Standard-Sudoku: 9×9. Themenbild, keine Abbildung der Lösung.')
    for ident,name,val,src in [('bolt-100','Bolt – 100 m (WM 2009)',9.58,'https://worldathletics.org/athletes/jamaica/usain-bolt-14201847'),('bolt-200','Bolt – 200 m (WM 2009)',19.19,'https://worldathletics.org/athletes/jamaica/usain-bolt-14201847'),('wayde-400','Van Niekerk – 400 m (Olympia 2016)',43.03,'https://worldathletics.org/athletes/south-africa/wayde-van-niekerk-14417677')]:
        subject('e8-'+ident,name,dict(card='expansion-8/athletics-card.webp',detail='expansion-8/athletics-detail.webp'),True)
        add(name,'Rekorde & Extreme','Zeit des benannten historischen Finallaufs',val,'Sekunden',src,f'Welche Zeit lief {name} im benannten Finale, in Sekunden?',f'{name} lief im benannten Finale '+'{value} Sekunden.','Historische Rennen','Historisches Ergebnis der angegebenen Distanz und Veranstaltung; kein Anspruch auf einen unveränderten heutigen Weltrekord.')
    for name,value,ident in [('Petra',26171,326),('Machu Picchu',38160.87,274),('Angkor',40100,668)]:
        add(name,'Weltkultur','UNESCO-Kernfläche ohne Pufferzone',value,'ha',f'https://whc.unesco.org/en/list/{ident}/',f'Welche Kernfläche ohne Pufferzone nennt die UNESCO für die Welterbestätte {name}, in Hektar?',f'Die UNESCO nennt für die Kernfläche von {name} ohne Pufferzone '+'{value} ha.','UNESCO-Flächen','Fläche der gesamten eingetragenen Welterbestätte; kein einzelnes Gebäude. Quellenstand 5. Oktober 2026.')
    for name,value,src in [('New Horizons',478,'https://www.nasa.gov/wp-content/uploads/2015/03/139889main_presskit12_05.pdf'),('Voyager 1',815,'https://science.nasa.gov/mission/voyager/frequently-asked-questions/'),('Hubble-Weltraumteleskop',11110,'https://esahubble.org/about/general/fact_sheet/')]:
        add(name,'Raumfahrt','Masse beim Start laut Quelle, ungefähr',value,'kg',src,f'Welche Masse hatte {name} beim Start laut der angegebenen Quelle ungefähr, in Kilogramm?',f'{name} hatte beim Start laut der angegebenen Quelle ungefähr '+'{value} kg Masse.','Sonden & Teleskope','Startmasse der Sonde/des Teleskops; ohne Trägerrakete. Kein heutiger Resttreibstoffstand.')
    # Additional estimates ask differences of the sourced inputs; never invent new measurements.
    derived=[]
    groups={}
    for f in numeric:groups.setdefault((f['category'],f['metric'],f['unit']),[]).append(f)
    for (cat,metric,unit),values in groups.items():
        for left,right in itertools.combinations(values,2):
            if left['value']==right['value']:continue
            high,low=sorted([left,right],key=lambda x:x['value'],reverse=True)
            prompt=f'Wie groß ist der Unterschied zwischen {high["subject"]} und {low["subject"]} beim Wert „{metric}“, in {unit}?'
            derived.append(dict(q=prompt,a=round(high['value']-low['value'],6),u=unit,subject=high['subject'],cat=cat,source=high['source'],sources=[high['source'],low['source']],verified=DATE,notes='Berechnet als größerer minus kleinerer Quellenwert; '+high['notes'],subcategory=high['subcategory'],expansion=8))
    trivia['estimate']=[q for q in trivia.get('estimate',[]) if q.get('expansion')!=8]+derived
    trivia['facts']+=added_facts
    data=json.loads((RESEARCH/'jeopardy-additions.json').read_text())
    for cat,entry in data.items():
        for i,item in enumerate(entry['questions']):
            q,a,*rest=item
            added_clues.append(dict(q=q,a=a,cat=cat,source=rest[0] if rest else entry['source'],verified=DATE,difficulty=i%5+1,subcategory=entry['subcategory'],set=entry['set'],expansion=8))
    trivia['jeopardy']+=added_clues
    for kind,prompt in [('facts','s'),('jeopardy','q')]:
        keys=[q[prompt].strip().casefold() for q in trivia[kind]]
        assert len(keys)==len(set(keys)),f'Duplicate {kind}'
    RESEARCH.mkdir(parents=True,exist_ok=True)
    (ROOT/'content/catalogue.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
    (ROOT/'content/trivia.json').write_text(json.dumps(trivia,ensure_ascii=False,indent=2)+'\n')
    (RESEARCH/'expansion-8.json').write_text(json.dumps(dict(numeric=numeric,estimate=derived,facts=added_facts,jeopardy=added_clues),ensure_ascii=False,indent=2)+'\n')
    print(f'{len(numeric)} numeric inputs, {len(derived)} difference estimates, {len(added_facts)} facts, {len(added_clues)} Jeopardy clues')
if __name__=='__main__':main()
