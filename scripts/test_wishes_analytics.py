#!/usr/bin/env python3
"""Local-only analytics UI mutations with mocked Supabase and blocked network."""
import json,re,subprocess,shutil,threading,http.server
import test_wishes_browser as base

base.MOCK=r"""<script>
const mode=new URL(location.href).searchParams.get('mode');
const currentYear=new Date().getFullYear();
const gift={id:'gift-1',title:'Offline-Geschenk',occasion_id:'occasion-1',created_at:currentYear+'-01-01T00:00:00Z',gift_year:currentYear,gift_year_source:'manual',status:'gifted',planned_amount:20,actual_amount:18};
const occasion={id:'occasion-1',title:'Offline-Anlass',occasion_date:currentYear+'-01-01',repeats_yearly:true,budget_amount:25};
const closing={id:'closing-1',closing_year:currentYear,closed_at:currentYear+'-11-13T00:00:00Z',gift_count:1,gifted_count:1,planned_total:20,actual_total:18,budget_total:25,gifts_snapshot:[gift],budgets_snapshot:[],tasks_snapshot:[],task_count:0,task_done_count:0};
window.__calls=[];window.__errors=[];window.__exports=[];
window.addEventListener('error',e=>window.__errors.push(e.message));
window.addEventListener('unhandledrejection',e=>{window.__errors.push(String(e.reason));e.preventDefault()});
const isError=mode.endsWith('-error')||mode==='permission';
function query(table){
 let op='',payload=null,filters=[];
 const q=new Proxy({}, {get(_t,key){
  if(key==='then')return resolve=>Promise.resolve({data:table==='wishlist_gift_plans'?[gift]:table==='wishlist_occasions'?[occasion]:table==='wishlist_gift_year_closings'&&mode==='export'?[closing]:[],error:null}).then(resolve);
  if(key==='eq')return (field,value)=>{filters.push([field,value]);return q};
  if(key==='single')return async()=>{window.__calls.push({table,op,payload,filters});return isError?{data:null,error:{message:'offline denied'}}:{data:closing,error:null}};
  if(key==='upsert')return value=>{op='upsert';payload=value;return q};
  return ()=>q;
 }});
 return q;
}
window.supabase={createClient:()=>({
 auth:{getUser:async()=>({data:{user:mode==='guest'?null:{id:'offline-user'}},error:null})},
 from:query,rpc:async(name,args)=>{window.__calls.push({rpc:name,args});return isError?{data:null,error:{message:'offline denied'}}:{data:name==='wishlist_close_gift_year'?'closing-1':true,error:null}}
})};
window.confirm=()=>true;
const originalCreate=URL.createObjectURL;
URL.createObjectURL=blob=>{blob.text().then(s=>{try{window.__exports.push(JSON.parse(s))}catch(e){window.__errors.push(String(e))}});return 'blob:offline-test'};
URL.revokeObjectURL=()=>{};
HTMLAnchorElement.prototype.click=function(){if(this.download){window.__download=this.download;return}HTMLElement.prototype.click.call(this)};
window.addEventListener('load',()=>setTimeout(()=>{
 try{
  if(mode.startsWith('year')||mode==='permission'){
   const input=document.querySelector('#giftYearEditor input'),button=document.querySelector('#giftYearEditor button');
   input.value=String(currentYear-1);button.click();
  }else if(mode.startsWith('close')){
   if(mode!=='close-confirm')document.getElementById('closingConfirm').checked=true;
   document.getElementById('closeYear').click();
  }else if(mode==='export')document.getElementById('exportYearJson').click();
 }catch(e){window.__errors.push(String(e))}
 setTimeout(()=>{
  const report=document.createElement('script');report.id='analytics-contract-report';report.type='application/json';
  report.textContent=JSON.stringify({mode,errors:window.__errors,calls:window.__calls,exports:window.__exports,download:window.__download||null,
   status:document.getElementById('status').textContent,closingStatus:document.getElementById('closingStatus').textContent,
   reviewStatus:document.getElementById('reviewStatus').textContent,editor:document.getElementById('giftYearEditor').textContent,
   review:document.getElementById('annualReview').textContent,loginVisible:!document.getElementById('login').hidden});
  document.documentElement.append(report);
 },1200);
},250));
</script>"""
def main():
 chrome=shutil.which('google-chrome') or shutil.which('chromium');assert chrome
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),base.Handler)
 threading.Thread(target=server.serve_forever,daemon=True).start()
 failures=[]
 try:
  for mode in ('year','year-error','close','close-error','close-confirm','export','permission','guest'):
   url=f'http://127.0.0.1:{server.server_port}/tools/wishes/gift-analytics.html?mode={mode}'
   cmd=[chrome,'--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--disable-extensions','--no-first-run','--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1','--virtual-time-budget=3000','--dump-dom',url]
   p=subprocess.run(cmd,capture_output=True,text=True,timeout=40)
   m=re.search(r'<script[^>]*id="analytics-contract-report"[^>]*>(.*?)</script>',p.stdout,re.S)
   d=json.loads(m.group(1)) if m else {};calls=d.get('calls',[])
   ok=p.returncode==0 and not d.get('errors')
   if mode in ('year','year-error','permission'):
    ok=ok and len(calls)==1 and calls[0].get('rpc')=='wishlist_set_gift_year' and calls[0]['args']['p_plan_id']=='gift-1'
    ok=ok and d.get('status')==('Geschenkjahr gespeichert.' if mode=='year' else 'Geschenkjahr konnte nicht gespeichert werden.')
    if mode=='year':ok=ok and 'Offline-GeschenkJahr: '+str(__import__('datetime').date.today().year-1)+' · bestätigt' in d.get('editor','')
    else:ok=ok and 'Offline-Geschenk' in d.get('editor','')
   elif mode in ('close','close-error','close-confirm'):
    ok=ok and (len(calls)==0 if mode=='close-confirm' else len(calls)>=1 and calls[0].get('rpc')=='wishlist_close_gift_year' and calls[0]['args']['p_confirm'] is True)
    ok=ok and d.get('closingStatus')==('Bitte die Bestätigung aktivieren.' if mode=='close-confirm' else 'Jahresabschluss konnte nicht gespeichert oder geladen werden.' if mode=='close-error' else 'Jahr '+str(__import__('datetime').date.today().year)+' unveränderlich abgeschlossen.')
   elif mode=='export':
    ok=ok and not calls and d.get('download','').endswith('.json') and len(d.get('exports',[]))==1 and d['exports'][0]['schema_version']==1 and d['exports'][0]['report']['gift_count']==1 and 'Privater JSON-Bericht' in d.get('reviewStatus','')
   elif mode=='guest':ok=ok and d.get('loginVisible') and not calls and d.get('status')=='Bitte anmelden.'
   print(('PASS' if ok else 'FAIL')+' analytics '+mode+' '+json.dumps(d,ensure_ascii=False),flush=True)
   if not ok:failures.append(mode)
  return bool(failures)
 finally:server.shutdown()
if __name__=='__main__':raise SystemExit(main())
