/**
 * Public wish worlds, built from already rendered community wishes.
 * No extra API calls, no scraping, no database writes.
 */
const byId=id=>document.getElementById(id);
const topics=[
 {id:'all',label:'Alle Ideen',icon:'✨',terms:[]},
 {id:'gaming',label:'Gaming & Technik',icon:'🎮',terms:['gaming','gamer','playstation','xbox','nintendo','switch','pc','computer','technik','elektronik','kopfhörer','headset','controller','smartphone','tablet','tastatur']},
 {id:'home',label:'Wohnen & Küche',icon:'🏡',terms:['wohnen','wohnung','küche','kochen','backen','deko','möbel','lampe','kaffee','tee','garten','pflanze','kissen','geschirr']},
 {id:'books',label:'Bücher & Kreativität',icon:'📚',terms:['buch','bücher','lesen','roman','manga','comic','zeichnen','malen','basteln','kunst','kreativ','notizbuch','stift']},
 {id:'beauty',label:'Beauty & Wellness',icon:'🧴',terms:['beauty','kosmetik','pflege','parfum','duft','wellness','haut','creme','massage','entspannung']},
 {id:'outdoor',label:'Sport & Abenteuer',icon:'🏕️',terms:['sport','fitness','training','wandern','outdoor','fahrrad','yoga','camping','schwimmen','rucksack','laufen']},
 {id:'kids',label:'Familie & Spielen',icon:'🧸',terms:['kinder','baby','spielzeug','lego','puzzle','kuscheltier','puppe','familie','baustein','tonie','spiel']}
];
let selected='all',shuffleSeed=0;
const lower=value=>String(value||'').toLocaleLowerCase('de-DE');
function readPublicWishes(){
 const feed=byId('feed');
 if(!feed)return [];
 return [...feed.querySelectorAll('.item')].map((item,index)=>{
  const title=item.querySelector('strong')?.textContent?.trim();
  const link=[...item.querySelectorAll('a[href]')].find(a=>a.href.startsWith('https://www.amazon.de/')&&a.textContent.includes('Amazon'));
  if(!title||!link)return null;
  const note=[...item.querySelectorAll('p')].map(p=>p.textContent||'').join(' ');
  const text=lower(title+' '+note);
  const matching=topics.slice(1).filter(topic=>topic.terms.some(term=>text.includes(term)));
  return {title,url:link.href,index,text,matching};
 }).filter(Boolean);
}
function drawTopics(){
 const root=byId('wishWorldsTopics');root.replaceChildren();
 for(const topic of topics){
  const button=document.createElement('button');button.type='button';button.className='wish-worlds-topic';
  button.textContent=topic.icon+' '+topic.label;
  button.setAttribute('aria-pressed',String(selected===topic.id));
  button.addEventListener('click',()=>{selected=topic.id;drawTopics();render()});
  root.append(button);
 }
}
function render(){
 const all=readPublicWishes();
 const query=lower(byId('wishWorldsSearch').value.trim());
 const topic=topics.find(item=>item.id===selected)||topics[0];
 let matches=all.filter(item=>(selected==='all'||item.matching.some(match=>match.id===selected))&&(!query||item.text.includes(query)));
 const sort=byId('wishWorldsSort').value;
 if(sort==='az')matches.sort((a,b)=>a.title.localeCompare(b.title,'de'));
 else if(sort==='za')matches.sort((a,b)=>b.title.localeCompare(a.title,'de'));
 else if(shuffleSeed)matches.sort((a,b)=>hash(a.title,shuffleSeed)-hash(b.title,shuffleSeed));
 const grid=byId('wishWorldsGrid');grid.replaceChildren();
 for(const item of matches.slice(0,18)){
  const card=document.createElement('article');card.className='wish-world-card';
  const cover=document.createElement('div');cover.className='wish-world-cover';
  cover.textContent=(item.matching[0]||topic).icon;
  cover.setAttribute('aria-hidden','true');
  const body=document.createElement('div');body.className='wish-world-card-body';
  const tag=document.createElement('span');tag.className='wish-world-tag';
  tag.textContent=(item.matching[0]||topic).label;
  const title=document.createElement('strong');title.textContent=item.title;
  const description=document.createElement('p');description.textContent='Öffentlicher Wunsch aus der Community · Preis nicht verfügbar';
  const link=document.createElement('a');link.href=item.url;link.target='_blank';link.rel='noopener noreferrer sponsored';link.textContent='Produkt entdecken ↗';
  body.append(tag,title,description,link);card.append(cover,body);grid.append(card);
 }
 const status=byId('wishWorldsStatus');
 status.textContent=!all.length?'Noch keine öffentlichen Wünsche geladen. Lade zuerst den Community-Feed weiter unten.':matches.length?matches.length+' Ideen in „'+topic.label+'“ gefunden · '+Math.min(18,matches.length)+' sichtbar.':'Noch keine Treffer. Probiere eine andere Themenwelt oder einen kürzeren Suchbegriff.';
}
function hash(value,seed){
 let h=seed|0;for(let i=0;i<value.length;i++)h=Math.imul(h^value.charCodeAt(i),16777619);return h>>>0;
}
byId('wishWorldsSearch').addEventListener('input',render);
byId('wishWorldsSort').addEventListener('change',render);
byId('wishWorldsShuffle').addEventListener('click',()=>{shuffleSeed=(shuffleSeed+1)|0;byId('wishWorldsSort').value='relevant';render()});
const feed=byId('feed');
if(feed){
 let queued=false;
 new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;render()})}).observe(feed,{childList:true});
}
drawTopics();render();
