import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const readTool=name=>readFile(new URL(`../../tools/${name}/index.html`,import.meta.url),'utf8');
function functionBody(html,start,end){
 const from=html.indexOf(start),to=html.indexOf(end,from+start.length);
 assert.ok(from>=0&&to>from,`isolated ${start}`);
 return html.slice(from,to);
}

for(const name of ['car','budget','pet-health','meters']){
 test(`${name}: dynamic account labels track EN/DE and preserve identity`,async()=>{
  const src=functionBody(await readTool(name),'async function updateUserDisplay() {','function openSettings()');
  const nodes={userInfo:{textContent:''},cloudStatus:{textContent:''}};
  let currentUser={email:'private+test@example.invalid'};
  let resume;
  const window={__toolyaUILocale:'de',supabaseClient:{auth:{getUser:()=>new Promise(resolve=>{resume=()=>resolve({data:{user:currentUser}})})}}};
  const context={window,document:{getElementById:id=>nodes[id]||null}};
  runInNewContext(src,context);
  const check=async(locale,user,expected)=>{
   window.__toolyaUILocale=locale;currentUser=user;
   const pending=runInNewContext('updateUserDisplay()',context);
   resume();await pending;
   assert.equal(nodes.cloudStatus.textContent,expected);
   assert.equal(nodes.userInfo.textContent,user?'👤 '+user.email:locale==='en'?'Not signed in':'Nicht angemeldet');
  };
  await check('en',currentUser,'✅ Signed in – private+test@example.invalid');
  await check('de',currentUser,'✅ Angemeldet – private+test@example.invalid');
  await check('en',null,'Not signed in');
  await check('de',null,'Nicht angemeldet');
  // Auth resolved *after* the locale changed: render the current language.
  currentUser={email:'later@example.invalid'};
  const pending=runInNewContext('updateUserDisplay()',context);
  window.__toolyaUILocale='en';resume();await pending;
  assert.equal(nodes.cloudStatus.textContent,'✅ Signed in – later@example.invalid');
  assert.equal(nodes.userInfo.textContent,'👤 later@example.invalid');
 });
}

for(const [name,description] of [['car','Vehicle appointment'],['pet-health','Pet appointment']]){
 test(`${name}: ICS exports translate only presentation and retain calendar contract`,async()=>{
  const src=functionBody(await readTool(name),'function downloadICS(title, dateStr) {','async function exportPDF()');
  const clicks=[];let content='';
  const context={
   window:{__toolyaUILocale:'en'},
   Blob:class{constructor(parts,options){content=parts.join('');assert.equal(options.type,'text/calendar;charset=utf-8')}},
   URL:{createObjectURL:()=> 'blob:synthetic'},
   document:{createElement:()=>({click(){clicks.push([this.href,this.download])}})},
   setTimeout:callback=>callback(),Date
  };
  runInNewContext(src,context);
  const title='Private custom title';
  for(const [language,text] of [['en',description],['de',name==='car'?'KFZ-Termin':'Haustier-Termin']]){
   context.window.__toolyaUILocale=language;
   runInNewContext('downloadICS(title, dateStr)',{...context,title,dateStr:'2026-11-21'});
   assert.match(content,/BEGIN:VCALENDAR\nVERSION:2\.0\nBEGIN:VEVENT\n/);
   assert.ok(content.includes(`SUMMARY:${title}\n`));
   assert.ok(content.includes('DTSTART;VALUE=DATE:20261121\n'));
   assert.ok(content.includes(`DESCRIPTION:${text}\nEND:VEVENT\nEND:VCALENDAR`));
   assert.deepEqual(clicks.at(-1),['blob:synthetic','Private_custom_title.ics']);
  }
 });
}

test('vehicle PDF export tolerates stored numeric-string fuel consumption without changing values',async()=>{
 const html=await readTool('car');
 const src=functionBody(html,'async function exportPDF() {','function exportBackup()')
  .replace("const { createExportPdf } = await import('../../shared/toolya/pdf-export.mjs');",'const createExportPdf = window.__fakePdf;');
 const events=[{carId:'a',type:'Tanken',title:'Private receipt',date:'2026-11-21',cost:'12.50',consumption:'6.4'}];
 const data={cars:[{id:'a',name:'My vehicle',plate:'MY-123',km:210}],events};
 const original=JSON.stringify(data),records=[],files=[];
 const pdf={setFont(){},setFontSize(){},text:text=>records.push(String(text)),splitTextToSize:text=>[text],addPage(){},save:name=>files.push(name)};
 const window={__toolyaUILocale:'en',__fakePdf:async()=>pdf};
 const context={window,getData:()=>data,Date,Number};
 runInNewContext(src,context);
 const promise=runInNewContext('exportPDF()',context);
 window.__toolyaUILocale='de';await promise;
 assert.ok(records.some(row=>row.includes('6.4 l/100km')&&row.includes('Private receipt')));
 assert.ok(records.some(row=>row.includes('Vehicle and maintenance report')));
 assert.deepEqual(files,['vehicle-maintenance-report.pdf']);
 assert.equal(JSON.stringify(data),original,'export does not mutate stored numeric strings');
});
