import {cardDesigns, cardFormats} from './directory-card-designs.mjs';
import {homeUrl} from './directory-links.mjs';

const fonts = {
  sans: '700', heavy: '900', round: '700', serif: '600'
};
const serif = 'Georgia, "Noto Serif", "Noto Serif CJK JP", serif';
const sans = 'system-ui, "Noto Sans", "Noto Sans Arabic", "Noto Sans CJK JP", sans-serif';
const round = '"Trebuchet MS", "Noto Sans", system-ui, sans-serif';

function image(url, external = false) {
  return new Promise(resolve => {
    if (!url) { resolve(null); return; }
    const img = new Image();
    if (external) {
      img.crossOrigin = 'anonymous';
      img.referrerPolicy = 'no-referrer';
    }
    const timer = setTimeout(() => resolve(null), 6500);
    const finish = result => { clearTimeout(timer); resolve(result); };
    img.onload = () => finish(img);
    img.onerror = () => finish(null);
    img.src = url;
  });
}
export const loadCardImage = image;

function direction(value, preference) {
  if (preference !== 'auto') return preference;
  const first = value.match(/\p{Letter}/u)?.[0] || '';
  return /[\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Syriac}\p{Script=Thaana}\p{Script=Nko}]/u.test(first) ? 'rtl' : 'ltr';
}

export function wrappedLines(context, value, width, locale) {
  const words = new Intl.Segmenter(locale === 'custom' ? undefined : locale, {granularity: 'word'});
  const graphemes = new Intl.Segmenter(locale === 'custom' ? undefined : locale, {granularity: 'grapheme'});
  return value.replace(/\r\n?/g, '\n').split('\n').flatMap(paragraph => {
    const lines = [];
    let line = '';
    for (const {segment} of words.segment(paragraph)) {
      if (context.measureText(line + segment).width <= width) { line += segment; continue; }
      if (line.trim()) { lines.push(line.trimEnd()); line = ''; }
      if (!segment.trim()) continue;
      if (context.measureText(segment).width <= width) { line = segment; continue; }
      for (const part of graphemes.segment(segment)) {
        if (line && context.measureText(line + part.segment).width > width) {
          lines.push(line);
          line = '';
        }
        line += part.segment;
      }
    }
    return [...lines, line.trimEnd()];
  });
}

function qr(context, url, centerX, y, size) {
  const {modules} = window.EstateQR.create(url, {errorCorrectionLevel: 'M'});
  const quiet = 4;
  const pitch = Math.floor(size / (modules.size + quiet * 2));
  const dimension = pitch * (modules.size + quiet * 2);
  const x = Math.round(centerX - dimension / 2);
  const top = Math.round(y);
  context.fillStyle = '#fff';
  context.fillRect(x, top, dimension, dimension);
  context.fillStyle = '#101820';
  for (let row = 0; row < modules.size; row++) {
    for (let column = 0; column < modules.size; column++) {
      if (modules.get(row, column)) context.fillRect(x + (column + quiet) * pitch, top + (row + quiet) * pitch, pitch, pitch);
    }
  }
}

function cover(ctx, img, x, y, w, h, radius) {
  if (!img) return;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.clip();
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const width = img.naturalWidth * scale, height = img.naturalHeight * scale;
  ctx.drawImage(img, x + (w - width) / 2, y + (h - height) / 2, width, height);
  ctx.restore();
}

function decorate(ctx, motif, w, h, accent, inkSaving) {
  const path = (points, fill = false) => {
    ctx.beginPath();
    ctx.moveTo(points[0][0] * w, points[0][1] * h);
    for (const [x, y] of points.slice(1)) ctx.lineTo(x * w, y * h);
    if (fill) { ctx.closePath(); ctx.fill(); } else ctx.stroke();
  };
  const circle = (x, y, radius) => {ctx.beginPath();ctx.arc(x*w,y*h,radius*w,0,Math.PI*2);ctx.fill();};
  ctx.save();
  ctx.strokeStyle = ctx.fillStyle = accent;
  ctx.lineWidth = w * .006;
  ctx.globalAlpha = inkSaving ? .2 : .52;
  switch (motif) {
    case 'frame': ctx.strokeRect(w*.033,h*.032,w*.934,h*.936); break;
    case 'double': ctx.strokeRect(w*.027,h*.026,w*.946,h*.948);ctx.strokeRect(w*.047,h*.046,w*.906,h*.908);break;
    case 'split': path([[0,0],[.038,0],[.038,1],[0,1]],true);path([[.95,0],[1,0],[1,.22]],true);break;
    case 'border': ctx.lineWidth=w*.027;ctx.beginPath();ctx.roundRect(w*.022,h*.02,w*.956,h*.96,w*.045);ctx.stroke();break;
    case 'arch': ctx.beginPath();ctx.moveTo(w*.055,h*.78);ctx.lineTo(w*.055,h*.24);ctx.quadraticCurveTo(w*.5,-h*.14,w*.945,h*.24);ctx.lineTo(w*.945,h*.78);ctx.stroke();break;
    case 'leaves':
    case 'branch':
      for (const side of [1,-1]) {
        const offset=side===1?.035:.965;
        path([[offset,.045],[offset+side*.05,.14],[offset,.28]]);
        for(let i=0;i<5;i++){
          ctx.beginPath();ctx.ellipse((offset+side*(.01+i%2*.035))*w,(.06+i*.038)*h,w*.021,w*.008,side*(i%2?.65:-.55),0,Math.PI*2);ctx.fill();
        }
      }
      break;
    case 'diagonal': path([[0,0],[.33,0],[0,.19]],true);path([[1,.84],[1,1],[.77,1]],true);break;
    case 'clouds':
      for(let i=0;i<7;i++)circle(.025+i*.16,i%2*.017,.045+i%3*.019);
      break;
    case 'stars':
      for(let i=0;i<12;i++){
        const x=.055+i*.08,y=.026+i%3*.028;
        path([[x-.009,y],[x+.009,y]]);path([[x,y-.009],[x,y+.009]]);
      }
      break;
    case 'halo': ctx.beginPath();ctx.ellipse(w*.5,h*.26,w*.44,h*.238,0,0,Math.PI*2);ctx.stroke();break;
    case 'rays':
      for(let i=0;i<13;i++)path([[.035+i*.077,0],[.19+i*.051,.075]]);
      break;
    case 'confetti':
      for(let i=0;i<18;i++)circle(.026+(i%9)*.116,i<9?.03+(i%3)*.025:.97-(i%3)*.025,.004+i%3*.004);
      break;
    case 'blocks': path([[0,0],[.025,0],[.025,1],[0,1]],true);path([[0,.022],[1,.022],[1,.04],[0,.04]],true);break;
    case 'snapshot': path([[.1,.04],[.15,.04],[.1,.095],[.05,.095]],true);path([[.85,.04],[.9,.04],[.95,.095],[.9,.095]],true); break;
    case 'ribbon': path([[0,.028],[1,.028],[1,.05],[0,.05]],true);path([[.4,.05],[.6,.05],[.5,.09]],true);break;
    case 'poster': ctx.lineWidth=w*.021;ctx.strokeRect(w*.025,h*.025,w*.95,h*.95);break;
    case 'grid': for(let i=0;i<10;i++){circle(.045,.075+i*.092,.004);circle(.955,.075+i*.092,.004);}break;
  }
  ctx.restore();
}

function textBlocks(ctx, variants, width, size, type, accent) {
  return variants.flatMap((variant, index) => {
    const rows = [];
    for (const key of ['title','name','explanation','note']) {
      const value = variant.text[key]?.trim();
      if (!value) continue;
      const ratio = {title: 1, name: .64, explanation: .45, note: .42}[key];
      const fontSize = Math.round(size * ratio);
      const family = key === 'title' && type==='serif' ? serif : type==='round' ? round : sans;
      const font = (key==='title' ? fonts[type] : key==='name' ? 700 : 450) + ' ' + fontSize + 'px ' + family;
      ctx.font = font;
      const lines = wrappedLines(ctx,value,width,variant.language);
      rows.push({lines, font, fontSize, direction:direction(value,variant.direction), color:key==='title' ? accent : '#1b2934', gap:fontSize*.33});
    }
    if (index && rows.length) rows[0].gap += size*.24;
    return rows;
  });
}

function labelRows(ctx, variants, key, width, fontSize) {
  ctx.font = '650 ' + fontSize + 'px ' + sans;
  return variants.flatMap(({text, language, direction: preferred}) => text[key]?.trim()
    ? wrappedLines(ctx, text[key].trim(), width, language).map(line => ({line, direction: direction(line,preferred)}))
    : []);
}

export function drawCard({draft, target, format, mascot, photo}, canvas=document.createElement('canvas')) {
  const formatInfo = cardFormats[format];
  const w = canvas.width = formatInfo.width, h = canvas.height = formatInfo.height;
  const ctx = canvas.getContext('2d');
  const design = cardDesigns.find(option => option.id === draft.design) || cardDesigns[0];
  const scheme = design.colors[draft.palette] || design.colors[0];
  const accent = draft.accent || scheme.accent;
  const variants = [draft.active, draft.second].filter(Boolean).map(id => draft.variants.find(v=>v.id===id)).filter(Boolean);
  const unit = Math.min(w,h);
  const print = format === 'a4' || format === 'four';
  const promoSize = Math.round(unit * .184);
  const targetSize = Math.round(unit * (format === 'square' ? .32 : .35));
  const brandPadding = unit*.066;
  const brandY = Math.round(h - brandPadding - promoSize);
  const brand = {x: w*.36, y: brandY, w:w*.41, h:promoSize};

  ctx.fillStyle = draft.ink ? '#fff' : scheme.paper;
  ctx.fillRect(0,0,w,h);
  decorate(ctx,design.motif,w,h,accent,draft.ink);
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';

  const qFont = Math.round(unit*.024);
  const promoFont = Math.round(unit*.022);
  const qrLabels = labelRows(ctx,variants,'qr',w*.82,qFont);
  const promoLabels = labelRows(ctx,variants,'promo',w*.37,promoFont);
  const displayUrl = draft.showUrl ? target.replace(/^https:\/\//,'') : '';
  const needed = qrLabels.length*qFont*1.22 + (displayUrl ? unit*.03 : 0);
  const availableLabels = unit*.116;
  const footerTop = brandY - unit*.033;
  const targetY = Math.round(footerTop-targetSize-Math.min(needed,availableLabels)-unit*.021);
  const top = Math.round(unit*(print?.084:.090));
  let start = top, textX = w/2, textWidth = w*.81;
  if (photo) {
    if (design.photo === 'right') {
      const side = Math.round(unit*.29);
      cover(ctx,photo,w*.62,top,side,Math.min(side,targetY-top-unit*.04),unit*.035);
      textWidth=w*.48;textX=w*.328;
    } else if (design.photo === 'banner') {
      const imageHeight=Math.min(unit*.24,(targetY-top)*.48);
      cover(ctx,photo,w*.113,top,w*.774,imageHeight,unit*.028);
      start+=imageHeight+unit*.022;
    } else {
      const side=Math.min(unit*.155,(targetY-top)*.33);
      cover(ctx,photo,w/2-side/2,top,side,side,unit*.04);
      start+=side+unit*.018;
    }
  }
  let size=unit*(design.type==='heavy'?.073:.064);
  const minimum=unit*.039;
  const textEnd=targetY-unit*.028;
  let blocks=textBlocks(ctx,variants,textWidth,size,design.type,draft.ink?'#172c35':accent);
  const heightOf = rows => rows.reduce((sum,row) => sum + row.lines.length*row.fontSize*1.25+row.gap,0);
  while (heightOf(blocks)>textEnd-start && size>minimum) {
    size=Math.max(minimum,size-unit*.004);
    blocks=textBlocks(ctx,variants,textWidth,size,design.type,draft.ink?'#172c35':accent);
  }
  const textOverflow=heightOf(blocks)>textEnd-start;
  let y=start+Math.max(0,(textEnd-start-heightOf(blocks))*.47);
  for(const block of blocks){
    ctx.font=block.font;ctx.direction=block.direction;ctx.fillStyle=block.color;
    for(const line of block.lines){
      if(y+block.fontSize*1.22<=textEnd)ctx.fillText(line,textX,y);
      y+=block.fontSize*1.25;
    }
    y+=block.gap;
  }

  qr(ctx,target,w/2,targetY,targetSize);
  y=targetY+targetSize;
  ctx.font='650 '+qFont+'px '+sans;ctx.fillStyle='#1b2934';
  for(const label of qrLabels){
    if(y+qFont>targetY+targetSize+availableLabels)break;
    ctx.direction=label.direction;ctx.fillText(label.line,w/2,y);
    y+=qFont*1.22;
  }
  if(displayUrl){
    ctx.direction='ltr';ctx.font='500 '+Math.round(unit*.017)+'px '+sans;
    if(y+unit*.02<=footerTop)ctx.fillText(displayUrl,w/2,y,w*.85);
  }
  ctx.fillStyle='#fff';
  ctx.beginPath();ctx.roundRect(w*.072,brandY,w*.856,promoSize,unit*.024);ctx.fill();
  const mascotSize=promoSize*.86;
  cover(ctx,mascot,w*.10,brandY+(promoSize-mascotSize)/2,mascotSize,mascotSize,unit*.016);
  qr(ctx,homeUrl,w*.82,brandY+unit*.006,promoSize-unit*.012);
  ctx.direction='ltr';ctx.fillStyle='#123040';ctx.font='750 '+Math.round(unit*.032)+'px '+sans;
  const brandCenter=w*.51;
  ctx.fillText('toolya.app',brandCenter,brandY+unit*.04);
  ctx.font='650 '+promoFont+'px '+sans;
  y=brandY+unit*.087;
  const maxPromo=Math.floor((brandY+promoSize-unit*.012-y)/(promoFont*1.2));
  for(const label of promoLabels.slice(0,maxPromo)){
    ctx.direction=label.direction;ctx.fillText(label.line,brandCenter,y);
    y+=promoFont*1.2;
  }
  const labelOverflow=needed>availableLabels||promoLabels.length>maxPromo;
  return {canvas, brand, overflow:textOverflow||labelOverflow};
}

export function fourPlacements() {
  return [0,1,2,3].map(index=>({x:8+(index%2)*100,y:10+Math.floor(index/2)*142,w:94,h:133}));
}

export function sheetImage(card, format) {
  if(format !== 'four') return card;
  const canvas = document.createElement('canvas');
  canvas.width = 2480;canvas.height = 3508;
  const ctx=canvas.getContext('2d');
  const scale=canvas.width/210;
  ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle='#314352';ctx.lineWidth=2;
  for(const {x,y,w,h} of fourPlacements()){
    ctx.drawImage(card,x*scale,y*scale,w*scale,h*scale);
    for(const [left,top,dx,dy] of [[x,y,-1,-1],[x+w,y,1,-1],[x,y+h,-1,1],[x+w,y+h,1,1]]){
      ctx.beginPath();
      ctx.moveTo((left+dx)*scale,top*scale);ctx.lineTo((left+dx*4)*scale,top*scale);
      ctx.moveTo(left*scale,(top+dy)*scale);ctx.lineTo(left*scale,(top+dy*4)*scale);
      ctx.stroke();
    }
  }
  return canvas;
}
