"""Original instrumental 8-bar loops; deterministic synthesis, no samples."""
from pathlib import Path
import math,random,struct,wave,subprocess
RATE=22050
TRACKS=[('midnight-lounge','Midnight Lounge',84,[48,45,53,55],.09,.045),('cloud-drift','Cloud Drift',72,[50,46,53,48],.055,.025),('arcade-pulse','Arcade Pulse',110,[45,53,48,55],.11,.085),('neon-drive','Neon Drive',100,[40,43,47,45],.10,.07),('pocket-groove','Pocket Groove',78,[46,49,44,41],.075,.06),('orbit-house','Orbit House',122,[41,44,48,46],.10,.09),('pixel-quest','Pixel Quest',132,[48,55,53,57],.09,.06)]
for slug,title,bpm,roots,bass,drums in TRACKS:
 beat=60/bpm;length=32*beat;n=int(RATE*length);audio=[0.0]*n;rng=random.Random(slug)
 def add(start,seconds,fn,level):
  for j in range(int(seconds*RATE)):
   t=j/RATE;audio[(round(start*RATE)+j)%n]+=level*fn(t,seconds)
 def note(midi,start,duration,level,bright=False):
  f=440*2**((midi-69)/12)
  add(start,duration,lambda t,d:min(1,t/.012)*math.exp(-t/(.32 if bright else .9))*min(1,(d-t)/.04)*(math.sin(2*math.pi*f*t)+(.18 if bright else .06)*math.sin(4*math.pi*f*t)),level)
 for bar in range(8):
  root=roots[bar%4];chord=[root+12,root+15 if bar%4==0 else root+16,root+19,root+22];start=bar*4*beat
  for pitch in chord:note(pitch,start,4.3*beat,.038)
  for k in [0,1.5,2.5]:note(root,start+k*beat,1.1*beat,bass)
  for k in range(8):
   if slug!='cloud-drift' or k%2==0:note(chord[(k+bar)%4]+12,start+k*.5*beat+(beat*.06 if slug=='pocket-groove' and k%2 else 0),.7*beat,.025,True)
   add(start+(k+.25)*.5*beat,.065,lambda t,d:(rng.random()*2-1)*math.exp(-t/.014),drums*.32)
  for k in ([0,1,2,3] if slug=='orbit-house' else [0,2]):add(start+k*beat,.28,lambda t,d:math.sin(2*math.pi*(48*t+7*(1-math.exp(-t*32))/32))*math.exp(-t*20)*min(1,t/.003),drums*2)
  for k in [1,3]:add(start+k*beat,.12,lambda t,d:((rng.random()*2-1)*.8+math.sin(2*math.pi*180*t)*.2)*math.exp(-t*35)*min(1,t/.002),drums*.6)
 peak=max(abs(v) for v in audio);rms=math.sqrt(sum(v*v for v in audio)/n);gain=min(.62/peak,.13/rms)
 samples=b''.join(struct.pack('<h',round(v*gain*32767)) for v in audio)
 wav=Path('assets/audio')/(slug+'.wav');mp3=wav.with_suffix('.mp3')
 with wave.open(str(wav),'wb') as f:f.setnchannels(1);f.setsampwidth(2);f.setframerate(RATE);f.writeframes(samples)
 subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(wav),'-codec:a','libmp3lame','-b:a','96k','-metadata','title='+title+' — original loop',str(mp3)],check=True);wav.unlink()
 print(f'{title}: {bpm} BPM, {length:.2f}s, peak {peak*gain:.3f}, RMS {rms*gain:.3f}, seam delta {abs(audio[0]-audio[-1])*gain:.5f}, {mp3.stat().st_size} bytes')
