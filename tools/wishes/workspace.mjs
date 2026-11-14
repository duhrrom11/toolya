// Four stable entry points; existing controls and data handlers stay in place.
const $=id=>document.getElementById(id);
const areas=[['lists','Meine Listen','index.html#listsDashboard'],['discover','Geschenkideen','index.html#wishWorlds'],['gifts','Geschenkplanung','index.html#geschenke'],['account','Konto','index.html#konto']];
const page=location.pathname.split('/').pop()||'index.html';
const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('./workspace.css',import.meta.url).href;document.head.append(css);
function link(text,href){const a=document.createElement('a');a.textContent=text;a.href=href;return a}
const nav=document.createElement('nav');nav.className='wishes-navigation';nav.setAttribute('aria-label','Wunschlisten-Hauptbereiche');
for(const [id,title,href] of areas){const a=link(title,'./'+href);a.dataset.area=id;nav.append(a)}
const main=$('main-content');
const views=new Map();
export function showWishlistArea(id,updateHash=true){
 if(!views.has(id))return;
 for(const [key,view] of views)view.hidden=key!==id;
 for(const a of nav.querySelectorAll('a')){if(a.dataset.area===id)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')}
 if(updateHash)history.replaceState(null,'',new URL('./'+areas.find(a=>a[0]===id)[2],location.href));
}
if(main&&$('listsDashboard')){
 const editorLink=$('editorNav');if(editorLink)editorLink.remove();
 document.querySelector('.wishlist-welcome')?.remove();
 document.querySelector('.wishlist-hub-nav')?.replaceWith(nav);
 const heading=document.querySelector('.wishlist-header h1');if(heading)heading.textContent='Meine Wunschwelt';
 for(const [id,title] of areas){const view=document.createElement('div');view.className='wishes-area';view.dataset.wishesArea=id;view.hidden=true;views.set(id,view);main.append(view)}
 if(editorLink){editorLink.classList.add('wishes-editor-link');views.get('lists').append(editorLink)}
 const move=(node,id)=>{if(node)views.get(id).append(node)};
 move($('listsDashboard'),'lists');
 const editor=$('editor');
 const profile=document.createElement('section');profile.className='wishes-account-panel';
 // Profile precedes the wish editor; backup follows it. Preserve every ID.
 const editorStart=$('wishEditorHeading')?.closest('.wish-editor-heading')||$('wishEditorHeading')?.parentElement?.parentElement;
 if(editorStart&&editorStart.parentElement===editor){while(editor.firstElementChild&&editor.firstElementChild!==editorStart)profile.append(editor.firstElementChild)}
 const backup=document.createElement('details');backup.className='wishes-account-panel';const summary=document.createElement('summary');summary.textContent='Daten sichern und Sicherung prüfen';backup.append(summary);
 const backupStart=[...editor.children].find(e=>e.tagName==='H2'&&e.textContent==='Meine Daten sichern');
 if(backupStart){let n=backupStart;while(n){const next=n.nextElementSibling;backup.append(n);n=next}}
 move(editor,'lists');move(profile,'account');move(backup,'account');
 // Removed social notifications, reservations and bookmarks shortcuts.
 const signInHint=(id,text)=>{const p=document.createElement('section');p.className='wishes-signin';const h=document.createElement('h2');h.textContent=text;const note=document.createElement('p');note.textContent='Melde dich über „Konto“ oben an. Deine persönlichen Wunschlisten bleiben nach der Anmeldung verfügbar.';const button=document.createElement('button');button.type='button';button.textContent='Anmelden / Registrieren';button.onclick=()=>{const menu=$('wishlistAuthMenu');menu.open=true;menu.querySelector('summary')?.focus()};p.append(h,note,button);views.get(id).prepend(p);return p};
 const listHint=signInHint('lists','Deine Listen an einem Ort');const accountHint=signInHint('account','Dein Konto');
 const syncAuth=()=>{const signedIn=!editor.hidden;profile.hidden=!signedIn;backup.hidden=!signedIn;listHint.hidden=signedIn;accountHint.hidden=signedIn};syncAuth();new MutationObserver(syncAuth).observe(editor,{attributes:true,attributeFilter:['hidden']});
 for(const node of [$('wishWorlds'),$('giftFinder')])move(node,'discover');
 const finder=$('giftFinder');if(finder){const d=document.createElement('details');d.className='wishes-disclosure';const s=document.createElement('summary');s.textContent='Passende Geschenkideen finden';d.append(s);finder.before(d);d.append(finder)}
 const gifts=document.createElement('section');gifts.className='wishes-gift-hub';const gh=document.createElement('h2');gh.textContent='Geschenke planen';const gp=document.createElement('p');gp.textContent='Von der Idee bis zum fertigen Geschenk – hier findest du deine Planung.';gifts.append(gh,gp);const cards=document.createElement('div');cards.className='wishes-gift-links';
 for(const [title,description,url] of [['Geschenke & Budget','Ideen zuordnen und Budget planen','planner.html'],['Planungsassistenz','Geschenkideen und nächste Schritte','assistant.html']]){const a=link(title,'./'+url);const small=document.createElement('span');small.textContent=description;a.append(small);cards.append(a)}gifts.append(cards);views.get('gifts').append(gifts);
 const advanced=document.createElement('details');advanced.className='wishes-disclosure';const advancedTitle=document.createElement('summary');advancedTitle.textContent='Planungshilfen und Auswertungen';advanced.append(advancedTitle);const more=document.createElement('div');more.className='wishes-shortcuts';for(const [title,url] of [['Planungscockpit','cockpit.html'],['Jahresstatistik','gift-analytics.html'],['Aktivitätsbericht','report.html']])more.append(link(title,'./'+url));advanced.append(more);views.get('gifts').append(advanced);
 // Legacy gift dashboard remains in the DOM for compatibility but is no longer a navigation destination.
 function fromHash(){let target;try{target=$(decodeURIComponent(location.hash.slice(1)))}catch{}const hash=location.hash;const id=hash==='#konto'?'account':hash==='#geschenke'?'gifts':target?.closest('[data-wishes-area]')?.dataset.wishesArea||(new URLSearchParams(location.search).has('profile')?'discover':'lists');showWishlistArea(id,false);if(target){for(let p=target.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true}}
 addEventListener('hashchange',fromHash);fromHash();
 nav.addEventListener('click',e=>{const a=e.target.closest('a[data-area]');if(!a)return;e.preventDefault();showWishlistArea(a.dataset.area);nav.scrollIntoView({block:'start',behavior:'auto'})});
 // Editing a wish from the discovery feed must reveal the editor before focus.
 document.addEventListener('click',e=>{const b=e.target.closest('button');if(b&&b.closest('#feed')&&b.textContent.trim()==='Bearbeiten')showWishlistArea('lists')},true);
}else{
 const header=document.querySelector('header');if(header)header.after(nav);
 const group=['planner.html','assistant.html','cockpit.html','gift-analytics.html','report.html'].includes(page)?'gifts':['profile.html','notifications.html','bookmarks.html'].includes(page)?'account':'discover';
 nav.querySelector(`[data-area="${group}"]`)?.setAttribute('aria-current','page');
}
