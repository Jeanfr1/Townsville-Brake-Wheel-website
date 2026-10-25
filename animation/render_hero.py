#!/usr/bin/env python3
"""Cinematic edit from four generated photographic states; not a 3D cloth simulation."""
from pathlib import Path
import subprocess
ROOT=Path(__file__).resolve().parents[1]
names=['hero-covered','hero-mid','hero-lifted','hero-revealed']
parts=[]
for i in range(4):
 parts.append(f'[{i}:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1,fps=30,trim=duration=3.4,setpts=PTS-STARTPTS,format=yuv420p[p{i}]')
parts+=['[p0][p1]xfade=transition=smoothright:duration=0.65:offset=2.75[a]',
        '[a][p2]xfade=transition=fade:duration=0.65:offset=5.5[b]',
        '[b][p3]xfade=transition=smoothup:duration=0.65:offset=8.25[c]',
        "[c]scale=2304:1296,zoompan=z='1+0.032*on/349':x='(iw-iw/zoom)*0.53':y='(ih-ih/zoom)*0.61':d=1:s=1920x1080:fps=30,trim=duration=11.65,format=yuv420p[out]"]
cmd=['ffmpeg','-y','-hide_banner','-loglevel','error','-filter_complex_threads','1']
for name in names:cmd+=['-loop','1','-framerate','30','-i','site/assets/'+name+'.webp']
cmd+=['-filter_complex',';'.join(parts),'-map','[out]','-t','11.65','-an','-c:v','libx264','-preset','fast','-crf','23','-g','30','-pix_fmt','yuv420p','-movflags','+faststart','site/assets/hero-reveal-HD.mp4']
subprocess.run(cmd,cwd=ROOT,check=True)
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i','site/assets/hero-reveal-HD.mp4','-vf','scale=1280:720','-an','-c:v','libx264','-preset','fast','-crf','26','-g','30','-pix_fmt','yuv420p','-movflags','+faststart','site/assets/hero-reveal-720.mp4'],cwd=ROOT,check=True)
print(ROOT/'site/assets/hero-reveal-HD.mp4')

