/* Toolya: contextual Amazon PartnerNet links. No tracking on Toolya itself. */
(function(){
'use strict';
const TAG='duhrrom-21';
const suggestions={
 car:{title:'Praktisches Zubehör für dein Auto',items:[['Reifendruckprüfer','reifendruckprüfer auto'],['Profiltiefenmesser','reifen profiltiefenmesser'],['Kofferraum-Organizer','kofferraum organizer']]},
 moving:{title:'Material für deinen Umzug',items:[['Umzugskartons','umzugskartons stabil'],['Klebeband & Abroller','paketklebeband abroller'],['Beschriftungsetiketten','umzug etiketten beschriften']]},
 'pet-health':{title:'Praktisches Zubehör für Haustiere',items:[['Transportboxen','tier transportbox'],['Fellpflege','fellpflege bürste hund katze'],['Reisenäpfe','faltbarer reisenapf hund']]},
 budget:{title:'Hilfen für deine Haushaltsorganisation',items:[['Belegordner','kassenbon beleg ordner'],['Dokumentenablage','dokumentenablage haushalt']]},
 estate:{title:'Zubehör zur Dokumentenaufbewahrung',items:[['Feuerfeste Dokumententaschen','feuerfeste dokumententasche'],['Abschließbare Dokumentenboxen','abschliessbare dokumentenbox'],['Dokumentenordner & Register','dokumentenordner register']]},
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

// Generic category illustrations are deliberately not presented as photos of specific Amazon products.
const symbols=[
 ['reifen','🛞'],['auto','🚗'],['kofferraum','🧰'],['karton','📦'],['umzug','📦'],
 ['klebeband','📦'],['etikett','🏷️'],['transportbox','🐾'],['fell','🐕'],
 ['napf','🥣'],['beleg','🗂️'],['dokument','📁'],['ordner','📁'],
 ['tasche','🗃️'],['box','🗃️'],['springform','🎂'],['back','🥧'],
 ['thermometer','🌡️'],['pflanz','🪴'],['samen','🌱'],['garten','🌿'],
 ['wasser','💧'],['strom','🔌'],['energie','⚡'],['putz','🧹'],
 ['haushalt','🏠'],['park','🅿️'],['tracker','📍'],['werkzeug','🧰'],
 ['zucker','🍬'],['küche','🍳']
];
function illustration(label){
 const name=label.toLocaleLowerCase('de');
 const symbol=symbols.find(([key])=>name.includes(key))?.[1]||'🛍️';
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120"><rect width="160" height="120" rx="16" fill="#fff4e9"/><circle cx="80" cy="60" r="43" fill="#ffe0c7"/><text x="80" y="79" font-size="52" text-anchor="middle">'+symbol+'</text></svg>';
 return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
}
function addIllustration(link){
 if(link.querySelector('.toolya-affiliate-picture'))return;
 const label=(link.textContent||'Zubehör').trim();
 const picture=document.createElement('img');
 picture.className='toolya-affiliate-picture';
 picture.src=illustration(label);
 picture.alt='Symbolbild: '+label;
 picture.width=112;picture.height=84;
 picture.loading='lazy';picture.decoding='async';
 link.prepend(picture);
 link.classList.add('toolya-affiliate-visual');
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
 if(!link.closest('[data-user-content]'))addIllustration(link);
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
