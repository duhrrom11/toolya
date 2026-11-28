import {categories,saveProfile,saveRule,removePreference} from './budget-organization.mjs';
import {bankFileDigest,decodeBankFile,bankPreview,applyBankImport,undoBankImport} from './bank-import.mjs';
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
  let text='',digest='',columns={},busy=false,version=0,context=null,activeProfile=null;
  function clear(){version++;text='';digest='';columns={};map.replaceChildren();preview.replaceChildren();}
  function report(de,english){status.textContent=t(de,english);}
  async function read(){
    if(busy)return;
    clear();const token=version;
    try{
      if(!file.files[0])throw Error();
      const session=api.context();
      const selectedFile=file.files[0];
      const [decoded,fileDigest]=await Promise.all([decodeBankFile(selectedFile,encoding.value),bankFileDigest(selectedFile)]);
      if(token!==version)return;
      if(!api.sameContext(session))throw Error();
      const headers=parseCSV(decoded,delimiter.value)[0]||[];
      if(!headers.length||headers.length>200)throw Error();
      text=decoded;digest=fileDigest;context=session;
      for(const [key,de,english] of [['date','Datum','Date'],['title','Buchungstext','Description'],['amount','Betrag','Amount'],['debit','Soll','Debit'],['credit','Haben','Credit'],['transactionId','Transaktions-ID (optional)','Transaction ID (optional)']]){
        const n=el('select');const none=localized('option','Nicht zugeordnet','Not mapped');none.value='-1';n.append(none);
        headers.forEach((v,i)=>{const o=el('option',(i+1)+': '+v);o.value=String(i);n.append(o);});
        columns[key]=n;map.append(field(de,english,n));
        if(activeProfile&&activeProfile.mapping[key]>=0&&activeProfile.mapping[key]<headers.length)n.value=String(activeProfile.mapping[key]);
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
      const config={fileDigest:digest,rules:api.preferences().rules,source:source.value,delimiter:delimiter.value,locale:locale.value,dateFormat:dateFormat.value,mode:mode.value==='split'?'split':'signed',reverseSign:mode.value==='reverse',...Object.fromEntries(Object.entries(columns).map(([k,n])=>[k,Number(n.value)]))};
      const rows=bankPreview(text,config,api.entries());
      const picks=[];const list=el('div');list.className='max-h-96 overflow-auto space-y-2';
      for(const row of rows){
        const line=el('label');line.className='flex gap-2 items-start break-all';
        const check=el('input');check.type='checkbox';check.checked=row.status==='ready';check.disabled=['duplicate','invalid'].includes(row.status);
        const label=el('span',t('Zeile ','Row ')+row.index+': '+(row.status==='invalid'?t('Ungültig','Invalid'):row.date+' · '+row.title+' · '+decimalCents(row.cents)+' €'+(row.status==='duplicate'?t(' – bereits vorhanden',' – already present'):row.status==='review'?t(' – mögliche Doppelbuchung',' – possible duplicate'):'')));
        line.append(check,label);
        if(row.cents<0&&!check.disabled){
          const cat=el('select');cat.setAttribute('aria-label',t('Kategorie für Zeile ','Category for row ')+row.index);
          for(const key of categories){const o=el('option',api.categoryLabel(key));o.value=key;cat.append(o);}
          cat.value=row.suggestedCategory||'Sonstiges';row.category=cat.value;
          cat.addEventListener('change',()=>{row.category=cat.value;});
          line.append(cat);
          if(row.suggestedCategory)line.append(el('span',t('Regelvorschlag','Rule suggestion')));
        }
        list.append(line);picks.push([row,check]);
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
  const preferences=el('details');preferences.className='border rounded-lg p-2 space-y-2';
  preferences.append(localized('summary','Bankprofile und Kategorienregeln','Bank profiles and category rules'));
  const preferenceBody=el('div');preferences.append(preferenceBody);
  function refreshPreferences(){
    preferenceBody.replaceChildren();
    try{
      const ctx=api.context(),prefs=api.preferences();
      const profileSelect=el('select'),none=localized('option','Freie Zuordnung','Manual mapping');none.value='';profileSelect.append(none);
      for(const p of prefs.profiles){const o=el('option',p.name);o.value=p.id;profileSelect.append(o);}
      profileSelect.value=activeProfile?.id||'';
      const name=el('input');name.maxLength=120;name.value=activeProfile?.name||'';
      profileSelect.addEventListener('change',()=>{
        activeProfile=prefs.profiles.find(p=>p.id===profileSelect.value)||null;
        clear();name.value=activeProfile?.name||'';
        if(activeProfile){source.value=activeProfile.source;encoding.value=activeProfile.encoding;delimiter.value=activeProfile.delimiter;locale.value=activeProfile.locale;dateFormat.value=activeProfile.dateFormat;mode.value=activeProfile.mode;}
      });
      const mutate=async fn=>{if(busy)return;busy=true;try{await api.savePreferences(ctx,fn);preview.replaceChildren();refreshPreferences();report('Einstellungen gespeichert.','Settings saved.');}catch{report('Einstellungen nicht gespeichert. Bitte prüfen oder neu laden.','Settings not saved. Check or reload.');}finally{busy=false;}};
      preferenceBody.append(field('Bankprofil','Bank profile',profileSelect),field('Profilname','Profile name',name),
        button('Profil speichern','Save profile',()=>mutate(p=>{
          if(!text)throw Error('mapping required');
          const profile={id:activeProfile?.id||crypto.randomUUID(),name:name.value,source:source.value,encoding:encoding.value,delimiter:delimiter.value,locale:locale.value,dateFormat:dateFormat.value,mode:mode.value,mapping:Object.fromEntries(Object.entries(columns).map(([k,n])=>[k,Number(n.value)]))};
          const profiles=saveProfile(p.profiles,profile);return {...p,profiles};
        })),
        button('Profil löschen','Delete profile',()=>{if(activeProfile&&confirm(t('Profil löschen?','Delete profile?'))){const id=activeProfile.id;activeProfile=null;mutate(p=>({...p,profiles:removePreference(p.profiles,id)}));}}));
      const ruleSelect=el('select'),newRule=localized('option','Neue Regel','New rule');newRule.value='';ruleSelect.append(newRule);
      for(const rule of prefs.rules){const o=el('option',rule.match+' → '+api.categoryLabel(rule.category));o.value=rule.id;ruleSelect.append(o);}
      const match=el('input');match.maxLength=120;
      const category=el('select');for(const key of categories){const o=el('option',api.categoryLabel(key));o.value=key;category.append(o);}
      ruleSelect.addEventListener('change',()=>{const rule=prefs.rules.find(r=>r.id===ruleSelect.value);match.value=rule?.match||'';category.value=rule?.category||categories[0];});
      preferenceBody.append(field('Kategorienregel','Category rule',ruleSelect),field('Buchungstext enthält','Description contains',match),field('Kategorie','Category',category),
        button('Regel speichern','Save rule',()=>mutate(p=>({...p,rules:saveRule(p.rules,{id:ruleSelect.value||crypto.randomUUID(),match:match.value,category:category.value})}))),
        button('Regel löschen','Delete rule',()=>{if(ruleSelect.value&&confirm(t('Regel löschen?','Delete rule?')))mutate(p=>({...p,rules:removePreference(p.rules,ruleSelect.value)}));}));
    }catch{}
  }
  preferences.addEventListener('toggle',()=>{if(preferences.open)refreshPreferences();});
  details.append(preferences);
  details.append(localized('p','Die Datei bleibt auf deinem Gerät. Erst die bestätigten Buchungen werden gespeichert.','The file stays on your device. Only confirmed transactions are saved.'),form,button('Datei lesen','Read file',read),map,button('Vorschau öffnen','Open preview',showPreview),status,preview,undo);
  details.addEventListener('toggle',()=>{if(details.open)refreshUndo();});
  root.append(details);
  return {refreshUndo,clear};
}
