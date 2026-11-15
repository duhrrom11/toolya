import {categories,matchingIdeas} from './gift-ideas.mjs';
const $=id=>document.getElementById(id);
function search(){
 const interest=$('giftFinderInterest').value,occasion=$('giftFinderOccasion').value,budget=$('giftFinderBudget').value;
 const results=matchingIdeas({interest,occasion,budget});
 const container=$('giftFinderResults');container.replaceChildren();
 for(const item of results.slice(0,6)){
  const card=document.createElement('article');card.className='gift-finder-card';
  const tag=document.createElement('span');tag.className='gift-finder-tag';tag.textContent='✨ Ideenanstoß';
  const title=document.createElement('strong');title.textContent=item.title;
  const detail=document.createElement('p');detail.textContent=(categories.find(c=>c.id===item.category)?.label||'Geschenkidee')+' · Allgemeiner Vorschlag, kein geprüftes Produktangebot';
  card.append(tag,title,detail);container.append(card);
 }
 const budgetNote=budget==='any'?'':' Die Budgetauswahl ist eine Orientierung; konkrete Preise sind nicht bekannt.';
 $('giftFinderStatus').textContent=results.length?results.length+' Ideen zu deinen Angaben gefunden.'+budgetNote:'Keine genaue Übereinstimmung. Wähle ein anderes Interesse oder einen anderen Anlass.'+budgetNote;
}
$('giftFinderForm').addEventListener('submit',event=>{event.preventDefault();search();$('giftFinderForm').reset()});
$('giftFinderReset').addEventListener('click',()=>{setTimeout(()=>{$('giftFinderResults').replaceChildren();$('giftFinderStatus').textContent='Beantworte drei Fragen und entdecke allgemeine Geschenkideen.'},0)});
$('giftFinderStatus').textContent='Beantworte drei Fragen und entdecke allgemeine Geschenkideen.';
