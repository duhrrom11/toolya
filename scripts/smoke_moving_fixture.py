#!/usr/bin/env python3
"""Verify moving-inventory search, tags and ordering using ephemeral read-only fixtures."""
import http.server,json,re,shutil,subprocess,threading
from smoke_mocked import ROOT,MOCK,Handler

FIXTURE="""<script>
window.addEventListener('load',()=>{
 const records=[
  {id:11,locId:1,name:'Zebra Kiste',desc:'Bücher',tag:'Standard',barcode:'001',value:20,subItems:[]},
  {id:12,locId:1,name:'Apfel Kiste',desc:'Tassen',tag:'Zerbrechlich',barcode:'002',value:90,subItems:[]},
  {id:13,locId:1,name:'Mitte Kiste',desc:'Lampen',tag:'Wertvoll',barcode:'003',value:50,subItems:[]}
 ];
 // Replace only the read function in this disposable browser, never localStorage or saveData.
 window.getData=()=>({locations:[{id:1,name:'Testlager',icon:'📍'}],boxes:records});
 const names=()=>[...document.querySelectorAll('#inventoryContainer h5')].map(x=>x.textContent.replace('📦','').trim());
 const checks=[];
 const check=(name,expected)=>{const actual=names();checks.push({name,actual,expected,pass:JSON.stringify(actual)===JSON.stringify(expected)})};
 const search=document.getElementById('searchBox'),tag=document.getElementById('tagFilter'),sort=document.getElementById('sortFilter');
 const change=(el,value,event)=>{el.value=value;el.dispatchEvent(new Event(event,{bubbles:true}));};
 window.renderInventory();
 check('name',['Apfel Kiste','Mitte Kiste','Zebra Kiste']);
 change(sort,'value-desc','change');check('value-desc',['Apfel Kiste','Mitte Kiste','Zebra Kiste']);
 change(sort,'value-asc','change');check('value-asc',['Zebra Kiste','Mitte Kiste','Apfel Kiste']);
 change(tag,'Zerbrechlich','change');check('tag',['Apfel Kiste']);
 change(tag,'','change');
 change(search,'Lampen','input');check('search',['Mitte Kiste']);
 change(search,'','input');
 change(sort,'name','change');check('reset',['Apfel Kiste','Mitte Kiste','Zebra Kiste']);
 const out=document.createElement('script');out.id='toolya-moving-report';out.type='application/json';
 out.textContent=JSON.stringify({checks,errors:window.__mockErrors});document.documentElement.appendChild(out);
});
</script>"""
class TestHandler(Handler):
 def do_GET(self):
  if self.path.split('?',1)[0]!='/tools/moving/index.html':return super().do_GET()
  content=(ROOT/'tools/moving/index.html').read_text(encoding='utf-8')
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
  cmd=[chrome,'--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--disable-extensions','--no-first-run','--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1','--virtual-time-budget=2400','--dump-dom',f'http://127.0.0.1:{server.server_port}/tools/moving/index.html']
  p=subprocess.run(cmd,capture_output=True,text=True,timeout=35)
  m=re.search(r'<script[^>]*id="toolya-moving-report"[^>]*>(.*?)</script>',p.stdout,re.S)
  report=json.loads(m.group(1)) if m else {}
  checks=report.get('checks',[])
  for c in checks:print(('PASS' if c['pass'] else 'FAIL')+': '+c['name']+' '+str(c['actual']),flush=True)
  print('ERRORS:',report.get('errors',[]),flush=True)
  return 0 if p.returncode==0 and len(checks)==6 and all(c['pass'] for c in checks) and not report.get('errors') else 1
 finally:server.shutdown()
if __name__=='__main__':raise SystemExit(main())
