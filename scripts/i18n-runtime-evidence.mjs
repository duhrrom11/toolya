// Only same-run browser assertions with exact source occurrence and catalogue match count.
export function attachRuntimeEvidence(dynamic,report,read){
 const specs=[];
 function walk(s){for(const spec of s.specs||[])specs.push(spec);for(const child of s.suites||[])walk(child)}
 for(const suite of report?.suites||[])walk(suite);
 const claims=[];
 for(const spec of specs){
  if(!spec.title.startsWith('i18n runtime catalogue: ')||spec.ok!==true||spec.tests?.length!==1)continue;
  const t=spec.tests[0],result=t.results?.at(-1);
  if(t.status!=='expected'||result?.status!=='passed')continue;
  const notes=(t.annotations||[]).filter(a=>a.type==='toolya-runtime-message');
  if(notes.length!==1)continue;
  let claim;try{claim=JSON.parse(notes[0].description)}catch{continue}
  if(!/^tools\/[a-z-]+\/index\.html$/.test(claim.file)||!/^\w+$/.test(claim.handler)||typeof claim.de!=='string'||typeof claim.en!=='string')continue;
  const kind=claim.kind??'alert';
  if(!['alert','confirm'].includes(kind))continue;
  if(kind==='confirm'&&(!Number.isInteger(claim.line)||claim.line<1))continue;
  claims.push({...claim,kind,test:spec.title});
 }
 let verified=0;
 for(const item of dynamic){
  const source=read(item.file).split('\n');
  for(const occurrence of item.sightings){
   if(!['catalogue-match-runtime-unverified','explicit-branch-runtime-unverified'].includes(occurrence.catalogueState)||!['alert','confirm'].includes(occurrence.kind))continue;
   const matches=claims.filter(c=>c.file===item.file&&c.kind===occurrence.kind&&c.de===occurrence.literal&&c.en===occurrence.english&&(!c.line||c.line===occurrence.line));
   if(matches.length!==1)continue;
   const claim=matches[0];
   // Restrict to the nearest named function and reject duplicate matching literals in that function.
   const before=source.slice(0,occurrence.line).join('\n');
   const declarations=[...before.matchAll(/\bfunction\s+([\w$]+)\s*\(/g)];
   if(declarations.at(-1)?.[1]!==claim.handler)continue;
   const duplicates=item.sightings.filter(o=>o.literal===claim.de&&o.kind===occurrence.kind&&[...source.slice(0,o.line).join('\n').matchAll(/\bfunction\s+([\w$]+)\s*\(/g)].at(-1)?.[1]===claim.handler);
   if(duplicates.length!==1)continue;
   occurrence.catalogueState='runtime-browser-verified';
   occurrence.evidence={test:claim.test,handler:claim.handler,de:claim.de,en:claim.en,revision:process.env.GITHUB_SHA||null,run:process.env.GITHUB_RUN_ID||null};
   verified++;
  }
 }
 return verified;
}
