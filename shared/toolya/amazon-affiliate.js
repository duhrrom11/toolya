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

/* Real product images are shown only when a verified image URL is supplied.
   Search links do not identify a product and must not display a fabricated photo. */
function verifiedImage(link){
 const value=link.getAttribute('data-amazon-image');
 if(!value)return null;
 try{
  const u=new URL(value);
  if(u.protocol!=='https:'||u.username||u.password||u.port)return null;
  if(!['m.media-amazon.com','images-eu.ssl-images-amazon.com','images-na.ssl-images-amazon.com','images.ssl-images-amazon.com'].includes(u.hostname) && !['brennenstuhl.com','www.brennenstuhl.com','tesa.com','www.tesa.com'].includes(u.hostname))return null;
  return u.href;
 }catch{return null;}
}
function addProductImage(link){
 if(link.querySelector('.toolya-affiliate-picture'))return;
 const src=verifiedImage(link);
 if(!src)return;
 const picture=document.createElement('img');
 picture.className='toolya-affiliate-picture';
 picture.src=src;
 picture.alt='';
 picture.width=112;picture.height=112;
 picture.loading='lazy';picture.decoding='async';picture.referrerPolicy='no-referrer';
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
 if(!link.closest('[data-user-content]'))addProductImage(link);
}
const verifiedProducts={
 'energiekostenmessgerät stromzähler':{asin:'B007459MH6',name:'Brennenstuhl Primera-Line PM 231 E Energiekostenmessgerät'}
};
function upgradeVerified(link){
 const href=link.getAttribute('href')||'';
 let query='';try{query=new URL(href,location.href).searchParams.get('k')||''}catch{return}
 const product=verifiedProducts[query.toLocaleLowerCase('de')];
 if(!product)return;
 link.href='https://www.amazon.de/dp/'+product.asin+'?tag='+TAG;
 link.textContent=product.name+' bei Amazon ansehen ↗';
}
function existing(){
 document.querySelectorAll('a[href*="amazon.de"]').forEach(link=>{
  if(link.closest('[data-user-content],#wishlist-root'))return;
  const clean=normalize(link.getAttribute('href'));
  if(!clean)return;
  link.href=clean;
  upgradeVerified(link);
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
// Do not inject generic Amazon searches: show only curated, concrete products.
async function loadCatalog(){
 const tool=location.pathname.match(/\/tools\/([^/]+)\//)?.[1];
 if(!tool||tool==='wishes')return;
 let catalog;
 try{const response=await fetch('/shared/toolya/amazon-catalog.json',{credentials:'omit'});if(!response.ok)return;catalog=await response.json()}catch{return}
 const products=Array.isArray(catalog[tool])?catalog[tool]:[];
 const main=document.querySelector('main');
 if(!main||!products.length)return;
 const section=document.createElement('section');section.className='toolya-affiliate-suggestions';
 const title=document.createElement('h2');title.textContent='Passende Produkte';section.append(title);
 const group=document.createElement('div');group.className='toolya-affiliate-links';
 for(const p of products){
  if(!/^[A-Z0-9]{10}$/.test(p.asin||'')||typeof p.title!=='string'||!p.title.trim())continue;
  const wrapper=document.createElement('div'),a=document.createElement('a');
  a.href='https://www.amazon.de/dp/'+p.asin+'?tag='+TAG;a.target='_blank';
  a.textContent=p.title+' bei Amazon ansehen ↗';
  if(typeof p.imageUrl==='string')a.dataset.amazonImage=p.imageUrl;
  wrapper.append(a);group.append(wrapper);
 }
 if(!group.children.length)return;
 section.append(group);main.append(section);existing();
}
function start(){existing();loadCatalog();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
