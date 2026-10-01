#!/usr/bin/env python3
"""Original answer-free SVG symbols for the second research expansion."""
from pathlib import Path
from html import escape
OUT=Path(__file__).resolve().parents[1]/'assets/visuals/research-2'
ELEMENTS=[('hydrogen','H','Wasserstoff'),('helium','He','Helium'),('nitrogen','N','Stickstoff'),('neon','Ne','Neon'),('sodium','Na','Natrium'),('magnesium','Mg','Magnesium'),('aluminium','Al','Aluminium'),('silicon','Si','Silizium'),('sulfur','S','Schwefel'),('chlorine','Cl','Chlor'),('calcium','Ca','Calcium'),('copper','Cu','Kupfer')]
def svg(ident,body,label):
 OUT.mkdir(parents=True,exist_ok=True)
 (OUT/(ident+'.svg')).write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 540" role="img"><title>'+escape(label)+'</title><rect width="720" height="540" fill="#122238"/>'+body+'</svg>')
def build():
 for i,(ident,symbol,name) in enumerate(ELEMENTS):
  color=['#8ed5b1','#93c2f7','#d5a893','#dccb91'][i%4]
  svg(ident,f'<rect x="180" y="90" width="360" height="360" rx="35" fill="{color}"/><text x="360" y="320" text-anchor="middle" fill="#122238" font-family="sans-serif" font-weight="bold" font-size="165">{symbol}</text>',name+' – Elementsymbol ohne Ordnungszahl')
 svg('handball','<circle cx="360" cy="270" r="145" fill="#6eb8d7"/><path d="M360 180l85 62-33 100H308l-33-100z" fill="#f3d282"/><path d="M230 190l45 52m-15 147l48-47m104 0l48 47m-15-147l45-52M360 180v-55" stroke="#eee" stroke-width="12"/>','Hallenhandball – stilisierte Ballillustration')
 svg('rugby','<ellipse cx="360" cy="270" rx="205" ry="105" fill="#ece7d9" transform="rotate(-22 360 270)"/><g fill="none" stroke="#974d3a" stroke-width="8" transform="rotate(-22 360 270)"><path d="M180 270h360M305 245v50m25-50v50m25-50v50m25-50v50m25-50v50"/></g>','Rugby Union – stilisierte Ballillustration')
 svg('hockey','<path d="M270 105l80 245q20 60-50 60h-75" fill="none" stroke="#d7a879" stroke-width="35" stroke-linecap="round"/><path d="M470 100l-80 240q-20 60 50 60h75" fill="none" stroke="#79a2d7" stroke-width="35" stroke-linecap="round"/><circle cx="360" cy="420" r="28" fill="#fff"/>','Feldhockey – Schläger und Ball, kein Eishockey')
 # Launch symbols distinguish missions by text and color, without pretending to show their spacecraft.
 for ident,name,color in [('voyager','Voyager 1','#a9d7f0'),('cassini','Cassini-Huygens','#f0ce8d'),('new-horizons','New Horizons','#9addb2')]:
  svg(ident,f'<circle cx="580" cy="100" r="34" fill="{color}"/><path d="M320 320V180q40-95 80 0v140z" fill="{color}"/><circle cx="360" cy="205" r="23" fill="#122238"/><path d="M320 260l-55 85h55m80-85l55 85h-55" fill="#d5deeb"/><path d="M335 325l25 95 25-95" fill="#ed955d"/><text x="360" y="480" text-anchor="middle" font-family="sans-serif" font-size="36" fill="#fff">{name}</text>',name+' – allgemeines Startsymbol, keine technische Darstellung der Sonde')
 svg('zion','<path d="M50 430V180l110-90 130 30 60 310M670 430V160l-110-70-130 35-60 305" fill="#b97153"/><path d="M290 450l70-150 70 150" fill="#6f926c"/><path d="M360 540q-80-100 0-170" stroke="#91bfd8" stroke-width="30" fill="none"/><text x="360" y="490" text-anchor="middle" font-family="sans-serif" font-size="34" fill="#fff">Zion</text>','Zion – frei gestaltetes Landschaftssymbol, kein Foto oder Geländeplan')
 svg('rocky-mountain','<path d="M30 420l180-265 110 150 90-210 260 325z" fill="#7d91aa"/><path d="M137 262l73-107 63 86-63-25zM370 188l40-93 82 104-82-38z" fill="#edf5f7"/><path d="M0 450q200-80 400 0t320 0v90H0z" fill="#568477"/><text x="360" y="490" text-anchor="middle" font-family="sans-serif" font-size="34" fill="#fff">Rocky Mountain</text>','Rocky Mountain – frei gestaltetes Landschaftssymbol, kein Foto oder Geländeplan')
 svg('olympic','<path d="M0 370l220-230 180 230 130-180 190 180v170H0z" fill="#6f9da1"/><path d="M0 455q200-120 440-10t280-25v120H0z" fill="#395f67"/><g fill="#80b39c"><path d="M125 160l-70 220h140zM555 210l-70 200h140z"/></g><text x="360" y="490" text-anchor="middle" font-family="sans-serif" font-size="34" fill="#fff">Olympic</text>','Olympic – frei gestaltetes Landschaftssymbol, kein Foto oder Geländeplan')
if __name__=='__main__':build()
