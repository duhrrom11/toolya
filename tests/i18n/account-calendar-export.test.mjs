import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {buildAllDayCalendar} from '../../shared/toolya/calendar-export.mjs';

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

for(const [tool,collection,relation,en,de] of [
 ['car','cars','carId','Vehicle appointment','KFZ-Termin'],
 ['pet-health','pets','petId','Pet appointment','Haustier-Termin']
]){
 test(`${tool}: calendar button loads the original record and captures the selected language`,async()=>{
  const html=await readTool(tool);
  const source=functionBody(html,'async function downloadEventICS(id) {','async function exportPDF()')
   .replace("await import('../../shared/toolya/calendar-export.mjs')",'await calendarModule');
  assert.match(html,/onclick="downloadEventICS\(\$\{Number\(e\.id\)\}\)"/);
  const data={[collection]:[{id:3,name:"Mia's Lieblingsstück"}],events:[{
   id:7,[relation]:3,title:'Prüftermin, Öl & Pflege',date:'2026-11-21'
  }]};
  const original=JSON.stringify(data);
  const exported=[];
  const window={__toolyaUILocale:'en'};
  for(const [language,description] of [['en',en],['de',de]]){
   window.__toolyaUILocale=language;
   let finish;
   const calendarModule=new Promise(resolve=>{finish=resolve});
   const pending=runInNewContext(source+';downloadEventICS(7)',{window,getData:()=>data,calendarModule});
   window.__toolyaUILocale=language==='en'?'de':'en';
   finish({downloadAllDayCalendar:entry=>exported.push(entry)});
   await pending;
   const appointment=exported.at(-1);
   assert.equal(appointment.title,"Prüftermin, Öl & Pflege (Mia's Lieblingsstück)");
   assert.equal(appointment.description,description);
   const output=buildAllDayCalendar({...appointment,now:new Date('2026-11-21T08:00:00Z')});
   assert.ok(output.includes('UID:'+tool+'-7@toolya.app\r\n'));
   assert.ok(output.includes('DTSTAMP:20261121T080000Z\r\n'));
   assert.ok(output.includes('DTSTART;VALUE=DATE:20261121\r\n'));
   assert.ok(!output.includes('DTEND'));
   assert.ok(output.includes('DESCRIPTION:'+description+'\r\n'));
  }
  assert.equal(JSON.stringify(data),original);
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

test('calendar output keeps user punctuation on a single unfolded field and folds UTF-8 safely',()=>{
 const appointment={
  title:'Büro, Küche; Öl \\ Küche\n'+ 'Überprüfung '.repeat(8),
  date:'2026-11-21',description:'Vehicle appointment',uid:'car-7@toolya.app',
  now:new Date('2026-11-21T08:00:00Z')
 };
 const content=buildAllDayCalendar(appointment);
 const lines=content.split('\r\n');
 assert.ok(lines.every(line=>Buffer.byteLength(line,'utf8')<=75));
 assert.ok(lines.some(line=>line.startsWith(' ')));
 assert.equal(lines.filter(line=>line==='BEGIN:VEVENT').length,1);
 assert.equal(lines.filter(line=>line==='END:VEVENT').length,1);
 const summary=content.replaceAll('\r\n ','').split('\r\n').find(line=>line.startsWith('SUMMARY:'));
 assert.equal(summary,'SUMMARY:Büro\\, Küche\\; Öl \\\\ Küche\\n'+'Überprüfung '.repeat(8));
 assert.equal(buildAllDayCalendar({...appointment,date:'2026-02-31'}),null);
});

for (const name of ['car','pet-health','budget','meters']) {
 test(`${name}: DE/EN auth validation, registration and login preserve server errors`,async()=>{
  const src=functionBody(await readTool(name),'async function registerUser() {','async function updateUserDisplay() {');
  const alerts=[],calls=[],fields={loginEmail:{value:''},loginPassword:{value:''}};
  let signupError=null,loginError=null;
  const window={__toolyaUILocale:'en',supabaseClient:{auth:{
   async signUp(credentials){calls.push(['signup',credentials]);return {error:signupError}},
   async signInWithPassword(credentials){calls.push(['login',credentials]);return {error:loginError}},
   async signOut(){calls.push(['logout']);return {error:null}}
  }}};
  const context={window,document:{getElementById:id=>fields[id]},alert:value=>alerts.push(value),
   updateUserDisplay:()=>calls.push(['refresh']),closeSettings:()=>calls.push(['close'])};
  runInNewContext(src,context);
  const invoke=fn=>runInNewContext(fn+'()',context);
  await invoke('registerUser');
  await invoke('loginUser');
  assert.deepEqual(alerts,['Please enter your email and password.','Please enter your email and password.']);
  assert.equal(calls.length,0);
  window.__toolyaUILocale='de';
  await invoke('registerUser');await invoke('loginUser');
  assert.deepEqual(alerts.slice(2),['Bitte E-Mail und Passwort eingeben.','Bitte E-Mail und Passwort eingeben.']);
  fields.loginEmail.value='synthetic@example.invalid';fields.loginPassword.value='synthetic-password';
  window.__toolyaUILocale='en';
  await invoke('registerUser');
  assert.equal(alerts.at(-1),'Registration successful.');
  assert.deepEqual(calls.map(([type])=>type),['signup','refresh','close']);
  assert.equal(calls[0][1].email,'synthetic@example.invalid');
  assert.equal(calls[0][1].password,'synthetic-password');
  signupError={message:'unrecognized backend error'};
  await invoke('registerUser');
  assert.equal(alerts.at(-1),'unrecognized backend error');
  assert.equal(calls.filter(([type])=>type==='refresh').length,1);
  loginError={message:'another backend error'};
  await invoke('loginUser');
  assert.equal(alerts.at(-1),'another backend error');
  assert.equal(calls.filter(([type])=>type==='close').length,1);
  loginError=null;
  await invoke('loginUser');
  assert.deepEqual(calls.slice(-3).map(([type])=>type),['login','refresh','close']);
  window.__toolyaUILocale='de';
  signupError=null;
  await invoke('registerUser');
  assert.equal(alerts.at(-1),'Registrierung erfolgreich.');
  assert.ok(calls.every(([type])=>type!=='logout'),'no unexpected sign-out');
 });
}
