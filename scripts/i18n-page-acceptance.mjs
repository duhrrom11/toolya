import fs from 'node:fs';
const dir='test-results/i18n-quality';
const read=name=>{try{return JSON.parse(fs.readFileSync(dir+'/'+name,'utf8'))}catch{return null}};
const anonymous=read('application-shell-report.json'),authenticated=read('authenticated-shell-report.json'),marketing=read('layout-report.json');
const routes=[...['moving','housemates','plants','baking','budget','car','loans','meters','parking','pet-health'].map(x=>'/tools/'+x+'/index.html'),...['public','dashboard','collection','discover','feed','planner','profile','occasions','reservations','assistant','bookmarks','cockpit','gift-analytics','gift-tasks','notifications','report','social'].map(x=>'/tools/wishes/'+x+'.html'),...['index','heirs','handover','print-key'].map(x=>'/tools/estate/'+x+'.html'),'/dashboard/index.html','/admin-stats-dashboard/index.html','/admin-stats-dashboard/wishlist-finder.html'];
const evidence=(report,path)=>{const rows=(report?.results||[]).filter(x=>x.path===path);return {widths:rows.map(x=>x.width),passed:rows.filter(x=>Array.isArray(x.errors)&&!x.errors.length&&x.checks?.some(c=>c.lang==='en')&&x.checks?.some(c=>c.lang==='de')).length,observed:rows.length,errors:rows.flatMap(x=>x.errors||[])}};
// Existing Playwright assertions, not new tests. Only successful, non-skipped
// cases from the current workflow count; no full functional approval inferred.
const mainReport=read('ten-tool-shell-report.json');
const mainCases=[];
function walk(suite){
 for(const spec of suite.specs||[])if(spec.title.startsWith('i18n ten-tool shell: '))mainCases.push(spec);
 for(const child of suite.suites||[])walk(child);
}
for(const suite of mainReport?.suites||[])walk(suite);
function mainEvidence(path){
 const slug=path.match(/^\/tools\/([^/]+)\/index\.html$/)?.[1];
 const matches=mainCases.filter(s=>s.title==='i18n ten-tool shell: '+slug+' changes DE/EN at 320, 375 and 768 without rewriting drafts');
 const passed=matches.length===1&&matches[0].ok===true&&matches[0].tests?.length>0&&matches[0].tests.every(t=>t.status==='expected'&&t.results?.at(-1)?.status==='passed');
 return {observed:matches.length,passed:!!passed,widths:passed?[320,375,768]:[],scope:'Synthetic authenticated shell, language switch, keyboard, layout, draft and no writes'};
}
const pages=routes.map(path=>({path,anonymous:evidence(anonymous,path),authenticated:evidence(authenticated,path),mainToolShell:mainEvidence(path),releaseAccepted:false,remaining:'Full functional and dynamic translation acceptance, including applicable authenticated states, remains required.'}));
const output={schemaVersion:1,revision:process.env.GITHUB_SHA||null,run:process.env.GITHUB_RUN_ID||null,scope:'Consolidated current-run evidence only; not a release approval',pages,marketing:{observed:marketing?.pages?.length||0,warnings:marketing?.warningCount??null},releaseReady:false};
fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(dir+'/page-acceptance.json',JSON.stringify(output,null,2)+'\n');
console.log('PAGE ACCEPTANCE EVIDENCE '+JSON.stringify({pages:pages.length,anonymous:pages.filter(p=>p.anonymous.passed===3).length,authenticated:pages.filter(p=>p.authenticated.passed===3).length,mainToolShell:pages.filter(p=>p.mainToolShell.passed).length,fullyAccepted:0}));
