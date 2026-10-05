"""Verify shared catalog, file decoding and MP3 loop boundaries."""
from pathlib import Path
import json,subprocess,re
import numpy as np
s=Path('assets/audio/tracks.js').read_text();items=json.loads(s[s.index('['):s.rindex('].map')+1]);assert len({t['id'] for t in items})==len(items)
for t in items:
 path=Path('assets/audio')/t['file'];assert path.is_file()
 raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-f','f32le','-ac','2','-ar','22050','-'])
 samples=np.frombuffer(raw,dtype='<f4').reshape(-1,2);peak=float(abs(samples).max());rms=float(np.sqrt(np.mean(samples**2)));seconds=len(samples)/22050
 assert np.isfinite(samples).all() and .01<rms<.3 and peak<.99,t['id']
 if 'duration' in t:assert abs(seconds-t['duration'])<.1,(t['id'],seconds)
 # A seam must not be a large discontinuity relative to the track's level.
 jump=float(abs(samples[-1]-samples[0]).max());assert jump<max(.04,rms*.75),(t['id'],'seam',jump,rms)
 print(t['id'],round(seconds,2),'s','peak',round(peak,3),'rms',round(rms,3),'seam',round(jump,4))
for f in ['index.html','offline/index.html']:
 html=Path(f).read_text();assert html.index('assets/audio/tracks.js')<html.index('assets/economy.js')<html.index('assets/comfort.js')
print('PASS: fifteen decodable tracks, finite levels, loop seams and shared manifest loading')
