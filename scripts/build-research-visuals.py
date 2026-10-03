#!/usr/bin/env python3
"""Rebuild original, answer-free SVG illustrations for the research batch."""
from pathlib import Path
from html import escape
OUT=Path(__file__).resolve().parents[1]/'assets/visuals/research'
def svg(name,body,label):
    OUT.mkdir(parents=True,exist_ok=True)
    (OUT/(name+'.svg')).write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 540" role="img"><title>'+escape(label)+'</title><rect width="720" height="540" fill="#122238"/>'+body+'</svg>')
def build():
    svg('at','<path fill="#ed2939" d="M80 90h560v360H80z"/><path fill="#fff" d="M80 210h560v120H80z"/>','Flagge Österreich')
    svg('ch','<path fill="#d52b1e" d="M180 90h360v360H180z"/><path fill="#fff" d="M320 150h80v80h80v80h-80v80h-80v-80h-80v-80h80z"/>','Flagge Schweiz')
    svg('be','<path fill="#111" d="M90 90h180v360H90z"/><path fill="#fdda24" d="M270 90h180v360H270z"/><path fill="#ef3340" d="M450 90h180v360H450z"/>','Flagge Belgien')
    svg('football','<circle cx="360" cy="270" r="150" fill="#eee"/><path d="M360 180l85 62-33 100H308l-33-100z" fill="#24364c"/><path d="M230 196l45 46m-16 147l49-47m104 0l49 47m-16-147l45-46M360 180v-60" stroke="#24364c" stroke-width="10"/>','Fußball')
    svg('basketball','<circle cx="360" cy="270" r="150" fill="#e88330"/><g fill="none" stroke="#442715" stroke-width="9"><circle cx="360" cy="270" r="150"/><path d="M210 270h300M360 120v300M260 160q200 110 0 220M460 160q-200 110 0 220"/></g>','Basketball')
    svg('volleyball','<circle cx="360" cy="270" r="150" fill="#f7cf49"/><g fill="none" stroke="#2b68a2" stroke-width="35"><path d="M235 190q110-75 260 95M225 330q30-150 140-205M370 410q125-75 120-240"/></g>','Hallenvolleyball')
    for ident,symbol,label,color in [('carbon','C','Kohlenstoff','#8ed5b1'),('oxygen','O','Sauerstoff','#93c2f7'),('iron','Fe','Eisen','#d5a893')]:
        svg(ident,f'<rect x="180" y="90" width="360" height="360" rx="35" fill="{color}"/><text x="360" y="320" text-anchor="middle" fill="#122238" font-family="sans-serif" font-weight="bold" font-size="180">{symbol}</text>',label)
    svg('set','<rect x="200" y="100" width="180" height="300" rx="22" fill="#fff" transform="rotate(-12 290 250)"/><rect x="340" y="130" width="180" height="300" rx="22" fill="#fff" transform="rotate(12 430 280)"/><path d="M255 220l45-65 45 65-45 65z" fill="#9861c7"/><ellipse cx="425" cy="280" rx="50" ry="85" fill="none" stroke="#37a66c" stroke-width="8"/>','Symbolkarten als Illustration zu SET, kein vollständiges Deck')
    svg('uno','<rect x="200" y="100" width="190" height="300" rx="22" fill="#ef5252" transform="rotate(-12 295 250)"/><rect x="330" y="135" width="190" height="300" rx="22" fill="#4c8ce5" transform="rotate(12 425 285)"/><ellipse cx="425" cy="285" rx="60" ry="100" fill="#fff"/><path d="M390 285h70m-24-24l24 24-24 24" stroke="#4c8ce5" stroke-width="14" fill="none"/>','Farbkarten als Illustration zu UNO, kein vollständiges Deck')
    for distance in [400,800,1500]:
        svg(str(distance)+'m',f'<rect x="90" y="145" width="540" height="285" rx="140" fill="#b75245"/><g fill="none" stroke="#f5ded1" stroke-width="4"><rect x="110" y="165" width="500" height="245" rx="120"/><rect x="135" y="190" width="450" height="195" rx="95"/><rect x="160" y="215" width="400" height="145" rx="70"/></g><rect x="185" y="240" width="350" height="95" rx="45" fill="#3f8265"/><text x="360" y="303" font-family="sans-serif" font-size="42" text-anchor="middle" fill="#fff">{distance} m</text>','Laufbahn '+str(distance)+' Meter, keine Rekordzeit')
    svg('sputnik','<g stroke="#c6dbed" stroke-width="8"><path d="M335 255L100 85M340 280L90 400M370 285l230 160M385 260L620 130"/></g><circle cx="360" cy="270" r="95" fill="#a5bccb"/><path d="M300 205q80-35 120 20" fill="none" stroke="#e7f1f8" stroke-width="16"/>','Sputnik 1, schematische Illustration')
    svg('hubble','<path d="M105 180h180v180H105zM435 180h180v180H435z" fill="#3b6893" stroke="#94b9d9" stroke-width="6"/><path d="M165 180v180m60-180v180m270-180v180m60-180v180" stroke="#94b9d9" stroke-width="4"/><rect x="285" y="135" width="150" height="290" rx="45" fill="#c8d5dc"/><ellipse cx="360" cy="155" rx="60" ry="28" fill="#263a50"/><path d="M305 375h110" stroke="#9badba" stroke-width="16"/>','Hubble-Weltraumteleskop, schematische Illustration')
    # A mirror symbol and sunshield, deliberately a schematic rather than a technical diagram.
    svg('webb','<path d="M170 345l190-80 190 80-190 95z" fill="#c7c9de" stroke="#9da7c4" stroke-width="5"/><path d="M190 360l170-70 170 70-170 65z" fill="#e6e5ee"/><path d="M360 320V170" stroke="#d0d8e3" stroke-width="10"/><path d="M285 130h150l75 110-75 110H285l-75-110z" fill="#d4b263" stroke="#f5dba2" stroke-width="9"/><path d="M285 130l75 110 75-110M210 240h300M285 350l75-110 75 110" stroke="#7f6c49" stroke-width="5"/>','James Webb, schematisches Symbol mit Spiegel und Sonnenschild')
if __name__=='__main__':build()
