#!/usr/bin/env python3
"""Assert rendered homepage category-filter results, not merely event dispatch."""
import http.server, json, re, shutil, subprocess, threading
from smoke_mocked import Handler, ROOT

SCRIPT="""<script>
window.addEventListener('load',()=>{
 const cards=[...document.querySelectorAll('#toolsGrid .tool-card')];
 const buttons=[...document.querySelectorAll('[data-b3-category-filter]')];
 const checks=[];
 for(const button of buttons){
   button.click();
   const category=button.dataset.b3CategoryFilter;
   const expected=cards.filter(c=>category==='alle'||c.dataset.category===category);
   const actual=cards.filter(c=>getComputedStyle(c).display!=='none');
   const counter=document.getElementById('b3-result-count')?.textContent||'';
   checks.push({category,expected:expected.length,actual:actual.length,
     correct:actual.length===expected.length&&actual.every(c=>expected.includes(c))&&counter.includes(expected.length+' von ')});
 }
 const el=document.createElement('script');el.type='application/json';el.id='toolya-results-report';
 el.textContent=JSON.stringify(checks);document.documentElement.appendChild(el);
});
</script>"""
class TestHandler(Handler):
    def do_GET(self):
        if self.path.split('?',1)[0] not in ('/index.html','/'):
            return super().do_GET()
        file=ROOT/'index.html'
        from smoke_mocked import MOCK
        content=file.read_text(encoding='utf-8')
        content=re.sub(r'<script\b(?=[^>]*\bsrc=["\x27]https?://)[^>]*>\s*</script>','',content,flags=re.I)
        content=re.sub(r'<head(\s[^>]*)?>',lambda m:m.group(0)+MOCK+SCRIPT,content,count=1,flags=re.I)
        data=content.encode()
        self.send_response(200)
        self.send_header('Content-Type','text/html; charset=utf-8')
        self.send_header('Content-Security-Policy',"default-src 'self' data: blob: 'unsafe-inline' 'unsafe-eval'; connect-src 'none'; form-action 'none'; frame-src 'none'")
        self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data)
def main():
    chrome=shutil.which('google-chrome') or shutil.which('chromium') or shutil.which('chromium-browser')
    if not chrome:return 1
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),TestHandler)
    threading.Thread(target=server.serve_forever,daemon=True).start()
    try:
        cmd=[chrome,'--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--disable-extensions','--no-first-run','--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1','--virtual-time-budget=1800','--dump-dom',f'http://127.0.0.1:{server.server_port}/index.html']
        p=subprocess.run(cmd,capture_output=True,text=True,timeout=35)
        m=re.search(r'<script[^>]*id="toolya-results-report"[^>]*>(.*?)</script>',p.stdout,re.S)
        checks=json.loads(m.group(1)) if m else []
        for c in checks:print(('PASS' if c['correct'] else 'FAIL')+': '+json.dumps(c,ensure_ascii=False),flush=True)
        print(json.dumps({'categories':len(checks),'failures':[c for c in checks if not c['correct']]},ensure_ascii=False))
        return 0 if p.returncode==0 and len(checks)==6 and all(c['correct'] for c in checks) else 1
    finally:server.shutdown()
if __name__=='__main__':raise SystemExit(main())
