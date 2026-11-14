/**
 * Helferlein gift finder: no paid API, no database writes, no fabricated prices.
 * Suggestions come exclusively from public wishlist cards already rendered in #feed.
 */
const $ = id => document.getElementById(id);
const interestTerms = {
 gaming: ['gaming','gamer','spielkonsole','playstation','xbox','nintendo','switch','computer','pc','technik','kopfhörer','headset','tastatur','maus','monitor','controller','smartphone','tablet','elektronik'],
 books: ['buch','bücher','roman','lesen','literatur','comic','manga','zeichnen','malen','basteln','kunst','kreativ','schreiben','notizbuch','stift'],
 home: ['küche','kochen','backen','wohnen','deko','lampe','möbel','haushalt','kaffee','tee','geschirr','garten','pflanze','kissen','wohnung'],
 beauty: ['beauty','kosmetik','pflege','parfum','duft','wellness','haut','creme','makeup','make-up','entspannung','massage','bad'],
 sports: ['sport','fitness','training','laufen','wandern','outdoor','fahrrad','yoga','camping','schwimmen','ball','rucksack','bewegung'],
 kids: ['kinder','baby','spielzeug','lego','puzzle','kuscheltier','puppe','familie','lernen','spiel','baustein','tonie']
};
const occasionTerms = {
 birthday: ['geburtstag','geschenk','überraschung','party'],
 christmas: ['weihnacht','advent','winter','fest','deko','kerze'],
 wedding: ['hochzeit','paar','einzug','wohnung','küche','wohnen','haushalt','deko'],
 baby: ['baby','kind','familie','spielzeug','kuscheltier','lernen'],
 thanks: ['danke','kleinigkeit','schokolade','kaffee','tee','kerze','buch','blume','wellness']
};
const normalize = value => String(value||'').toLocaleLowerCase('de-DE');
const containsTerm = (text,terms) => terms.some(term=>text.includes(term));
function getCandidates(){
 const feed=$('feed');
 if(!feed)return [];
 return [...feed.querySelectorAll('.item')].map((card,index)=>{
  const title=card.querySelector('strong')?.textContent?.trim();
  const link=[...card.querySelectorAll('a[href]')].find(a=>a.href.startsWith('https://www.amazon.de/')&&a.textContent.includes('Amazon'));
  if(!title||!link)return null;
  const note=[...card.querySelectorAll('p')].map(p=>p.textContent||'').join(' ');
  return {title,url:link.href,text:normalize(title+' '+note),index};
 }).filter(Boolean);
}
function rank(items,interest,occasion){
 return items.map(item=>{
  const interestMatch=interest==='any'||containsTerm(item.text,interestTerms[interest]||[]);
  const occasionMatch=occasion==='any'||containsTerm(item.text,occasionTerms[occasion]||[]);
  return {...item,interestMatch,occasionMatch,score:(interest!=='any'&&interestMatch?5:0)+(occasion!=='any'&&occasionMatch?2:0)};
 }).filter(item=>interest==='any'||item.interestMatch)
 .sort((a,b)=>b.score-a.score||a.index-b.index);
}
function render(items,random=false){
 const container=$('giftFinderResults');
 container.replaceChildren();
 for(const item of items.slice(0,6)){
  const card=document.createElement('article');card.className='gift-finder-card';
  const tag=document.createElement('span');tag.className='gift-finder-tag';tag.textContent=random?'🎲 Zufällige Inspiration':'✨ Aus der Community';
  const title=document.createElement('strong');title.textContent=item.title;
  const detail=document.createElement('p');detail.textContent='Öffentlich geteilter Wunsch · Preis und Verfügbarkeit nicht geprüft';
  const link=document.createElement('a');link.href=item.url;link.target='_blank';link.rel='noopener noreferrer sponsored';link.textContent='Bei Amazon ansehen ↗';
  card.append(tag,title,detail,link);container.append(card);
 }
}
function search(random=false){
 const items=getCandidates();
 if(!items.length){
  render([]);
  $('giftFinderStatus').textContent='Noch keine öffentlichen Wünsche geladen. Lade den Community-Feed unten und versuche es erneut.';
  return;
 }
 const interest=$('giftFinderInterest').value,occasion=$('giftFinderOccasion').value;
 let results=rank(items,random?'any':interest,random?'any':occasion);
 if(random){
  results=results.map(item=>({...item,randomKey:Math.random()})).sort((a,b)=>a.randomKey-b.randomKey);
 }
 render(results,random);
 const budget=$('giftFinderBudget').value;
 const budgetNote=budget==='any'?'':' Dein Budget ist vorgemerkt, aber mangels verlässlicher Produktpreise nicht als Preisfilter anwendbar.';
 $('giftFinderStatus').textContent=results.length
  ? Math.min(6,results.length)+' von '+results.length+' passenden Ideen aus '+items.length+' geladenen öffentlichen Wünschen.'+budgetNote
  : 'Für diese Interessen gibt es unter den aktuell geladenen Wünschen noch keine Treffer. Wähle „Überrasche mich“ oder lade weitere Wünsche.'+budgetNote;
}
$('giftFinderForm').addEventListener('submit',event=>{event.preventDefault();search()});
$('giftFinderSurprise').addEventListener('click',()=>search(true));
$('giftFinderReset').addEventListener('click',()=>{
 setTimeout(()=>{$('giftFinderResults').replaceChildren();$('giftFinderStatus').textContent='Wähle deine Interessen und starte den Geschenkfinder.'},0);
});
$('giftFinderStatus').textContent='Wähle deine Interessen und starte den Geschenkfinder. Öffentliche Wünsche werden aus dem Community-Feed übernommen.';
