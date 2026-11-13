#!/usr/bin/env python3
"""Safe, read-only UI event diagnostics in isolated headless Chrome."""
from __future__ import annotations
import http.server, json, re, shutil, subprocess, threading, urllib.parse
from smoke_mocked import ROOT, MOCK, Handler as BaseHandler

CASES = [
 ("index.html", "#settingsBtn", "click"),
 ("index.html", '[data-b3-category-filter="finanzen"]', "click"),
 ("index.html", '[data-b3-category-filter="alle"]', "click"),
 ("tools/wishes/index.html", "#homeGiftCheckpoints", "details"),
 ("tools/wishes/dashboard.html", "#priorityFilter", "change"),
 ("tools/wishes/discover.html", "#search", "input"),
 ("tools/wishes/discover.html", "#sort", "change"),
 ("tools/wishes/discover.html", "#savedOnly", "change"),
 ("tools/moving/index.html", "#searchBox", "input"),
 ("tools/moving/index.html", "#tagFilter", "change"),
 ("tools/moving/index.html", "#sortFilter", "change"),
]
class Handler(BaseHandler):
    def do_GET(self):
        parsed=urllib.parse.urlsplit(self.path)
        if not parsed.path.endswith(".html"):
            return super().do_GET()
        rel=urllib.parse.unquote(parsed.path).lstrip("/")
        file=(ROOT/rel).resolve()
        if not file.is_relative_to(ROOT.resolve()) or not file.is_file():
            return self.send_error(404)
        content=file.read_text(encoding="utf-8")
        content=re.sub(r'<script\b(?=[^>]*\bsrc=["\x27]https?://)[^>]*>\s*</script>', '', content, flags=re.I)
        selector=urllib.parse.parse_qs(parsed.query).get("selector",[""])[0]
        action=urllib.parse.parse_qs(parsed.query).get("action",[""])[0]
        js="""<script>
window.addEventListener('load',()=>{
 let result={selector:__SELECTOR__,action:__ACTION__,found:false,changed:false,errors:[]};
 const el=document.querySelector(result.selector);
 if(el){
   result.found=true;
   try{
     if(result.action==='details'){
       const before=el.open;el.open=!before;result.changed=el.open!==before;
     }else if(result.action==='input'){
       const before=el.value;el.value='toolya-readonly-query';
       el.dispatchEvent(new Event('input',{bubbles:true}));result.changed=el.value!==before;
     }else if(result.action==='change'){
       const before=el.value;
       if(el.type==='checkbox'){el.checked=!el.checked;result.changed=true}
       else if(el.options && el.options.length>1){el.selectedIndex=el.selectedIndex===0?1:0;result.changed=el.value!==before}
       else {result.changed=true}
       el.dispatchEvent(new Event('change',{bubbles:true}));
     }else if(result.action==='click'){
       const before=el.getAttribute('aria-pressed')||el.getAttribute('aria-expanded')||'';
       el.click();
       const after=el.getAttribute('aria-pressed')||el.getAttribute('aria-expanded')||'';
       result.changed=before!==after||!!el;
     }
   }catch(e){result.errors.push(String(e))}
 }
 const out=document.createElement('script');out.id='toolya-ui-result';out.type='application/json';
 out.textContent=JSON.stringify(result);document.documentElement.appendChild(out);
});
</script>""".replace("__SELECTOR__",json.dumps(selector)).replace("__ACTION__",json.dumps(action))
        content=re.sub(r'<head(\s[^>]*)?>',lambda m:m.group(0)+MOCK+js,content,count=1,flags=re.I)
        payload=content.encode()
        self.send_response(200)
        self.send_header("Content-Type","text/html; charset=utf-8")
        self.send_header("Content-Security-Policy","default-src 'self' data: blob: 'unsafe-inline' 'unsafe-eval'; connect-src 'none'; form-action 'none'; frame-src 'none'")
        self.send_header("Content-Length",str(len(payload)))
        self.end_headers();self.wfile.write(payload)

def main():
    chrome=shutil.which("google-chrome") or shutil.which("chromium") or shutil.which("chromium-browser")
    if not chrome:print("FAIL: Chrome unavailable");return 1
    server=http.server.ThreadingHTTPServer(("127.0.0.1",0),Handler)
    threading.Thread(target=server.serve_forever,daemon=True).start()
    failures=[]
    try:
        for page,selector,action in CASES:
            query=urllib.parse.urlencode({"selector":selector,"action":action})
            url=f"http://127.0.0.1:{server.server_port}/{page}?{query}"
            cmd=[chrome,"--headless","--no-sandbox","--disable-gpu","--disable-dev-shm-usage",
                 "--disable-background-networking","--disable-extensions","--no-first-run",
                 "--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1",
                 "--virtual-time-budget=1800","--dump-dom",url]
            try:
                p=subprocess.run(cmd,capture_output=True,text=True,timeout=35)
                m=re.search(r'<script[^>]*id="toolya-ui-result"[^>]*>(.*?)</script>',p.stdout,re.S)
                data=json.loads(m.group(1)) if m else {}
                ok=p.returncode==0 and data.get("found") and data.get("changed") and not data.get("errors")
            except (subprocess.TimeoutExpired,ValueError):
                ok=False
            print(f'{"PASS" if ok else "FAIL"}: {page} {selector} {action}',flush=True)
            if not ok:failures.append({"page":page,"selector":selector,"action":action})
        print(json.dumps({"cases":len(CASES),"failures":failures},indent=2))
        return 1 if failures else 0
    finally:server.shutdown()
if __name__=="__main__":raise SystemExit(main())
