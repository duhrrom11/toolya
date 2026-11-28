import {decodeBankFile,bankPreview,applyBankImport,undoBankImport} from './bank-import.mjs';
import {parseCSV,decimalCents} from './budget-domain.mjs';
// All private values are inserted as text nodes. The source file stays in this module.
export function mountBankImport(root,api){
  const en=()=>window.__toolyaUILocale==='en';
  const t=(de,english)=>en()?english:de;
  const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
  const localized=(tag,de,english)=>{const n=el(tag,de);n.dataset.toolEn=english;return n;};
  const button=(de,english,fn)=>{const n=localized('button',de,english);n.type='button';n.className='p-2 border rounded-lg bg-white';n.addEventListener('click',fn);return n;};
  const field=(de,english,control)=>{const l=el('label');l.className='block space-y-1';l.append(localized('span',de,english),control);control.className='w-full p-2 border rounded-lg bg-white';return l;};
  const select=values=>{const n=el('select');for(const [v,de,english] of values){const o=localized('option',de,english);o.value=v;n.append(o);}return n;};
  const details=el('details');details.className='border rounded-xl p-3 space-y-3';
  const summary=localized('summary','Bank-CSV importieren','Import bank CSV');summary.className='font-semibold cursor-pointer';details.append(summary);
  const form=el('div');form.className='grid grid-cols-1 md:grid-cols-2 gap-3';
  const file=el('input');file.type='file';file.accept='.csv,text/csv,text/plain';
  const source=el('input');source.maxLength=120;
  const encoding=select([['utf-8','UTF-8','UTF-8'],['windows-1252','Windows-1252','Windows-1252'],['utf-16le','UTF-16 LE','UTF-16 LE'],['utf-16be','UTF-16 BE','UTF-16 BE']]);
  const delimiter=select([[';','Semikolon','Semicolon'],[',','Komma','Comma']]);
  const locale=select([['de','1.234,56','1.234,56'],['en','1,234.56','1,234.56']]);
  const dateFormat=select([['DMY','Tag/Monat/Jahr','Day/month/year'],['MDY','Monat/Tag/Jahr','Month/day/year'],['ISO','JJJJ-MM-TT','YYYY-MM-DD']]);
  const mode=select([['signed','Betrag mit Vorzeichen','Signed amount'],['reverse','Positiv = Ausgabe','Positive = expense'],['split','Soll und Haben','Debit and credit']]);
  form.append(field('CSV-Datei','CSV file',file),field('Importquelle (eindeutig pro Konto)','Import source (unique per account)',source),field('Zeichensatz','Encoding',encoding),field('Trennzeichen','Delimiter',delimiter),field('Betragsformat','Amount format',locale),field('Datumsformat','Date format',dateFormat),field('Betragsspalten','Amount columns',mode));
  const map=el('div');map.className=form.className;
  const status=el('p');status.setAttribute('role','status');
  const preview=el('div');preview.className='space-y-2';
  const undo=el('div');undo.className='space-y-2';
  let text='',columns={},busy=false,version=0,context=null;
  function clear(){version++;text='';columns={};map.replaceChildren();preview.replaceChildren();}
  function report(de,english){status.textContent=t(de,english);}
  async function read(){
    if(busy)return;
    clear();const token=version;
    try{
      if(!file.files[0])throw Error();
      const session=api.context();
      const decoded=await decodeBankFile(file.files[0],encoding.value);
      if(token!==version)return;
      if(!api.sameContext(session))throw Error();
      const headers=parseCSV(decoded,delimiter.value)[0]||[];
      if(!headers.length||headers.length>200)throw Error();
      text=decoded;context=session;
      for(const [key,de,english] of [['date','Datum','Date'],['title','Buchungstext','Description'],['amount','Betrag','Amount'],['debit','Soll','Debit'],['credit','Haben','Credit'],['transactionId','Transaktions-ID (optional)','Transaction ID (optional)']]){
        const n=el('select');const none=localized('option','Nicht zugeordnet','Not mapped');none.value='-1';n.append(none);
        headers.forEach((v,i)=>{const o=el('option',(i+1)+': '+v);o.value=String(i);n.append(o);});
        columns[key]=n;map.append(field(de,english,n));
        n.addEventListener('change',()=>preview.replaceChildren());
      }
      report('Spalten zuordnen und Vorschau öffnen.','Map the columns and open the preview.');
    }catch{report('Datei konnte nicht gelesen werden. Format und Zeichensatz prüfen.','Could not read the file. Check format and encoding.');}
  }
  for(const n of [file,encoding,delimiter])n.addEventListener('change',clear);
  for(const n of [source,locale,dateFormat,mode])n.addEventListener('input',()=>preview.replaceChildren());
  function showPreview(){
    preview.replaceChildren();
    try{
      if(!text||!api.sameContext(context))throw Error();
      const config={source:source.value,delimiter:delimiter.value,locale:locale.value,dateFormat:dateFormat.value,mode:mode.value==='split'?'split':'signed',reverseSign:mode.value==='reverse',...Object.fromEntries(Object.entries(columns).map(([k,n])=>[k,Number(n.value)]))};
      const rows=bankPreview(text,config,api.entries());
      const picks=[];const list=el('div');list.className='max-h-96 overflow-auto space-y-2';
      for(const row of rows){
        const line=el('label');line.className='flex gap-2 items-start break-all';
        const check=el('input');check.type='checkbox';check.checked=row.status==='ready';check.disabled=['duplicate','invalid'].includes(row.status);
        const label=el('span',t('Zeile ','Row ')+row.index+': '+(row.status==='invalid'?t('Ungültig','Invalid'):row.date+' · '+row.title+' · '+decimalCents(row.cents)+' €'+(row.status==='duplicate'?t(' – bereits vorhanden',' – already present'):row.status==='review'?t(' – mögliche Doppelbuchung',' – possible duplicate'):'')));
        line.append(check,label);list.append(line);picks.push([row,check]);
      }
      const batchId=crypto.randomUUID();
      const counts=el('p');
      const commit=button('Buchungen übernehmen','Import transactions',async()=>{
        if(busy)return;
        const chosen=picks.filter(([,c])=>c.checked&&!c.disabled).map(([r])=>r);
        if(!chosen.length||!api.sameContext(context))return;
        if(!confirm(t(chosen.length+' Buchungen in Toolya Cloud speichern? Die CSV-Datei wird nicht hochgeladen.', 'Save '+chosen.length+' transactions to Toolya Cloud? The CSV file is not uploaded.')))return;
        busy=true;commit.disabled=true;
        try{
          const result=await api.apply(context,entries=>applyBankImport(entries,chosen,batchId));
          report(result.added+' Buchungen gespeichert.',result.added+' transactions saved.');
          clear();file.value='';refreshUndo();
        }catch{report('Speicherung nicht bestätigt. Bitte neu laden und prüfen.','Save not confirmed. Reload and check.');}
        finally{busy=false;}
      });
      const update=()=>{const n=picks.filter(([,c])=>c.checked&&!c.disabled).length;counts.textContent=t(n+' ausgewählt · '+rows.filter(r=>r.status==='invalid').length+' ungültig',n+' selected · '+rows.filter(r=>r.status==='invalid').length+' invalid');commit.disabled=!n;commit.textContent=t(n+' Buchungen übernehmen','Import '+n+' transactions');};
      list.addEventListener('change',update);update();preview.append(counts,list,commit);
    }catch{report('Bitte Datei, Quelle und Spaltenzuordnung prüfen.','Check file, source and column mapping.');}
  }
  function refreshUndo(){
    undo.replaceChildren();
    try{
      const ctx=api.context(), entries=api.entries();
      const batches=new Map();
      for(const r of entries){const b=r?.bankImport;if(b?.batchId&&!batches.has(b.batchId))batches.set(b.batchId,b.source);}
      if(!batches.size)return;
      undo.append(localized('h4','Importe rückgängig machen','Undo imports'));
      for(const [id,name] of batches){
        const plan=undoBankImport(entries,id);const line=el('div');line.append(el('p',name+' · '+t(plan.removable.length+' entfernbar, '+plan.protectedIds.length+' geschützt',plan.removable.length+' removable, '+plan.protectedIds.length+' protected')));
        const action=button('Rücknahme prüfen','Review undo',async()=>{
          if(busy||!api.sameContext(ctx))return;
          const current=api.entries(),p=undoBankImport(current,id);
          const labels=current.filter(r=>p.removable.includes(r.id)).map(r=>r.date+' · '+r.title+' · '+r.price+' €');
          if(!labels.length||!confirm(t('Diese Buchungen entfernen? Bearbeitete bleiben erhalten.','Remove these transactions? Edited ones remain.')+'\n'+labels.join('\n')))return;
          busy=true;action.disabled=true;
          try{const result=await api.apply(ctx,items=>{const q=undoBankImport(items,id);if(JSON.stringify(q.removable)!==JSON.stringify(p.removable))throw Error();return {...q,added:0};});report(result.removable.length+' Buchungen entfernt.',result.removable.length+' transactions removed.');refreshUndo();}
          catch{report('Rücknahme nicht bestätigt. Bitte neu laden.','Undo not confirmed. Reload and check.');}
          finally{busy=false;}
        });action.disabled=!plan.removable.length;line.append(action);undo.append(line);
      }
    }catch{}
  }
  details.append(localized('p','Die Datei bleibt auf deinem Gerät. Erst die bestätigten Buchungen werden gespeichert.','The file stays on your device. Only confirmed transactions are saved.'),form,button('Datei lesen','Read file',read),map,button('Vorschau öffnen','Open preview',showPreview),status,preview,undo);
  details.addEventListener('toggle',()=>{if(details.open)refreshUndo();});
  root.append(details);
  return {refreshUndo,clear};
}
