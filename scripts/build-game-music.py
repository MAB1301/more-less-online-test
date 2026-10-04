"""Original 8-bar instrumental loop. No samples or third-party melodies."""
from pathlib import Path
import wave,math,struct,subprocess
rate=22050;beat=60/96;length=32*beat;audio=[0.0]*int(rate*length)
def tone(midi,start,duration,level,bright=False):
 f=440*2**((midi-69)/12)
 for j in range(int(duration*rate)):
  t=j/rate;env=min(1,t/.025)*math.exp(-t/(.3 if bright else .8))*min(1,(duration-t)/.06)
  value=math.sin(2*math.pi*f*t)+(.15*math.sin(4*math.pi*f*t) if bright else 0)
  i=(int(start*rate)+j)%len(audio);audio[i]+=level*env*value
chords=[(48,60,64,67),(45,57,60,64),(53,60,65,69),(55,59,62,67)]*2
for bar,chord in enumerate(chords):
 start=bar*4*beat
 for n in chord[1:]:tone(n,start,3.9*beat,.08)
 for k in (0,2):tone(chord[0],start+k*beat,1.5*beat,.13)
 for k,n in enumerate([chord[1]+12,chord[2]+12,chord[3]+12,chord[2]+12]):tone(n,start+(k+.5)*beat,.65*beat,.065,True)
peak=max(abs(x) for x in audio);samples=b''.join(struct.pack('<h',int(max(-1,min(1,x/peak*.55))*32767)) for x in audio)
out=Path('assets/audio/game-night.wav')
with wave.open(str(out),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(rate);w.writeframes(samples)
subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(out),'-codec:a','libmp3lame','-b:a','96k','-metadata','title=Game Night — original loop','assets/audio/game-night.mp3'],check=True);out.unlink()
print('Original 20-second loop exported; 96 BPM, C–Am–F–G, no vocals.')
