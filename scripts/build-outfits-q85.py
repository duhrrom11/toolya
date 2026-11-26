#!/usr/bin/env python3
"""Generate q85 outfit derivative and isolated runtime candidate. Original bytes stay intact."""
import hashlib,io,json,math,pathlib,re,sys
from PIL import Image,ImageChops,ImageStat
root=pathlib.Path(sys.argv[1]).resolve()
assert root!=pathlib.Path.cwd() and (root/'.toolya-perf-candidate').is_file()
src=root/'assets/toolya/outfits.webp'
original=src.read_bytes()
with Image.open(io.BytesIO(original)) as im:a=im.convert('RGBA')
buf=io.BytesIO()
a.save(buf,'WEBP',quality=85,method=6,exact=True)
data=buf.getvalue()
with Image.open(io.BytesIO(data)) as im:b=im.convert('RGBA')
assert a.size==b.size
assert ImageChops.difference(a.getchannel('A'),b.getchannel('A')).getbbox() is None
assert len(data)<=len(original)*0.90
def psnr(a,b):
    scores=[]
    for color in [(255,255,255,255),(32,35,45,255)]:
        aa=Image.alpha_composite(Image.new('RGBA',a.size,color),a).convert('RGB')
        bb=Image.alpha_composite(Image.new('RGBA',b.size,color),b).convert('RGB')
        mse=sum(x*x for x in ImageStat.Stat(ImageChops.difference(aa,bb)).rms)/3
        scores.append(99 if mse==0 else 10*math.log10(255**2/mse))
    return min(scores)
xs=[round(i*a.width/8) for i in range(9)]
ys=[round(i*a.height/4) for i in range(5)]
cells=[]
for y in range(4):
    for x in range(8):
        box=(xs[x],ys[y],xs[x+1],ys[y+1])
        cells.append({'index':y*8+x,'role':(y*8+x)//2,'character':'purple' if x%2 else 'turquoise','psnr':round(psnr(a.crop(box),b.crop(box)),4)})
assert len(cells)==32 and min(c['psnr'] for c in cells)>=35
sha=hashlib.sha256(data).hexdigest()
dest='assets/toolya/optimized/outfits-q85.'+sha+'.webp'
(root/dest).parent.mkdir(parents=True,exist_ok=True)
(root/dest).write_bytes(data)
manifest={'source':'assets/toolya/outfits.webp','sourceSHA256':hashlib.sha256(original).hexdigest(),'output':dest,'sha256':sha,'originalBytes':len(original),'bytes':len(data),'dimensions':list(a.size),'quality':85,'alphaExact':True,'cells':cells}
(root/'assets/toolya/optimized/outfits-q85.json').write_text(json.dumps(manifest,indent=2)+'\n')
# Keep the old URL and alpha compatibility rules untouched for cached legacy modules.
# The distinct hash-named URL intentionally does not match the legacy CSS substring
# outfits.webp (which otherwise would force a second download of the old atlas).
platform=root/'shared/toolya/platform.mjs'
source=platform.read_text()
old="const atlasURL=file=>ASSETS+file+'?v=20261115-alpha';"
new="const OPTIMIZED_OUTFITS=new URL('../../"+dest+"',import.meta.url).href;\nconst atlasURL=file=>file==='outfits.webp'?OPTIMIZED_OUTFITS:ASSETS+file+'?v=20261115-alpha';"
assert source.count(old)==1
source=source.replace(old,new)
old=" record.frame.style.backgroundImage=loaded.failed?'none':\x60url(\"\x24{atlasURL(file)}\")\x60;"
assert source.count(old)==1
source=source.replace(old,old+"\n if(file==='outfits.webp')record.frame.style.mixBlendMode='normal';else record.frame.style.removeProperty('mix-blend-mode');")
platform.write_text(source)
assert src.read_bytes()==original
print(json.dumps(manifest,indent=2))
