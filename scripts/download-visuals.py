import concurrent.futures,html,io,json,re,subprocess,urllib.parse
from pathlib import Path
from PIL import Image,ImageOps
ROOT=Path(__file__).resolve().parents[1]
s=(ROOT/'index.html').read_text();a=s.index('const VISUAL_IMG={');b=s.index('};',a)
items=dict(re.findall(r"'([^']+)':'([^']+)'",s[a:b]))
overrides={
 'Blauwal':'Blue Whale 001 noaa body color.jpg',
 'Gorilla':'Gorilla gorilla gorilla 01.jpg',
 'Eiffelturm':'Eiffel Tower in 2022 02.jpg',
 'Burj Khalifa':'Burj Khalifa Dubai, UAE at Sunset 001 by Eric Chamchoum.jpg',
 'Strauß':'Ostrich Etosha pan.jpg',
 'Grönland':'Greenland.A2003233.1340.250m.jpg',
 'Marathondistanz':'Berlin-Marathon 2015 Runners 14.jpg',
 'Olympischer Triathlon':'The Human Race triathlon - swimming - geograph.org.uk - 1309697.jpg',
 'Tasten Klavier':'Piano-keyboard.jpg',
 'Standard-Klavier Tasten':'Piano-keyboard.jpg',
 'Karten Skatblatt':'Skat-Stich.JPG',
 'Karten Pokerblatt':'Cards -Deck Playing.jpg',
 'Indischer Ozean':'Indian Ocean-CIA WFB Map.png',
 'Fußballfeld Länge':'Football pitch small.png',
 'Australien':'Flag of Australia.svg',
 'Brasilien':'Flag of Brazil.svg',
 'Mexiko':'Flag of Mexico.svg',
}
for name,url in items.items():overrides.setdefault(name,urllib.parse.unquote(url.split('/Special:FilePath/')[1].split('?')[0]))
titles=sorted(set(overrides.values()));metadata={}
for start in range(0,len(titles),35):
 p=urllib.parse.urlencode({'action':'query','format':'json','titles':'|'.join('File:'+x for x in titles[start:start+35]),'prop':'imageinfo','iiprop':'url|size|extmetadata','iiurlwidth':700})
 raw=subprocess.check_output(['curl','-fsSL','--max-time','40','-A','Mozilla/5.0','https://commons.wikimedia.org/w/api.php?'+p])
 for page in json.loads(raw)['query']['pages'].values():metadata[page['title'][5:]]=page
bad=[x for x in titles if 'imageinfo' not in metadata.get(x,{})]
if bad:print('MISSING',bad)
valid={k:v for k,v in overrides.items() if v not in bad}
out=ROOT/'assets'/'visuals';out.mkdir(parents=True,exist_ok=True)
def slug(name):
 import unicodedata
 return re.sub(r'[^a-z0-9]+','-',unicodedata.normalize('NFKD',name).encode('ascii','ignore').decode().lower()).strip('-')
def download(item):
 name,title=item;path=out/(slug(name)+'.webp')
 if path.exists():return name,title,path.stat().st_size,Image.open(path).size
 url='https://commons.wikimedia.org/w/thumb.php?'+urllib.parse.urlencode({'f':title,'width':700})
 for attempt in range(3):
  try:
   data=subprocess.check_output(['curl','-fsSL','--retry','2','--max-time','45','-A','Mozilla/5.0',url],stderr=subprocess.DEVNULL)
   im=Image.open(io.BytesIO(data));im=ImageOps.exif_transpose(im).convert('RGB');im.thumbnail((700,700));im.save(path,'WEBP',quality=78,method=5)
   return name,title,path.stat().st_size,im.size
  except Exception as e:err=str(e)
 return name,title,0,err
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:results=list(pool.map(download,valid.items()))
for name,title,size,dim in results:print(('OK' if size else 'FAIL'),name,size,dim)
missing=[name for name,title,size,dim in results if not size]
valid={k:v for k,v in valid.items() if k not in missing}
(out/'manifest.json').write_text(json.dumps(valid,ensure_ascii=False,indent=2))
rows=[]
for name,title in valid.items():
 info=metadata[title]['imageinfo'][0];meta=info.get('extmetadata',{});get=lambda k:html.unescape(re.sub('<[^>]+>','',meta.get(k,{}).get('value',''))).strip()
 rows.append((name,title,get('Artist'),get('LicenseShortName'),get('LicenseUrl')))
html_rows='\n'.join('<tr><td>'+html.escape(name)+'</td><td><a href="https://commons.wikimedia.org/wiki/File:'+urllib.parse.quote(title.replace(' ','_'))+'">'+html.escape(title)+'</a></td><td>'+html.escape(author)+'</td><td><a href="'+html.escape(license_url,quote=True)+'">'+html.escape(license_name)+'</a></td></tr>' for name,title,author,license_name,license_url in rows)
(out/'credits.html').write_text('<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bildnachweise</title><style>body{font:16px/1.5 system-ui;max-width:1000px;margin:auto;padding:24px;background:#101725;color:#fff}a{color:#bcb1ff}table{border-collapse:collapse;width:100%}td,th{padding:8px;border-bottom:1px solid #444;text-align:left}</style><h1>Bildnachweise</h1><p>Die Bilder wurden für die Spielkarten verkleinert. Quelle, Urheber und Lizenz stehen pro Bild in der Tabelle.</p><table><tr><th>Motiv</th><th>Quelle</th><th>Urheber</th><th>Lizenz</th></tr>'+html_rows+'</table></html>')
print('TOTAL',len(valid),'bytes',sum(x[2] for x in results),'missing',missing)
