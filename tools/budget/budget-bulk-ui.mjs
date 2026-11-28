import {bulkEdit,categories} from './budget-organization.mjs';
export function mountBulkEdit(root,api){
  const en=()=>window.__toolyaUILocale==='en';
  const t=(de,english)=>en()?english:de;
  const el=(tag,text)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;return n;};
  const details=el('details');details.className='border rounded-xl p-3 space-y-2';
  const summary=el('summary','Buchungen gesammelt bearbeiten');summary.dataset.toolEn='Edit multiple transactions';details.append(summary);
  const panel=el('div');panel.className='space-y-2';details.append(panel);
  const status=el('p');status.setAttribute('role','status');details.append(status);root.append(details);
  let rows=[],selection=new Set(),busy=false,context=null;
  function paint(){
    panel.replaceChildren();
    const list=el('div');list.className='max-h-64 overflow-auto space-y-1';
    const count=el('p');
    const all=el('button',t('Alle sichtbaren auswählen','Select all visible'));all.type='button';
    const none=el('button',t('Auswahl aufheben','Clear selection'));none.type='button';
    const category=el('select');category.setAttribute('aria-label',t('Neue Kategorie','New category'));
    for(const key of categories){const opt=el('option',api.categoryLabel(key));opt.value=key;category.append(opt);}
    const actions=el('div');actions.className='flex gap-2 flex-wrap';
    const buttons=[];
    const action=(de,english,getPatch)=>{
      const b=el('button',t(de,english));b.type='button';b.className='border rounded-lg p-2';buttons.push(b);
      b.addEventListener('click',async()=>{
        if(busy||!selection.size||!api.sameContext(context))return;
        const ids=[...selection],visible=rows.map(r=>r.id),patch=getPatch();
        if(!confirm(t(ids.length+' ausgewählte Buchungen ändern?', 'Change '+ids.length+' selected transactions?')))return;
        busy=true;update();
        try{
          const result=await api.apply(context,entries=>bulkEdit(entries,ids,visible,patch));
          status.textContent=t(result.changed+' Buchungen gespeichert.',result.changed+' transactions saved.');
        }catch{status.textContent=t('Änderung nicht gespeichert. Auswahl und Datenstand prüfen.','Changes not saved. Check selection and data version.');}
        finally{busy=false;update();}
      });
      return b;
    };
    actions.append(category,action('Kategorie ändern','Change category',()=>({category:category.value})),action('Noch prüfen','Mark for review',()=>({needsReview:true})),action('Prüfung erledigt','Mark reviewed',()=>({needsReview:false})));
    const checks=[];
    function update(){
      count.textContent=t(selection.size+' von '+rows.length+' sichtbaren Buchungen ausgewählt',selection.size+' of '+rows.length+' visible transactions selected');
      for(const b of buttons)b.disabled=busy||!selection.size;
    }
    for(const r of rows){
      const label=el('label');label.className='flex gap-2 items-start break-all';
      const box=el('input');box.type='checkbox';box.checked=selection.has(r.id);
      box.addEventListener('change',()=>{if(box.checked)selection.add(r.id);else selection.delete(r.id);update();});
      label.append(box,el('span',r.date+' · '+r.title+' · '+r.price+' €'));list.append(label);checks.push([r.id,box]);
    }
    all.addEventListener('click',()=>{selection=new Set(rows.map(r=>r.id));for(const [,box] of checks)box.checked=true;update();});
    none.addEventListener('click',()=>{selection.clear();for(const [,box] of checks)box.checked=false;update();});
    panel.append(count,all,none,list,actions);update();
  }
  return {render(visible){
    // Reset on every history render, including filtering and account changes.
    rows=visible.filter(r=>Number.isSafeInteger(r.id));selection.clear();
    try{context=api.context();}catch{context=null;rows=[];}
    paint();
  }};
}
