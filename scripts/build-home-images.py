#!/usr/bin/env python3
"""Build public WebP derivatives only. Never overwrite originals."""
import hashlib, io, json, math, pathlib, sys
from PIL import Image, ImageChops, ImageStat

root = pathlib.Path(sys.argv[1]).resolve()
out = root / 'assets/perf'
out.mkdir(parents=True, exist_ok=True)
home = 'assets/toolya/home/'
names = ['wishlist','budget','moving','plants','wg-organisator','digitaler-nachlass','autokosten','tiergesundheit','parkplatz-merker','verliehene-dinge','zaehlerstaende','backform-rechner']
targets = [(home+n+'.webp', 200) for n in names] + [(home+'hero-duo-480.webp',480),(home+'hero-duo-960.webp',960),(home+'hero-duo.webp',1476)]
mapping, report = {}, []
def compare(a,b):
    # Compare appearance on both light and dark backgrounds; transparent RGB is irrelevant.
    scores=[]
    for bg in [(255,255,255,255),(32,35,45,255)]:
        aa=Image.alpha_composite(Image.new('RGBA',a.size,bg),a).convert('RGB')
        bb=Image.alpha_composite(Image.new('RGBA',b.size,bg),b).convert('RGB')
        mse=sum(ImageStat.Stat(ImageChops.difference(aa,bb)).rms[i]**2 for i in range(3))/3
        scores.append(99 if mse==0 else 10*math.log10(255**2/mse))
    return min(scores)
for src,width in targets:
    p=root/src
    original=p.read_bytes()
    with Image.open(io.BytesIO(original)) as opened:
        source=opened.convert('RGBA')
    if source.width>width:
        reference=source.resize((width,round(source.height*width/source.width)),Image.Resampling.LANCZOS)
    else:
        reference=source
    best=None
    for q in [90,85,80,75]:
        buf=io.BytesIO()
        reference.save(buf,'WEBP',quality=q,method=6,exact=True)
        data=buf.getvalue()
        with Image.open(io.BytesIO(data)) as candidate:
            candidate=candidate.convert('RGBA')
        score=compare(reference,candidate)
        if ImageChops.difference(reference.getchannel('A'),candidate.getchannel('A')).getbbox() is not None: continue
        if score>=35 and len(data)<=len(original)*0.95 and (best is None or len(data)<len(best[0])):
            best=(data,q,score)
    row={'source':src,'originalBytes':len(original),'originalSize':source.size}
    if best:
        data,q,score=best
        digest=hashlib.sha256(data).hexdigest()
        dest='assets/perf/'+p.stem+'.'+digest+'.webp'
        (root/dest).write_bytes(data)
        mapping[src]=dest
        row.update(output=dest,bytes=len(data),size=reference.size,quality=q,psnr=round(score,2),alphaExact=True)
    else:
        row.update(output=src,bytes=len(original),size=source.size,reason='No candidate met quality and savings gates')
    report.append(row)
print(json.dumps({'mapping':mapping,'images':report},indent=2))
