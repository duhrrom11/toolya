#!/usr/bin/env python3
"""Candidate-only responsive homepage art. No original files, CSS or runtime auth changes."""
import hashlib,io,json,math,pathlib,re,sys
from PIL import Image,ImageChops,ImageStat
root=pathlib.Path(sys.argv[1]).resolve()
assert root!=pathlib.Path.cwd() and (root/'.toolya-perf-candidate').is_file()
manifest_path=root/'assets/perf/manifest.json'
manifest=json.loads(manifest_path.read_text())
assert len(manifest['files'])==21
rows=[]
def psnr(a,b):
    scores=[]
    for color in [(255,255,255,255),(32,35,45,255)]:
        aa=Image.alpha_composite(Image.new('RGBA',a.size,color),a).convert('RGB')
        bb=Image.alpha_composite(Image.new('RGBA',b.size,color),b).convert('RGB')
        mse=sum(x*x for x in ImageStat.Stat(ImageChops.difference(aa,bb)).rms)/3
        scores.append(99 if mse==0 else 10*math.log10(255**2/mse))
    return min(scores)
def image(src,maxdim,name,limit):
    with Image.open(root/src) as img:
        original=img.convert('RGBA')
    scale=min(1,maxdim/max(original.size))
    ref=original.resize(tuple(round(x*scale) for x in original.size),Image.Resampling.LANCZOS)
    choices=[]
    for q in [90,85,80,75]:
        buf=io.BytesIO()
        ref.save(buf,'WEBP',quality=q,method=6,exact=True)
        data=buf.getvalue()
        with Image.open(io.BytesIO(data)) as img:
            candidate=img.convert('RGBA')
        score=psnr(ref,candidate)
        if score>=35 and ImageChops.difference(ref.getchannel('A'),candidate.getchannel('A')).getbbox() is None and len(data)<limit*.95:
            choices.append((len(data),data,q,score))
    if not choices: return None
    size,data,q,score=min(choices,key=lambda a:a[0])
    digest=hashlib.sha256(data).hexdigest()
    dest='assets/perf/'+name+'.'+digest+'.webp'
    (root/dest).write_bytes(data)
    manifest['files'].append(dest)
    row={'source':src,'output':dest,'width':ref.width,'height':ref.height,'bytes':size,'comparedBytes':limit,'psnr':round(score,2),'quality':q,'alphaExact':True}
    rows.append(row)
    return row
# Keep the existing hero unchanged: the 768px variant failed mobile screenshot quality.
cards={}
for item in manifest['images']:
    if '/hero-duo' in item['source']:continue
    stem=pathlib.Path(item['source']).stem
    variants=[v for n in (112,160) if (v:=image(item['source'],n,stem+'-'+str(n),item['bytes']))]
    if variants:cards[item['output']]=(item,variants)
assert cards,'No derivative passed visual quality and size gates'
for p in ['index.html','en/index.html']:
    file=root/p; old=file.read_text(); html=old
    def patch(m):
        tag=m.group()
        src=re.search(r'\bsrc="/([^"]+)"',tag)
        if not src or src[1] not in cards:return tag
        if not re.search(r'\bclass="[^"]*\bty-tool-art\b',tag):return tag
        assert 'srcset=' not in tag and 'sizes=' not in tag
        item,variants=cards[src[1]]
        options=sorted([(x['width'],x['output']) for x in variants]+[(item['size'][0],item['output'])])
        srcset=', '.join('/'+path+' '+str(w)+'w' for w,path in options)
        # Actual CSS card box widths: 48, 74, 100 px. Fallback src is unchanged.
        return tag.replace(' loading="lazy"',' srcset="'+srcset+'" sizes="(max-width: 680px) 48px, (max-width: 1000px) 74px, 100px" loading="lazy"')
    html=re.sub(r'<img\b[^>]*>',patch,html)
    inline=lambda s:re.findall(r'<script\b[^>]*>([\s\S]*?)</script>',s)
    assert inline(html)==inline(old)
    assert re.search(r'imagesrcset="([^"]+)"',html)[1]==re.search(r'<img class="ty-hero-art"[\s\S]*?srcset="([^"]+)"',html)[1]
    file.write_text(html)
# Keep all already published content-addressed paths, so older open tabs keep working.
manifest['files']=sorted(set(manifest['files']))
manifest['responsiveVariants']=rows
manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
# Extend, do not broaden, the current static cache allowlist.
sw=root/'sw.js'; source=sw.read_text()
prefix='const PERF_ASSETS = '
match=re.search(r'const PERF_ASSETS = (\{[^\n]+\});',source)
assert match
previous=json.loads(match[1])
updated={ '/'+p:re.fullmatch(r'assets/perf/[a-z0-9-]+\.([a-f0-9]{64})\.(css|js|webp)',p)[1] for p in manifest['files']}
assert all(updated.get(k)==v for k,v in previous.items())
compact=json.dumps(updated,separators=(',',':'))
version=hashlib.sha256(compact.encode()).hexdigest()[:16]
source=source[:match.start()]+prefix+compact+';'+source[match.end():]
source,count=re.subn(r"const PERF_CACHE = 'toolya-public-perf-[a-f0-9]{16}';","const PERF_CACHE = 'toolya-public-perf-"+version+"';",source)
assert count==1
sw.write_text(source)
# Atlas feasibility only. Its full sprite layout, role selection and shared runtime
# require dedicated visual tests before it can replace the existing asset.
atlas=root/'assets/toolya/outfits.webp'
with Image.open(atlas) as im: a=im.convert('RGBA')
assert a.width>=8 and a.height>=4
# CSS uses fractional cell boundaries; rounded boundaries cover every source pixel.
xs=[round(i*a.width/8) for i in range(9)]
ys=[round(i*a.height/4) for i in range(5)]
atlas_results=[]
for q in [85,80,75,70]:
    buf=io.BytesIO();a.save(buf,'WEBP',quality=q,method=6,exact=True)
    data=buf.getvalue()
    with Image.open(io.BytesIO(data)) as im:b=im.convert('RGBA')
    cell_scores=[psnr(a.crop((xs[x],ys[y],xs[x+1],ys[y+1])),b.crop((xs[x],ys[y],xs[x+1],ys[y+1]))) for y in range(4) for x in range(8)]
    atlas_results.append({'quality':q,'bytes':len(data),'minCellPSNR':round(min(cell_scores),2),'cells':len(cell_scores),'alphaExact':ImageChops.difference(a.getchannel('A'),b.getchannel('A')).getbbox() is None})
print(json.dumps({'variants':rows,'atlasExperiment':{'originalBytes':atlas.stat().st_size,'dimensions':a.size,'candidates':atlas_results}},indent=2))
