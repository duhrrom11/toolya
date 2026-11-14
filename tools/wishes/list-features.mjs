export const LIST_TEMPLATES=Object.freeze([
 {id:'birthday',title:'Mein Geburtstag',description:'Alles, was ich mir zum Geburtstag wünsche.',icon:'🎂',color:'#E883A7'},
 {id:'christmas',title:'Weihnachtswünsche',description:'Geschenkideen für Weihnachten.',icon:'🎄',color:'#4EAA9D'},
 {id:'gaming',title:'Mein Gaming-Setup',description:'Spiele, Zubehör und Technik für mein Setup.',icon:'🎮',color:'#9D78E8'},
 {id:'home',title:'Meine Traumwohnung',description:'Einrichtung, Deko und praktische Helfer.',icon:'🏡',color:'#E7A94D'},
 {id:'travel',title:'Reisewünsche',description:'Ausrüstung und Ideen für meine nächste Reise.',icon:'✈️',color:'#5E8BD6'},
 {id:'books',title:'Bücher & Inspiration',description:'Lesestoff und kreative Entdeckungen.',icon:'📚',color:'#9D78E8'},
 {id:'cozy',title:'Meine Cozy-Wunschwelt',description:'Gemütliche Fundstücke, Deko und Wohlfühlmomente.',icon:'🕯️',color:'#E883A7'},
 {id:'wishlist-under-50',title:'Geschenkideen unter 50 €',description:'Meine persönlichen Geschenkideen mit einem Wunschbudget bis 50 € – Preise bitte selbst prüfen.',icon:'💝',color:'#4EAA9D'},
 {id:'creative',title:'Kreative Lieblingsstücke',description:'Kunst, DIY und Ideen für kreative Stunden.',icon:'🎨',color:'#E7A94D'},
 {id:'wellness',title:'Meine Wellness-Welt',description:'Alles für Entspannung und kleine Auszeiten.',icon:'🌸',color:'#E883A7'},
 {id:'custom',title:'Meine Wunschliste',description:'',icon:'🎁',color:'#9D78E8'}
]);
export const WISH_CATEGORIES=Object.freeze([{id:'tech',label:'💻 Technik'},{id:'gaming',label:'🎮 Gaming'},{id:'books',label:'📚 Bücher'},{id:'home',label:'🏡 Wohnen'},{id:'fashion',label:'👕 Mode'},{id:'travel',label:'✈️ Reisen'},{id:'other',label:'✨ Sonstiges'}]);
export function filterListWishes(items,{search='',priority='all',assignment='all',assignedIds=new Set(),sort='newest',category='all',categories={},marker='all',markers={}}={}){
 const term=search.trim().toLocaleLowerCase('de');
 return items.filter(w=>(marker==='all'||(marker==='none'?!markers[w.id]:markers[w.id]===marker))&&(category==='all'||(category==='uncategorized'?!categories[w.id]:categories[w.id]===category))&&(assignment==='all'||(assignment==='assigned')===assignedIds.has(w.id))&&(priority==='all'||String(w.priority)===priority)&&(!term||[w.wishlist_products?.title,w.note].some(v=>String(v||'').toLocaleLowerCase('de').includes(term)))).sort((a,b)=>sort==='priority'?(Number(a.priority)-Number(b.priority))||String(b.created_at).localeCompare(String(a.created_at)):sort==='oldest'?String(a.created_at).localeCompare(String(b.created_at)):sort==='title'?String(a.wishlist_products?.title||'').localeCompare(String(b.wishlist_products?.title||''),'de'):sort==='title-desc'?String(b.wishlist_products?.title||'').localeCompare(String(a.wishlist_products?.title||''),'de'):String(b.created_at).localeCompare(String(a.created_at)));
}
