"""Three original synthesizer/drum compositions. Deterministic, no samples or copied tunes."""
from pathlib import Path
import numpy as np
import wave, subprocess, tempfile
RATE=22050
TRACKS=[('night-drive',124,0),('pixel-riot',144,1),('moon-bounce',108,2)]
def build(name,bpm,style):
 beat=60/bpm;length=64*beat;n=int(length*RATE);mix=np.zeros((n,2));rng=np.random.default_rng(20261005+style)
 def add(x,start,level=.1,pan=0):
  indices=(np.arange(len(x))+int(start*RATE))%n
  mix[indices,0]+=x*level*(1-pan*.5);mix[indices,1]+=x*level*(1+pan*.5)
 def tone(note,start,duration,level=.1,pan=0,kind='pluck'):
  t=np.arange(int(duration*RATE))/RATE;f=440*2**((note-69)/12)
  wave_=np.sin(2*np.pi*f*t)
  if kind=='bass': wave_+=.25*np.sin(4*np.pi*f*t)+.12*np.sin(6*np.pi*f*t)
  elif kind=='pluck': wave_+=.23*np.sin(6*np.pi*f*t)*np.exp(-t*10)
  elif kind=='fm': wave_=np.sin(2*np.pi*f*t+2*np.sin(2*np.pi*f*2.01*t)*np.exp(-t*6))
  else: wave_+=.16*np.sin(2*np.pi*f*1.003*t)
  env=np.minimum(t/.008,1)*np.minimum((duration-t)/.05,1)*np.exp(-t/(.22 if kind in ('pluck','fm') else .65))
  add(wave_*env,start,level,pan)
 def drum(kind,start,level=1):
  dur={'kick':.26,'snare':.17,'hat':.055}[kind];t=np.arange(int(dur*RATE))/RATE
  if kind=='kick':x=np.sin(2*np.pi*(46*t+55*.035*(1-np.exp(-t/.035))))*np.exp(-t*18)
  else:
   noise=rng.normal(0,.4,len(t));high=noise-np.roll(noise,1)
   x=(high*np.exp(-t*(65 if kind=='hat' else 24)))
   if kind=='snare':x+=.3*np.sin(2*np.pi*180*t)*np.exp(-t*24)
  add(x,start,.17*level,(-.3 if kind=='hat' else 0))
 roots=([45,48,43,41] if style==0 else [40,43,45,38] if style==1 else [46,41,44,39])
 motif=([0,7,12,10,7,3,5,7] if style==0 else [12,0,7,15,10,7,19,3] if style==1 else [0,10,7,3,14,5,12,7])
 for bar in range(16):
  root=roots[(bar//2)%4];start=bar*4*beat
  for j in range(8):
   at=start+j*.5*beat
   if style==0 or j in ([0,3,4,6] if style==1 else [0,3,5]):drum('kick',at,.9 if j%2==0 else .6)
   if j in [2,6]:drum('snare',at,.7)
   drum('hat',at+(.08*beat if style==2 and j%2 else 0),.55 if j%2 else .3)
   tone(root,at,(.35 if style==1 else .46)*beat,.11,kind='bass')
   note=root+24+motif[(j+bar%3)%8]
   if bar%4!=3 or j%2==0:tone(note,at+(beat*.125 if style==2 else 0),beat*.34,.065,(-.45 if j%2 else .45),kind='fm' if style==2 else 'pluck')
   if style==1 and bar%4==3:drum('snare',at+.25*beat,.25)
  if bar%2==0:
   for interval in [0,3,7,14]:tone(root+12+interval,start,7.8*beat,.025,pan=(interval-7)/14,kind='pad')
 # Short ping-pong delay, circular by design for seamless bar loops.
 dry=mix.copy();mix[:,0]+=.18*np.roll(dry[:,1],int(beat*.75*RATE));mix[:,1]+=.18*np.roll(dry[:,0],int(beat*1.25*RATE))
 mix=np.tanh(mix*1.4);mix*=.60/max(np.max(np.abs(mix)),1e-6)
 pcm=(mix*32767).astype('<i2');out=Path('assets/audio/'+name+'.mp3')
 with tempfile.NamedTemporaryFile(suffix='.wav') as temp:
  with wave.open(temp.name,'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(RATE);w.writeframes(pcm.tobytes())
  subprocess.run(['ffmpeg','-y','-loglevel','error','-i',temp.name,'-codec:a','libmp3lame','-b:a','128k','-metadata','title='+name,'-metadata','comment=Original procedural composition; no external samples',str(out)],check=True)
 print(name,bpm,round(length,2),out.stat().st_size)
for track in TRACKS:build(*track)
