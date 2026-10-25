#!/usr/bin/env python3
"""Static/content/asset integrity verification; not a browser renderer."""
from pathlib import Path
from html.parser import HTMLParser
import json,re,hashlib,subprocess,sys,shutil
from PIL import Image
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1];SITE=ROOT/'site'
class Markup(HTMLParser):
 def __init__(self):super().__init__();self.ids=[];self.targets=[];self.paths=set();self.sections=[];self.lang=None
 def handle_starttag(self,t,attrs):
  a=dict(attrs)
  if t=='html':self.lang=a.get('lang')
  if a.get('id'):self.ids.append(a['id'])
  if t=='section':self.sections.append((a.get('id'),a.get('data-background')))
  if a.get('data-dialog'):self.targets.append(a['data-dialog'])
  for key in ['href','src','data-src','poster']:
   v=a.get(key,'')
   if v.startswith('#'):self.targets.append(v[1:])
   elif v and not re.match(r'^(https?:|tel:|mailto:|data:)',v):self.paths.add(v)
  for entry in a.get('srcset','').split(','):
   v=entry.strip().split(' ')[0]
   if v and not v.startswith('http'):self.paths.add(v)
p=Markup();p.feed((SITE/'index.html').read_text());errors=[]
def require(ok,message):
 if not ok:errors.append(message)
require(p.lang=='en-AU','Incorrect visitor language')
require(len(set(p.ids))==len(p.ids),'Duplicate HTML IDs')
for t in p.targets:require(t in p.ids,'Missing anchor/dialog/symbol '+t)
for path in p.paths:require((SITE/path).is_file(),'Missing asset '+path)
require(p.sections==[('start','image'),('alignment','image'),('services','color'),('local','image'),('contact','image')],'Approved architecture/order changed')
lock=json.loads((ROOT/'docs/architecture-lock.json').read_text())
require(lock['logo']=='A / Selo Heritage' and lock['site_approved'] and lock['logo_approved'],'Incorrect approval lock')
for name in ['classic-original.png','workshop-original.png']:
 require((SITE/'assets'/name).read_bytes()==(ROOT/'originals'/name).read_bytes(),'Original asset changed: '+name)
require((SITE/'assets/Townsville-Logo-A-Transparente.png').read_bytes()==(ROOT/'originals/Townsville-Logo-A-Transparente.png').read_bytes(),'Logo A differs from selected source')
logo=Image.open(SITE/'assets/Townsville-Logo-A-Transparente.png')
require(logo.mode=='RGBA' and logo.getchannel('A').getextrema()[0]==0,'Logo lacks transparency')
require(hashlib.sha256((SITE/'assets/Townsville-Logo-A-Transparente.png').read_bytes()).hexdigest()==lock['logo_sha256'],'Logo differs from architecture lock')
for css in SITE.rglob('*.css'):
 for url in re.findall(r'url\([\'\"]?([^\)\'\"]+)',css.read_text()):
  if not url.startswith(('data:','http','#')):require((css.parent/url).is_file(),'Missing CSS resource '+url)
content_files=[p for directory in ['site','originals','images-master','docs','animation','references'] for p in (ROOT/directory).rglob('*') if p.is_file()]
for path in content_files:
 if path.is_file() and path.suffix.lower() in ['.png','.webp','.jpg','.jpeg']:
  try:
   im=Image.open(path);im.verify()
  except Exception:errors.append('Image does not decode: '+str(path.relative_to(ROOT)))
for path in [p for p in content_files if p.suffix=='.json']:
 try:json.loads(path.read_text())
 except Exception:errors.append('Invalid JSON '+str(path.relative_to(ROOT)))
for path in SITE.rglob('*.svg'):
 try:ET.parse(path)
 except Exception:errors.append('Invalid SVG '+str(path.relative_to(ROOT)))
for name in ['hero-reveal-HD.mp4','hero-reveal-720.mp4','hero-mid.webp','hero-covered.webp','hero-lifted.webp','hero-revealed.webp']:
 require((SITE/'assets'/name).is_file(),'Missing cinematic asset '+name)
if shutil.which('ffprobe'):
 raw=subprocess.check_output(['ffprobe','-v','error','-show_entries','stream=width,height,r_frame_rate','-show_entries','format=duration','-of','json',str(SITE/'assets/hero-reveal-HD.mp4')],text=True)
 v=json.loads(raw);s=v['streams'][0]
 require((s['width'],s['height'])==(1920,1080),'Hero film is not Full HD')
 require(s['r_frame_rate']=='30/1','Unexpected hero fps')
 require(11<float(v['format']['duration'])<12,'Unexpected hero duration')
manifest=ROOT/'MANIFEST.sha256'
if manifest.exists():
 for line in manifest.read_text().splitlines():
  digest,name=line.split('  ',1);path=ROOT/name
  require(path.is_file() and hashlib.sha256(path.read_bytes()).hexdigest()==digest,'Checksum mismatch '+name)
if errors:print('\n'.join(errors));sys.exit(1)
print('PASS: approved vintage design + logo A; en-AU; 4 photo scenes + 1 yellow interval; anchors/dialogs; assets/fonts/SVG; original hashes; transparency; video metadata; JSON; checksums when present.')
if not shutil.which('ffprobe'):print('SKIP: video dimensions/fps/duration require ffprobe.')
print('Browser layout and interaction remain unverified; see docs/validacao.md.')

