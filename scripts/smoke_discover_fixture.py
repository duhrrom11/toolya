#!/usr/bin/env python3
"""Offline discovery search/sort/topic assertions with synthetic, in-memory Supabase rows."""
import http.server,json,re,shutil,subprocess,threading
from smoke_mocked import ROOT,MOCK,Handler

FIXTURE="""<script>
const mockRows=[
 {id:'local-a',user_id:'u1',title:'Zebra Gaming',description:'Konsole',icon:'🎮',created_at:'2026-01-01T00:00:00Z'},
 {id:'local-b',user_id:'u2',title:'Apfel Wohnen',description:'Küche',icon:'🏠',created_at:'2026-03-01T00:00:00Z'},
 {id:'local-c',user_id:'u3',title:'Mitte Kreativ',description:'Zeichnen',icon:'🎨',created_at:'2026-02-01T00:00:00Z'}
];
const q=(data)=>new Proxy({}, {get(t,k){if(k==='then')return f=>Promise.resolve({data,error:null}).then(f);return ()=>q(data)}});
window.supabase.createClient=()=>({
 auth:{getUser:async()=>({data:{user:null},error:null})},
 from:table=>q(table==='wishlist_lists'?mockRows:table==='wishlist_profiles'?[]:[]),
 rpc:()=>q([{list_id:'local-a',like_count:3},{list_id:'local-b',like_count:9},{list_id:'local-c',like_count:5}])
});
window.addEventListener('load',()=>{
 const grid=()=>[...document.querySelectorAll('#grid article.card h2')].map(x=>x.textContent);
 const checks=[];
 const test=(name,expected)=>{const actual=grid();checks.push({name,expected,actual,pass:JSON.stringify(actual)===JSON.stringify(expected)})};
 const search=document.getElementById('search'),sort=document.getElementById('sort');
 const run=()=>{test('new',['Apfel Wohnen','Mitte Kreativ','Zebra Gaming']);
 sort.value='az';sort.dispatchEvent(new Event('change',{bubbles:true}));
 test('az',['Apfel Wohnen','Mitte Kreativ','Zebra Gaming']);
 sort.value='popular';sort.dispatchEvent(new Event('change',{bubbles:true}));
 test('popular',['Apfel Wohnen','Mitte Kreativ','Zebra Gaming']);
 search.value='Gaming';search.dispatchEvent(new Event('input',{bubbles:true}));
 test('search',['Zebra Gaming']);
 search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));
 const topic=[...document.querySelectorAll('#topics button')].find(x=>x.textContent.includes('Gaming'));
 topic?.click();test('topic',['Zebra Gaming']);
 const out=document.createElement('script');out.id='toolya-fixture-report';out.type='application/json';
 out.textContent=JSON.stringify(checks);document.documentElement.appendChild(out);
 };
 // ES module imports are deferred and may finish after window load.
 let attempts=0;const wait=()=>{if(grid().length===3)run();else if(++attempts<30)setTimeout(wait,100);else run()};wait();
});
</script>"""
class TestHandler(Handler):
 def do_GET(self):
  if self.path.split('?',1)[0]!='/tools/wishes/discover.html':return super().do_GET()
  content=(ROOT/'tools/wishes/discover.html').read_text(encoding='utf-8')
  content=re.sub(r'<script\b(?=[^>]*\bsrc=["\x27]https?://)[^>]*>\s*</script>','',content,flags=re.I)
  content=re.sub(r'<head(\s[^>]*)?>',lambda m:m.group(0)+MOCK+FIXTURE,content,count=1,flags=re.I)
  data=content.encode();self.send_response(200)
  self.send_header('Content-Type','text/html; charset=utf-8')
  self.send_header('Content-Security-Policy',"default-src 'self' data: blob: 'unsafe-inline' 'unsafe-eval'; connect-src 'none'; form-action 'none'; frame-src 'none'")
  self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data)
def main():
 chrome=shutil.which('google-chrome') or shutil.which('chromium') or shutil.which('chromium-browser')
 if not chrome:return 1
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),TestHandler)
 threading.Thread(target=server.serve_forever,daemon=True).start()
 try:
  cmd=[chrome,'--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--disable-extensions','--no-first-run','--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1','--virtual-time-budget=4500','--dump-dom',f'http://127.0.0.1:{server.server_port}/tools/wishes/discover.html']
  p=subprocess.run(cmd,capture_output=True,text=True,timeout=35)
  m=re.search(r'<script[^>]*id="toolya-fixture-report"[^>]*>(.*?)</script>',p.stdout,re.S)
  checks=json.loads(m.group(1)) if m else []
  for c in checks:print(('PASS' if c['pass'] else 'FAIL')+': '+c['name']+' '+str(c['actual']),flush=True)
  return 0 if p.returncode==0 and len(checks)==5 and all(c['pass'] for c in checks) else 1
 finally:server.shutdown()
if __name__=='__main__':raise SystemExit(main())
