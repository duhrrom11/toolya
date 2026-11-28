import {parseCents,decimalCents,addCents} from './budget-domain.mjs';
import {categories} from './budget-organization.mjs';
import {isIncome,centsOf,setSplits,linkRefund,linkTransfer,unlinkBooking,purchaseNet,transferCandidates} from './budget-relations.mjs';
export function mountRelations(root,api){
 const en=()=>window.__toolyaUILocale==='en',t=(de,english)=>en()?english:de;
 const el=(tag,text)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;return n;};
 const money=c=>new Intl.NumberFormat(en()?'en-GB':'de-DE',{style:'currency',currency:'EUR'}).format(c/100);
 const details=el('details');details.className='border rounded-xl p-3 space-y-3';
 const summary=el('summary','Buchungen aufteilen und verknüpfen');summary.dataset.toolEn='Split and link transactions';details.append(summary);
 const body=el('div'),status=el('p');status.setAttribute('role','status');details.append(body,status);root.append(details);
 let busy=false;
 function render(){
  body.replaceChildren();if(!details.open)return;
  try{
   const ctx=api.context(),entries=api.entries().filter(r=>r&&Number.isSafeInteger(r.id));
   const picker=(rows,label)=>{const s=el('select');s.className='w-full border rounded-lg p-2';s.setAttribute('aria-label',label);for(const r of rows){const o=el('option',r.date+' · '+r.title+' · '+r.price+' €');o.value=String(r.id);s.append(o);}return s;};
   const field=(label,node)=>{const l=el('label');l.className='block space-y-1';l.append(el('span',label),node);return l;};
   const booking=picker(entries,t('Buchung','Transaction')),editor=el('div');editor.className='space-y-2';
   body.append(field(t('Buchung auswählen','Select transaction'),booking),editor);
   function draw(){
    editor.replaceChildren();const r=entries.find(x=>x.id===Number(booking.value));if(!r)return;
    const run=async transform=>{if(busy||!api.sameContext(ctx))return;busy=true;try{await api.apply(ctx,items=>({entries:transform(items),changed:1}));status.textContent=t('Änderung gespeichert.','Change saved.');render();}catch{status.textContent=t('Änderung nicht gespeichert. Beträge und Verknüpfungen prüfen.','Change not saved. Check amounts and links.');}finally{busy=false;}};
    const button=(de,english,fn)=>{const b=el('button',t(de,english));b.type='button';b.className='border rounded-lg p-2';b.addEventListener('click',fn);return b;};
    if(r.transferId!=null||r.refundOf!=null){
      const other=entries.find(x=>x.id===(r.transferId??r.refundOf));editor.append(el('p',t('Verknüpft mit: ','Linked to: ')+(other?.title||'')+' · '+(other?.date||'')),button('Verknüpfung lösen','Unlink',()=>run(items=>unlinkBooking(items,r.id))));return;
    }
    if(!isIncome(r)){
      const net=purchaseNet(entries,r.id);
      if(net.refunds.length){editor.append(el('p',t('Kaufbetrag / Erstattungen / Nettokosten: ','Purchase / refunds / net cost: ')+[net.gross,net.returned,net.net].map(money).join(' / ')));for(const refund of net.refunds)editor.append(el('p',refund.date+' · '+money(centsOf(refund))));}
      const split=el('div');split.className='space-y-2';
      const total=el('p');const parts=[];
      function update(){try{const sum=addCents(...parts.map(p=>parseCents(p.amount.value,en()?'en':'de')));total.textContent=t('Noch zu verteilen: ','Remaining to allocate: ')+money(addCents(centsOf(r),-sum));}catch{total.textContent=t('Beträge prüfen','Check amounts');}}
      function add(part){const row=el('div'),category=el('select'),amount=el('input');row.className='flex gap-2 flex-wrap';amount.inputMode='decimal';amount.setAttribute('aria-label',t('Teilbetrag','Split amount'));category.setAttribute('aria-label',t('Kategorie','Category'));for(const key of categories){const o=el('option',api.categoryLabel(key));o.value=key;category.append(o);}category.value=part.category;amount.value=decimalCents(part.cents).replace('.',en()?'.':',');const p={category,amount};parts.push(p);amount.addEventListener('input',update);row.append(category,amount,button('Entfernen','Remove',()=>{parts.splice(parts.indexOf(p),1);row.remove();update();}));split.append(row);update();}
      editor.append(el('h4',t('Diesen Einkauf aufteilen','Split this purchase')),total,split);
      for(const p of r.splits?.length?r.splits:[{category:r.category,cents:centsOf(r)},{category:'Sonstiges',cents:0}])add(p);
      editor.append(button('Teilbetrag hinzufügen','Add split',()=>add({category:'Sonstiges',cents:0})),button('Aufteilung speichern','Save split',()=>run(items=>setSplits(items,r.id,parts.map(p=>({category:p.category.value,cents:parseCents(p.amount.value,en()?'en':'de')}))))),button('Aufteilung entfernen','Remove split',()=>run(items=>setSplits(items,r.id,[]))));
    }else{
      const eligible=entries.filter(x=>!isIncome(x)&&x.transferId==null&&x.refundOf==null&&x.date<=r.date);
      if(eligible.length){const target=picker(eligible,t('Ursprünglicher Kauf','Original purchase'));editor.append(field(t('Rückerstattung für','Refund for'),target),button('Rückerstattung verknüpfen','Link refund',()=>run(items=>linkRefund(items,r.id,Number(target.value)))));}
    }
    const candidates=transferCandidates(entries,r.id);
    if(candidates.length){
      const target=picker(candidates,t('Gegenbuchung','Matching transaction'));
      const a=el('input'),b=el('input');a.maxLength=b.maxLength=120;a.value=r.accountLabel||r.bankImport?.source||'';
      const fill=()=>{const other=candidates.find(x=>x.id===Number(target.value));b.value=other?.accountLabel||other?.bankImport?.source||'';};target.addEventListener('change',fill);fill();
      editor.append(el('h4',t('Umbuchung zwischen eigenen Konten','Transfer between own accounts')),field(t('Gegenbuchung','Matching transaction'),target),field(t('Dieses Konto','This account'),a),field(t('Anderes Konto','Other account'),b),button('Umbuchung verknüpfen','Link transfer',()=>run(items=>linkTransfer(items,r.id,Number(target.value),a.value,b.value))));
    }
   }
   booking.addEventListener('change',draw);draw();
  }catch{status.textContent=t('Cloud nicht bereit.','Cloud not ready.');}
 }
 details.addEventListener('toggle',render);document.addEventListener('toolya:locale-change',render);
 return {render};
}
