# Original game audio

All included tracks are original synthesized instrumental compositions, generated from the repository's Python scripts. No recordings, external samples, vocals or passages from existing songs are used. Assets are released under CC0-1.0.

`build-game-music.py`: Game Night, the free default loop.

`build-background-tracks.py`: free Midnight Lounge (84 BPM), Cloud Drift (72 BPM), Arcade Pulse (110 BPM); shop tracks Neon Drive (100 BPM), Pocket Groove (78 BPM), Orbit House (122 BPM), Pixel Quest (132 BPM). Loops use complete beat periods with short envelopes to avoid clicks. MP3 compression can add a small decoder delay.

`build-shop-music.py`: Night Drive (124 BPM), Pixel Riot (144 BPM), Moon Bounce (108 BPM), imported from the concurrent settings branch along with their generation script.

`build-win-tracks.py`: First Light (`victory.mp3`), Gold Rush and Cosmic Win, six-second original victory cues.

Background music is opt-in. Global mute, reduced background activity and separate music volume are respected. The shop previews eight seconds of a background track or the full six-second victory cue; previewing doesn't purchase anything. Victory cues play once for a strict online winner, with no cue for tied results. Purchased tracks are owned and equipped through the authenticated server wallet.
