/* Toolya: contextual Amazon PartnerNet links. No tracking on Toolya itself. */
(function(){
'use strict';
const TAG='duhrrom-21';
const suggestions={
 car:{title:'Praktisches Zubehör für dein Auto',items:[['Reifendruckprüfer','reifendruckprüfer auto'],['Profiltiefenmesser','reifen profiltiefenmesser'],['Kofferraum-Organizer','kofferraum organizer']]},
 moving:{title:'Material für deinen Umzug',items:[['Umzugskartons','umzugskartons stabil'],['Klebeband & Abroller','paketklebeband abroller'],['Beschriftungsetiketten','umzug etiketten beschriften']]},
 'pet-health':{title:'Praktisches Zubehör für Haustiere',items:[['Transportboxen','tier transportbox'],['Fellpflege','fellpflege bürste hund katze'],['Reisenäpfe','faltbarer reisenapf hund']]},
 budget:{title:'Hilfen für deine Haushaltsorganisation',items:[['Belegordner','kassenbon beleg ordner'],['Dokumentenablage','dokumentenablage haushalt']]},
 baking:{title:'Weiteres Backzubehör',items:[]}
};
function url(query){return 'https://www.amazon.de/s?k='+encodeURIComponent(query)+'&tag='+TAG;}
function normalize(href){
 try{
  const u=new URL(href,location.href);
  if(!/^(www\.)?amazon\.de$/i.test(u.hostname))return null;
  if(!/^https?:$/.test(u.protocol))return null;
  // Never change product links imported by visitors or saved in wishlists.
  u.searchParams.set('tag',TAG);
  return u.toString();
 }catch{return null;}
}
function mark(link){
 if(link.dataset.toolyaAffiliateMarked)return;
 link.dataset.toolyaAffiliateMarked='1';
 link.setAttribute('rel','noopener noreferrer sponsored');
 const mark=document.createElement('span');
 mark.className='toolya-affiliate-label';
 mark.textContent='Anzeige';
 mark.setAttribute('aria-label','Werbelink');
 link.insertAdjacentElement('beforebegin',mark);
}
function existing(){
 document.querySelectorAll('a[href*="amazon.de"]').forEach(link=>{
  if(link.closest('[data-user-content],#wishlist-root'))return;
  const clean=normalize(link.getAttribute('href'));
  if(!clean)return;
  link.href=clean;
  mark(link);
 });
}
function add(){
 const tool=location.pathname.match(/\/tools\/([^/]+)\//)?.[1];
 const config=suggestions[tool];
 if(!config||!config.items.length)return;
 const main=document.querySelector('main');
 if(!main)return;
 const section=document.createElement('section');
 section.className='toolya-affiliate-suggestions';
 section.setAttribute('aria-label','Passendes Zubehör');
 const heading=document.createElement('h2');
 heading.textContent=config.title;
 section.append(heading);
 const group=document.createElement('div');
 group.className='toolya-affiliate-links';
 for(const [label,search] of config.items){
  const item=document.createElement('div');
  const a=document.createElement('a');
  a.textContent=label+' auf Amazon suchen ↗';
  a.href=url(search);
  a.target='_blank';
  item.append(a);
  group.append(item);
 }
 section.append(group);
 main.append(section);
}
function start(){add();existing();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
