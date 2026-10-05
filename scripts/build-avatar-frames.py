"""Original vector ornaments: transparent centres, no fonts or bitmap downloads."""
from pathlib import Path
from math import sin, cos, radians
import hashlib,json,re

ROOT = Path(__file__).resolve().parents[1]
PALETTES = {
 'starter':('#93b7df','#edf5ff','#355171'), 'neon':('#68e6ff','#e7b6ff','#593db0'),
 'emerald':('#61e3b1','#dcfff0','#167c64'), 'gold':('#e4b657','#fff1b2','#895522'),
 'plasma':('#d472ff','#ffe0fa','#792da1'), 'ice':('#8edbff','#efffff','#3382b8'),
 'sunset':('#ff9564','#ffe5a6','#b93764'), 'stars':('#afa7ff','#f5edff','#4946a2'),
 'obsidian':('#8792ac','#e8edfa','#333447'), 'laurel':('#d3b965','#fff3bc','#6b6134'),
 'aurora':('#6cf0c3','#deb9ff','#4264ac'), 'dragon':('#ef8168','#ffe5b0','#812e35'),
 'coral':('#ffa4b6','#ffe9df','#a8416c'), 'prism':('#88c9ff','#fff0ff','#8769c2'),
 'david':('#85baff','#edf5ff','#375d9e'), 'kippa':('#85baff','#edf5ff','#375d9e'),
 'cross':('#e0bf75','#fff2bf','#8b602e'), 'thorns':('#b5bf8a','#edf0c6','#66744b'),
 'ufo':('#6ef2b5','#dfffee','#287b65'), 'toast':('#e7ad68','#ffebc3','#986438'),
 'potato':('#dbb379','#fbe3b3','#967047'), 'rocket':('#7bcaff','#e8f8ff','#39689f')}

def svg_frame(key, p):
 a,b,c=p
 pieces=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><defs><linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="{b}"/><stop offset=".25" stop-color="{a}"/><stop offset=".55" stop-color="{c}"/><stop offset=".8" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></linearGradient></defs>',
 '<circle cx="80" cy="80" r="59" fill="none" stroke="#07101e" stroke-width="12"/>',
 '<circle cx="80" cy="80" r="59" fill="none" stroke="url(#metal)" stroke-width="6"/>',
 f'<circle cx="80" cy="80" r="54.5" fill="none" stroke="{b}" stroke-opacity=".65" stroke-width="1"/>',
 f'<path d="M37 38a60 60 0 0 1 82 0" fill="none" stroke="{b}" stroke-width="1.5" opacity=".8"/>']
 def path(d,fill='none',stroke=a,w=2):
  pieces.append(f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{w}" stroke-linejoin="round" stroke-linecap="round"/>')
 def circle(x,y,r,fill=a):pieces.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}"/>')
 def diamond(x,y,r=5):path(f'M{x} {y-r}l{r} {r}l-{r} {r}l-{r} -{r}z',b,c,1)
 def crown():
  path('M58 22l-3-15 14 7L80 2l11 12 14-7-3 15z','url(#metal)',c,1.5)
  path('M59 25h42',b,c,1);diamond(80,16,4)
 def laurels():
  for side in [-1,1]:
   path(f'M{80+side*19} 142Q{80+side*73} 124 {80+side*62} 64','none',a,1.5)
   for i in range(7):
    y=130-i*9;x=80+side*(35+20*sin(i/7*3.14))
    path(f'M{x:.1f} {y}q{side*17} -2 {side*7} -13q{-side*11} 4 {-side*7} 13z','url(#metal)',c,.6)
 if key in ['starter','neon','emerald','obsidian','prism','aurora']:
  pieces.append(f'<circle cx="80" cy="80" r="65" fill="none" stroke="{a}" stroke-width="1" opacity=".6" stroke-dasharray="26 10"/>')
  for deg in [45,135,225,315]:
   x=round(80+65*cos(radians(deg)),2);y=round(80+65*sin(radians(deg)),2);diamond(x,y,3 if key=='starter' else 5)
  if key=='emerald':
   for deg in range(0,360,90):
    x=round(80+59*cos(radians(deg)),2);y=round(80+59*sin(radians(deg)),2);diamond(x,y,6)
  if key=='obsidian':path('M64 21L80 8l16 13-16 10z','url(#metal)',c);path('M69 21l11-8 11 8',b,c,1)
  if key=='prism':
   for i,col in enumerate(['#faacdc','#aab4ff','#85e3ee','#f9dca6']):
    pieces.append(f'<circle cx="80" cy="80" r="62" fill="none" stroke="{col}" stroke-width="3" stroke-dasharray="65 325" transform="rotate({i*90-85} 80 80)"/>')
  if key=='aurora':
   path('M22 61Q37 7 85 17Q134 13 143 66','none','#89efd6',2)
   path('M18 75Q14 128 65 144Q125 159 143 100','none','#b6a2ff',2)
 elif key in ['gold','plasma','laurel']:
  laurels()
  if key!='laurel':crown()
  else:diamond(80,20,9)
  diamond(80,141,5)
 elif key=='ice':
  for deg in range(0,360,45):
   x=round(80+64*cos(radians(deg)),1);y=round(80+64*sin(radians(deg)),1)
   pieces.append(f'<g transform="translate({x} {y}) rotate({deg})"><path d="M-8 0h16M0-8v16M-5-5l10 10M-5 5l10-10" stroke="{a}" stroke-width="1.5"/><circle r="2" fill="{b}"/></g>')
 elif key=='sunset':
  path('M61 23a19 19 0 0 1 38 0z','url(#metal)',c)
  for x,y in [(58,12),(65,6),(80,3),(95,6),(102,12)]:path(f'M{x} {y}l0 -3','none',a,1.5)
  path('M48 135q32 12 64 0M58 141q22 8 44 0','none',a,1.5)
 elif key=='stars':
  for x,y,r in [(29,42,5),(120,32,6),(142,83,4),(40,133,5),(80,16,7),(112,140,3)]:
   path(f'M{x} {y-r}l2 {r-2}l{r-2} 2l-{r-2} 2l-2 {r-2}l-2 -{r-2}l-{r-2} -2l{r-2} -2z',b,a,1)
  for x,y in [(17,74),(128,120),(53,18),(92,148)]:circle(x,y,1.5,b)
 elif key=='dragon':
  for side in [-1,1]:
   pieces.append(f'<g transform="translate({80+side*62} 79) scale({side} 1)">')
   path('M0 26Q15 15 8-1L18-22l-18 8L-8-24L-9 5z','url(#metal)',c)
   circle(2,-7,2,b);pieces.append('</g>')
  path('M65 24l7-14 8 10 8-10 7 14','url(#metal)',c)
 elif key=='coral':
  for side in [-1,1]:
   x=80+side*62
   path(f'M{x} 112q{-side*13} -35 {side*5} -59m{-side*4} 24l{side*14} -13m{-side*14} 13l{-side*9} -14m{side*6} 29l{side*11} -8','none',a,3)
  for x,y in [(42,32),(115,133),(80,142)]:circle(x,y,3,b)
 elif key=='david':
  path('M80 2l14 24H66z','none',b,2.5);path('M80 34L66 10h28z','none',a,2.5)
 elif key=='kippa':
  path('M55 21Q80-11 105 21Q80 33 55 21','url(#metal)',c)
  path('M64 20Q80 1 96 20M80 8v16','none',b,1);circle(80,8,1.8,b)
 elif key=='cross':
  path('M75 2h10v9h9v9h-9v13H75V20h-9v-9h9z','url(#metal)',c,1.5)
  laurels()
 elif key=='thorns':
  for deg in range(0,360,30):
   pieces.append(f'<g transform="rotate({deg} 80 80)">')
   path('M72 20l4-9 4 10 8-4-3 8','none',a,2);pieces.append('</g>')
  path('M22 79a58 58 0 1 1 116 0','none',c,2)
 elif key=='ufo':
  path('M68 15Q80-4 92 15','url(#metal)',c)
  pieces.append(f'<ellipse cx="80" cy="18" rx="26" ry="8" fill="url(#metal)" stroke="{c}"/>')
  for x in [64,74,86,96]:circle(x,19,2,b)
  path('M72 27l-8 13m16-12v15m8-16 8 13','none',a,1.5)
 elif key=='toast':
  path('M61 32V17C45-2 115-2 99 17v15z','url(#metal)',c)
  path('M67 26V17q13-13 26 0v9z',b,a,1)
  circle(73,17,1.8,c);circle(87,17,1.8,c);path('M76 22q4 4 8 0','none',c,1.5)
 elif key=='potato':
  path('M62 21Q59 4 75 4Q99-1 101 17Q108 31 86 34Q66 34 62 21z','url(#metal)',c)
  for x,y in [(70,12),(91,9),(97,24)]:circle(x,y,1.5,c)
  circle(75,19,2,c);circle(87,19,2,c);path('M77 25q4 3 8-1','none',c,1.5)
 elif key=='rocket':
  path('M74 28l6 12 6-12','#ffb669','#bc6646',1)
  path('M72 22l-8 10 10-3m14-7 8 10-10-3','url(#metal)',c)
  path('M73 28V15Q80-7 87 15v13z','url(#metal)',c)
  circle(80,15,4,c);circle(80,15,2,b)
 pieces.append('</svg>')
 return ''.join(pieces)

for key,palette in PALETTES.items():
 (ROOT/'assets/frames'/f'{key}.svg').write_text(svg_frame(key,palette))
print(f'{len(PALETTES)} original SVG frames')

# Content hashes also refresh previously downloaded ornaments immediately.
p=ROOT/'assets/cosmetics.js'
revisions={'frame-'+key:hashlib.sha256((ROOT/'assets/frames'/f'{key}.svg').read_bytes()).hexdigest()[:16] for key in PALETTES}
line=' const frameRevisions='+json.dumps(revisions,separators=(',',':'))+';'
s=p.read_text()
if ' const frameRevisions=' in s:s=re.sub(r' const frameRevisions=[^\n]+',lambda _:line,s)
else:s=s.replace(' function style(',line+'\n function style(')
p.write_text(s)
