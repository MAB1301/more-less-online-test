"""Six original loops and two new synthesizer performances of public-domain scores.
No third-party recordings, samples or contemporary song melodies.
Run from repository root. Requires numpy and ffmpeg; source MIDI is bundled.
"""
from pathlib import Path
import json, struct, wave, subprocess, tempfile
import numpy as np
RATE=22050
TRACKS=[
 ('velvet-cafe','Velvet Café · Lo-Fi',80,60,'Lo-Fi','Warme E-Piano-Akkorde, weicher Bass und ein lockerer Beat.'),
 ('blue-hour','Blue Hour · Ambient',64,80,'Ambient','Ruhige Flächen und langsame Glockentöne, ohne Schlagzeug.'),
 ('palm-pixels','Palm Pixels · Bossa',96,80,'Bossa','Gezupfte Synth-Saiten und synkopierte Percussion.'),
 ('cloud-garden','Cloud Garden · Dream Pop',88,100,'Dream Pop','Schwebende Akkorde, eine helle Melodie und ein sanfter Beat.'),
 ('final-answer','Final Answer · Quiz',112,120,'Quiz','Eigene spannende Quizmusik mit Pulsbass und tickender Percussion.'),
 ('rubber-duck','Rubber Duck Parade · Weird',150,100,'Weird','Verspielter Dreiertakt mit federnden FM-Tönen.'),
 ('satie-lounge','Gymnopédie Lounge · Satie',72,80,'Klassik / Chill','Gymnopédie Nr. 1 · Erik Satie · neue Synth-Piano-Einspielung.'),
 ('elise-afterglow','Elise Afterglow · Beethoven',90,80,'Klassik / Chill','Für Elise · Ludwig van Beethoven · neue Synth-Piano-Einspielung.')]
def midi_notes(path):
 data=Path(path).read_bytes();assert data[:4]==b'MThd';size=int.from_bytes(data[4:8],'big');division=int.from_bytes(data[12:14],'big');assert not division&0x8000
 cursor=8+size;notes=[]
 while cursor<len(data):
  assert data[cursor:cursor+4]==b'MTrk';length=int.from_bytes(data[cursor+4:cursor+8],'big');track=data[cursor+8:cursor+8+length];cursor+=8+length;i=0;tick=0;running=None;active={}
  def var():
   nonlocal i
   value=0
   while True:
    b=track[i];i+=1;value=(value<<7)|(b&127)
    if b<128:return value
  while i<len(track):
   tick+=var();status=track[i]
   if status&128:i+=1
   else:status=running
   if status==255:
    i+=1;count=var();i+=count;continue
   if status in (240,247):count=var();i+=count;continue
   running=status;count=1 if status>>4 in (12,13) else 2;payload=track[i:i+count];i+=count
   if status>>4 not in (8,9):continue
   note,velocity=payload;key=(status&15,note)
   if status>>4==9 and velocity:active[key]=(tick,velocity)
   elif key in active:
    start,vel=active.pop(key);notes.append((note,start/division,(tick-start)/division,vel/127))
 return sorted(notes,key=lambda x:x[1])
def build(index,track):
 name,title,bpm,price,genre,description=track;beat=60/bpm;beats=48 if index in (5,6) else 36 if index==7 else 32;n=round(beats*beat*RATE);mix=np.zeros((n,2));rng=np.random.default_rng(40900+index)
 def add(x,start,level,pan=0):
  ix=(np.arange(len(x))+round(start*RATE))%n;np.add.at(mix[:,0],ix,x*level*(1-pan*.4));np.add.at(mix[:,1],ix,x*level*(1+pan*.4))
 def tone(note,at,dur,level=.07,kind='keys',pan=0):
  dur=max(.05,dur);t=np.arange(round(dur*RATE))/RATE;freq=440*2**((note-69)/12);phase=2*np.pi*freq*t
  if kind=='pad':x=np.sin(phase)+.2*np.sin(phase*1.002)+.12*np.sin(phase*2);decay=5;attack=.18
  elif kind=='fm':x=np.sin(phase+2.2*np.sin(phase*2)*np.exp(-t*8));decay=.35;attack=.005
  elif kind=='bass':x=np.sin(phase)+.15*np.sin(phase*2);decay=.8;attack=.012
  else:x=np.sin(phase)+.25*np.sin(phase*2)*np.exp(-t*3)+.15*np.sin(phase*3)*np.exp(-t*5);decay=1.4 if index>=6 else .8;attack=.009
  env=np.minimum(t/attack,1)*np.minimum((dur-t)/.08,1)*np.exp(-t/decay);add(x*env,at,level,pan)
 def drum(kind,at,level=1):
  duration=.3 if kind=='kick' else .16 if kind=='snare' else .05;t=np.arange(round(duration*RATE))/RATE
  if kind=='kick':x=np.sin(2*np.pi*(43*t+48*.04*(1-np.exp(-t/.04))))*np.exp(-t*17)
  else:
   noise=rng.normal(0,.32,len(t));x=(noise-np.roll(noise,1))*np.exp(-t*(70 if kind=='hat' else 28))
   if kind=='snare':x+=.2*np.sin(2*np.pi*164*t)*np.exp(-t*25)
  add(x,at,.1*level,-.25 if kind=='hat' else .15)
 if index>=6:
  source='gymnopedie-1.mid' if index==6 else 'fur-elise.mid';notes=midi_notes('scripts/music-sources/'+source)
  # MIDI note times only; original engraving/audio is not distributed in the game.
  start=min(note[1] for note in notes)
  for note,at,dur,velocity in notes:
   at-=start
   if 0<=at<beats:tone(note,at*beat,min(dur,beats-at)*beat+.12,.095*max(.45,velocity),pan=(note-60)/100)
 else:
  roots=[[48,45,53,43],[50,46,53,48],[48,53,50,55],[45,41,48,43],[45,41,44,40],[48,55,53,43]][index]
  intervals=[0,4,7,11] if index in (0,2) else [0,3,7,10] if index in (1,3) else [0,3,7,14] if index==4 else [0,4,7]
  motif=[[12,16,19,14,11,7,9,14],[19,14,12,7,10,14,15,12],[12,7,16,19,14,11,9,7],[12,15,19,22,17,15,10,7],[12,13,7,10,12,19,13,7],[12,19,16,24,14,7,21,12]][index]
  barbeats=3 if index==5 else 4;bars=beats//barbeats
  for bar in range(bars):
   root=roots[(bar//2)%4];at=bar*barbeats*beat
   for step in intervals:
    tone(root+12+step,at,(barbeats+.3)*beat,.025 if index!=4 else .015,'pad' if index in (1,3) else 'keys',pan=(step-6)/15)
   for j in range(barbeats*2):
    pos=at+j*.5*beat
    if index!=1:
     if j in ([0,3,5] if index==2 else [0,4] if index!=5 else [0]):drum('kick',pos,.7)
     if j in ([3,6] if index==2 else [2,6] if index!=5 else [2,4]):drum('snare',pos,.35 if index!=4 else .5)
     drum('hat',pos+(.04*beat if j%2 and index==0 else 0),.3)
    if index!=1 and (j%2==0 or index==4):tone(root-12,pos,.6*beat,.075,'bass')
    if (j%2==0 if index in (0,1) else True):
     tone(root+motif[(j+bar)%8],pos,(1.7 if index==1 else .65)*beat,.045 if index!=5 else .06,'fm' if index==5 else 'keys',pan=(-.35 if j%2 else .35))
  if index==0:
   noise=rng.normal(0,.001,n);mix+=noise[:,None]
 # Circular delay keeps note tails at the loop seam instead of chopping them.
 dry=mix.copy();mix[:,0]+=.16*np.roll(dry[:,1],round(.75*beat*RATE));mix[:,1]+=.16*np.roll(dry[:,0],round(1.25*beat*RATE))
 mix=np.tanh(mix);mix*=.6/max(abs(mix).max(),1e-8);pcm=(mix*32767).astype('<i2');out=Path('assets/audio/'+name+'.mp3')
 # Replace atomically only after ffmpeg succeeds.
 with tempfile.TemporaryDirectory(dir=out.parent) as temp:
  wav=Path(temp)/'source.wav';mp3=Path(temp)/'loop.mp3'
  with wave.open(str(wav),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(RATE);w.writeframes(pcm.tobytes())
  subprocess.run(['ffmpeg','-y','-v','error','-i',str(wav),'-codec:a','libmp3lame','-b:a','96k','-metadata','title='+title,'-metadata','artist='+('Erik Satie / new synthetic performance' if index==6 else 'Ludwig van Beethoven / new synthetic performance' if index==7 else 'Game Night original composition'),str(mp3)],check=True);mp3.replace(out)
 print(name,round(beats*beat,2),out.stat().st_size)
 return dict(id='music-'+name,name=title,file=name+'.mp3',price=price,genre=genre,description=description,duration=round(beats*beat,2),bpm=bpm)
if __name__=='__main__':
 result=[build(i,t) for i,t in enumerate(TRACKS)]
 Path('scripts/music-expansion.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
