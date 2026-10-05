"""Assign themes and deterministic, reusable sets without inventing questions."""
from collections import defaultdict
import re

def theme(q,game):
    if q.get('subcategory'): return q['subcategory']
    text=' '.join(str(q.get(k,'')) for k in ('metric','u','q','s','cat'))
    edition=re.search(r'(?:FIFA|FC)\s*\d{2}',text)
    if edition:return edition.group()
    for pattern,label in [(r'Geburtsjahr|Gründungsjahr|Eröffnung|Baubeginn|Startjahr','Geschichte & Jahreszahlen'),(r'Ordnungszahl|Protonen|Elementsymbol','Elemente'),(r'Temperatur|Dichte|Gravitation|Geschwindigkeit','Physikalische Größen'),(r'Rotation|Umlauf|Sonnenentfernung','Bahnen & Rotation'),(r'Fläche|Gipfel|Höhe.*Punkt','Flächen & Landschaften'),(r'Motor|Drehmoment|Zylinder|Hubraum|Radstand|Fahrzeuglänge|Beschleunigung','Technik & Abmessungen'),(r'Mario|Luigi|Peach|Bowser|Toad|Daisy','Super Mario'),(r'Pokémon|Pikachu|Bisasam','Pokémon'),(r'Zelda|Hyrule|Link','Zelda'),(r'Transfer|wechselte','Historische Wechsel'),(r'Schach|Sudoku|gewinnt','Brettspiele & Rätsel')]:
        if re.search(pattern,text,re.I):return label
    return {'moreless':'Werte & Vergleiche','estimate':'Zahlen & Schätzungen','facts':'Wissen & Hintergründe','jeopardy':'Wissen & Hintergründe'}[game]

def annotate(pack):
    for game in ['moreless','estimate','facts','jeopardy']:
        cats=defaultdict(list)
        for q in pack[game]:
            q['subcategory']=theme(q,game);cats[q['cat']].append(q)
        for cat,rows in cats.items():
            groups=defaultdict(list)
            for q in rows:groups[q['subcategory']].append(q)
            # A theme must provide a complete five-question round. Tiny numeric
            # groups join the broad overview; individual measures remain explicit.
            if game in ('moreless','estimate'):
                small=[q for group in groups.values() if len(group)<5 for q in group]
                if small:
                    largest=max(groups,key=lambda k:len(groups[k]))
                    if len(small)<5:small+=groups[largest]
                    for q in small:q['subcategory']='Überblick & neue Perspektiven'
                groups=defaultdict(list)
                for q in rows:groups[q['subcategory']].append(q)
            for sub,pool in groups.items():
                for q in pool:q['sets']=[]
                explicit=defaultdict(list)
                for q in pool:
                    if q.get('set'):explicit[q['set']].append(q)
                for label,items in explicit.items():
                    if len(items)>=5:
                        for q in items:q['sets'].append(label)
                chunks=[pool[i:i+10] for i in range(0,len(pool),10)]
                if len(chunks)>1 and len(chunks[-1])<5:tail=chunks.pop();chunks[-1]+=tail
                if len(chunks)==1 and 5<len(pool)<10:
                    chunks=[pool[:5],pool[-5:]]
                for i,items in enumerate(chunks):
                    if len(items)<5:continue
                    label=f'{sub} · Set {i+1}'
                    for q in items:q['sets'].append(label)
    return pack
