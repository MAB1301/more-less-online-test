"""Snapshot public runtime files, including entry HTML, audio and icons."""
from pathlib import Path
import hashlib,json
ROOT=Path(__file__).resolve().parents[1]
paths=[ROOT/'index.html',ROOT/'offline/index.html']
paths += [p for p in (ROOT/'assets').rglob('*') if p.is_file() and p.suffix in ('.html','.js','.mjs','.css','.svg','.png','.webp','.jpg','.jpeg','.mp3','.ogg','.wav','.woff','.woff2','.webmanifest')]
paths += [ROOT/'content'/name for name in ('approved.js','catalogue.json','trivia.json','review-schedule.json')]
files={str(p.relative_to(ROOT)):{'hash':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size} for p in sorted(paths)}
encoded=json.dumps(files,separators=(',',':'),sort_keys=True)
release={'id':hashlib.sha256((encoded+(ROOT/'service-worker.js').read_text()).encode()).hexdigest()[:16],'bytes':sum(item['bytes'] for item in files.values())}
# Full snapshot is installed before activation, so closing all tabs can never
# activate a partially downloaded release. Unchanged bytes come from old caches.
core=list(files)
(ROOT/'pwa-asset-manifest.js').write_text('const PWA_RELEASE='+json.dumps(release,separators=(',',':'))+';\nconst PWA_FILES='+encoded+';\nconst PWA_CORE='+json.dumps(core,separators=(',',':'))+';\n')
print(f"PWA {release['id']}: {len(files)} files, {release['bytes']/1e6:.1f} MB")
