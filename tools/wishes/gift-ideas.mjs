// Curated, generic idea prompts. No public wishes, accounts, prices or network calls.
export const ideas=[
 {title:'Kopfhörer-Organizer',category:'gaming',occasions:['birthday','christmas'],budget:'20'},
 {title:'Schreibtisch-Zubehör',category:'gaming',occasions:['birthday','thanks'],budget:'50'},
 {title:'Notizbuch und Stifte',category:'books',occasions:['birthday','thanks'],budget:'20'},
 {title:'Kreativ-Set',category:'books',occasions:['birthday','christmas'],budget:'50'},
 {title:'Küchenhelfer',category:'home',occasions:['wedding','christmas'],budget:'50'},
 {title:'Zimmerpflanze mit Übertopf',category:'home',occasions:['wedding','thanks'],budget:'50'},
 {title:'Pflege-Geschenkset',category:'beauty',occasions:['birthday','thanks'],budget:'50'},
 {title:'Entspannungs-Set',category:'beauty',occasions:['christmas','thanks'],budget:'50'},
 {title:'Trinkflasche für unterwegs',category:'sports',occasions:['birthday','christmas'],budget:'50'},
 {title:'Outdoor-Tagesrucksack',category:'sports',occasions:['birthday','christmas'],budget:'100'},
 {title:'Puzzle',category:'kids',occasions:['baby','christmas'],budget:'20'},
 {title:'Baukasten',category:'kids',occasions:['baby','birthday'],budget:'50'}
];
export const categories=[
 {id:'gaming',label:'Gaming & Technik',icon:'🎮'},
 {id:'books',label:'Bücher & Kreativität',icon:'📚'},
 {id:'home',label:'Wohnen & Küche',icon:'🏡'},
 {id:'beauty',label:'Beauty & Wellness',icon:'🧴'},
 {id:'sports',label:'Sport & Abenteuer',icon:'🏕️'},
 {id:'kids',label:'Familie & Spielen',icon:'🧸'}
];
export function matchingIdeas({interest='any',occasion='any',query='',budget='any'}={}){
 const search=String(query).trim().toLocaleLowerCase('de-DE');
 return ideas.filter(idea=>(interest==='any'||idea.category===interest)&&(occasion==='any'||idea.occasions.includes(occasion))&&(!search||idea.title.toLocaleLowerCase('de-DE').includes(search))).map(idea=>({...idea,budgetNote:budget==='any'?'': 'Budget ist eine Orientierung, kein geprüfter Produktpreis.'}));
}
