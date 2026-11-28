import {createHouseholdApi,sharedBooking} from './budget-household.mjs';
export function mountHousehold(root,context,client){
 const api=createHouseholdApi(client),en=()=>window.__toolyaUILocale==='en',t=(a,b)=>en()?b:a;
 const el=(tag,txt)=>{const n=document.createElement(tag);if(txt!=null)n.textContent=txt;return n;};
 const details=el('details'),summary=el('summary','Gemeinsame Haushaltskasse'),body=el('div'),status=el('p');summary.dataset.toolEn='Shared household budget';details.className='border rounded-xl p-3 space-y-3';body.className='space-y-3';status.setAttribute('role','status');details.append(summary,body,status);root.append(details);
 let generation=0,busy=false;
 const clear=()=>{generation++;body.replaceChildren();status.textContent='';};
 async function render(){
 clear();if(!details.open)return;
 const token=generation;
 try{
 const ctx=context.context(),uid=await api.identity(),valid=()=>token===generation&&context.sameContext(ctx)&&uid===ctx.user;
 if(!valid())return;
 const data=await api.list(uid);if(!valid())return;
 const input=label=>{const n=el('input');n.placeholder=label;n.setAttribute('aria-label',label);n.className='border rounded p-2 w-full';return n;};
 const button=(a,b,fn)=>{const n=el('button',t(a,b));n.type='button';n.className='border rounded p-2';n.addEventListener('click',fn);return n;};
 const run=async fn=>{if(busy||!valid())return;busy=true;try{await fn();if(valid())await render();}catch{if(valid())status.textContent=t('Aktion nicht bestätigt. Bitte neu laden.','Action not confirmed. Reload and check.');}finally{busy=false;}};
 const money=c=>new Intl.NumberFormat(en()?'en-GB':'de-DE',{style:'currency',currency:'EUR'}).format(Number(c)/100);
 const title=input(t('Name der Haushaltskasse','Household name'));
 body.append(el('p',t('Nur ausdrücklich freigegebene Kopien sind sichtbar. Private Buchungen bleiben privat.','Only explicitly shared copies are visible. Private transactions stay private.')),el('p',t('Deine Einladungs-ID: ','Your invitation ID: ')+uid),title,button('Haushaltskasse erstellen','Create household',()=>run(()=>api.create(uid,title.value))),button('Neu laden','Reload',()=>render()));
 for(const i of data.invites.filter(i=>i.invitee_id===uid&&!i.accepted)){
 const row=el('div');row.append(el('p',t('Einladung von ','Invitation from ')+i.owner_id),button('Annehmen','Accept',()=>run(()=>api.accept(uid,i.household_id))),button('Ablehnen','Decline',()=>run(()=>api.revokeMember(uid,i.household_id,uid))));body.append(row);}
 for(const h of data.households){
 const section=el('section');section.className='border rounded p-3 space-y-2';section.append(el('h4',h.title));
 if(h.owner_id===uid){const invitee=input(t('Einladungs-ID des Mitglieds','Member invitation ID'));section.append(invitee,button('Einladen','Invite',()=>run(()=>api.invite(uid,h.id,invitee.value.trim()))));
 for(const i of data.invites.filter(i=>i.household_id===h.id)){const row=el('div',i.invitee_id+' · '+(i.accepted?t('Angenommen','Accepted'):t('Ausstehend','Pending')));row.append(button('Entfernen','Remove',()=>run(()=>{if(confirm(t('Mitglied und dessen Freigaben entfernen?','Remove member and their shares?')))return api.revokeMember(uid,h.id,i.invitee_id);})));section.append(row);}
 }else section.append(button('Haushaltskasse verlassen','Leave household',()=>run(()=>{if(confirm(t('Haushaltskasse verlassen und eigene Freigaben entfernen?','Leave household and remove your shares?')))return api.revokeMember(uid,h.id,uid);})));
 const shares=data.shares.filter(s=>s.household_id===h.id),picker=el('select');picker.setAttribute('aria-label',t('Ausgabe auswählen','Choose expense'));
 for(const booking of context.entries()){try{const p=sharedBooking(h.id,uid,booking);if(shares.some(s=>s.author_id===uid&&String(s.booking_id)===String(p.booking_id)))continue;const option=el('option',p.booking_date+' · '+p.title+' · '+money(p.cents));option.value=String(p.booking_id);picker.append(option);}catch{}}
 section.append(picker,button('Ausgabe freigeben','Share expense',()=>run(async()=>{const booking=context.entries().find(b=>String(b.id)===picker.value);if(!booking)throw Error('missing');const p=sharedBooking(h.id,uid,booking);if(confirm(t('Diese Kopie freigeben: ','Share this copy: ')+p.title+' · '+p.booking_date+' · '+money(p.cents)))await api.share(uid,h.id,booking);})));
 let total=0n;for(const s of shares){total+=BigInt(s.cents);const row=el('div',s.booking_date+' · '+s.title+' · '+money(s.cents));if(s.author_id===uid)row.append(button('Freigabe widerrufen','Revoke share',()=>run(()=>api.revokeShare(uid,h.id,s.booking_id))));section.append(row);}
 section.append(el('p',t('Summe freigegebener Ausgaben: ','Total shared expenses: ')+money(total)));body.append(section);
 }
 }catch{if(token===generation)status.textContent=t('Gemeinsame Haushaltskasse nicht verfügbar.','Shared household budget unavailable.');}
 }
 details.addEventListener('toggle',render);document.addEventListener('toolya:locale-change',render);return {render,clear};
}
