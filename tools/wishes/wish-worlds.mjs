import {categories,matchingIdeas} from './gift-ideas.mjs';
const $=id=>document.getElementById(id);
const topics=[{id:'any',label:'Alle Ideen',icon:'✨'},...categories];
let selected='any';
function drawTopics(){
 const root=$('wishWorldsTopics');root.replaceChildren();
 for(const topic of topics){
  const button=document.createElement('button');button.type='button';button.className='wish-worlds-topic';
  button.textContent=topic.icon+' '+topic.label;button.setAttribute('aria-pressed',String(selected===topic.id));
  button.addEventListener('click',()=>{selected=topic.id;drawTopics();render()});root.append(button);
 }
}
function render(){
 const query=$('wishWorldsSearch').value;
 const sort=$('wishWorldsSort').value;
 const matches=matchingIdeas({interest:selected,query});
 if(sort==='az')matches.sort((a,b)=>a.title.localeCompare(b.title,'de'));
 if(sort==='za')matches.sort((a,b)=>b.title.localeCompare(a.title,'de'));
 const grid=$('wishWorldsGrid');grid.replaceChildren();
 for(const item of matches){
  const category=categories.find(c=>c.id===item.category);
  const card=document.createElement('article');card.className='wish-world-card';
  const cover=document.createElement('div');cover.className='wish-world-cover';cover.textContent=category.icon;cover.setAttribute('aria-hidden','true');
  const body=document.createElement('div');body.className='wish-world-card-body';
  const tag=document.createElement('span');tag.className='wish-world-tag';tag.textContent=category.label;
  const title=document.createElement('strong');title.textContent=item.title;
  const description=document.createElement('p');description.textContent='Allgemeine Geschenkidee · Kein Produktangebot und kein geprüfter Preis';
  body.append(tag,title,description);card.append(cover,body);grid.append(card);
 }
 $('wishWorldsStatus').textContent=matches.length?matches.length+' unverbindliche Geschenkideen gefunden.':'Keine passende Idee gefunden. Probiere ein anderes Thema.';
}
$('wishWorldsSearch').addEventListener('input',render);
$('wishWorldsSort').addEventListener('change',render);
drawTopics();render();
