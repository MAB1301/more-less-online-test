"""Original short victory stingers. No samples or borrowed melody."""
from pathlib import Path
import math, struct, wave, subprocess
rate=22050
for slug,notes in [('victory',[60,64,67,72,76]),('gold-rush',[55,59,62,67,74]),('cosmic-win',[62,65,69,74,81])]:
    n=rate*6; audio=[0.0]*n
    for k,pitch in enumerate(notes):
        start=int(rate*k*.32); f=440*2**((pitch-69)/12)
        for j in range(min(int(rate*2.4),n-start)):
            t=j/rate; env=min(1,t/.015)*math.exp(-t/0.65)*min(1,(2.4-t)/.08)
            audio[start+j]+=.10*env*(math.sin(2*math.pi*f*t)+.18*math.sin(4*math.pi*f*t))
    for pitch in notes[:3]:
        f=440*2**((pitch-12-69)/12)
        for j in range(n):
            t=j/rate; audio[j]+=.04*min(1,t/.05)*math.exp(-t/.8)*math.sin(2*math.pi*f*t)
    peak=max(map(abs,audio));gain=min(1,.62/peak)
    wav=Path('assets/audio')/(slug+'.wav')
    with wave.open(str(wav),'wb') as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(rate)
        w.writeframes(b''.join(struct.pack('<h',round(v*gain*32767)) for v in audio))
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(wav),'-codec:a','libmp3lame','-b:a','96k',str(wav.with_suffix('.mp3'))],check=True)
    wav.unlink();print(slug, '6 seconds')
