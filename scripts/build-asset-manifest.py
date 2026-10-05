"""Hash public assets; retain unchanged device caches across content releases."""
import hashlib,json,re
from urllib.parse import urlsplit,parse_qsl,urlencode
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
paths=[p for p in (ROOT/'assets').rglob('*') if p.is_file() and p.suffix in ('.js','.mjs','.css','.svg','.webp') and p.name!='asset-manifest.js']
paths.append(ROOT/'content/approved.js')
revisions={str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest()[:16] for p in sorted(paths)}
images=[name for name in revisions if name.endswith(('.svg','.webp'))]
size=sum((ROOT/name).stat().st_size for name in images)
manifest='const ASSET_REVISIONS='+json.dumps(revisions,separators=(',',':'))+';\nconst IMAGE_ASSETS='+json.dumps(images,separators=(',',':'))+';\n'
(ROOT/'assets/asset-manifest.js').write_text(manifest)
# Every HTML reference carries its content hash. Even an older active worker
# sees a cache miss immediately when fresh HTML references a changed script.
def reference(match):
    attr,url=match.groups();parsed=urlsplit(url);revision=revisions.get(parsed.path)
    if not revision:return match.group()
    query=[(k,v) for k,v in parse_qsl(parsed.query) if k!='rev']+[("rev",revision)]
    return attr+'="'+parsed.path+'?'+urlencode(query)+'"'
html=re.sub(r'(src|href)="((?:assets|content)/[^"]+)"',reference,(ROOT/'index.html').read_text())
(ROOT/'index.html').write_text(html)
(ROOT/'offline/index.html').write_text(html.replace('src="assets/','src="../assets/').replace('href="assets/','href="../assets/').replace('src="content/','src="../content/'))
print(f'{len(revisions)} public assets; {len(images)} images; {size/1e6:.1f} MB optional image download')
if __name__=='__main__':pass

# Generate the complete offline snapshot only after HTML references are final.
import runpy
runpy.run_path(str(ROOT/'scripts/build-pwa-manifest.py'))
