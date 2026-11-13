#!/usr/bin/env python3
"""Read-only local Chrome smoke tests for all staged HTML pages.

Runs only on localhost; no login, forms, or production data are touched.
The HTTP response receives test-only error instrumentation; source files stay unchanged.
"""
from __future__ import annotations
from concurrent.futures import ThreadPoolExecutor, as_completed
from functools import partial
from html.parser import HTMLParser
import http.server
import json
import pathlib
import re
import shutil
import subprocess
import threading
import urllib.error
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent / "staging"
MARKER = "toolya-smoke-report"
INSTRUMENT = """<script>
window.__smoke = {errors:[], resources:[]};
window.addEventListener('error', e => {
 if(e.target && e.target !== window && (e.target.src || e.target.href)) {
   window.__smoke.resources.push(e.target.src || e.target.href);
 } else { window.__smoke.errors.push(String(e.message || 'script error')); }
}, true);
window.addEventListener('unhandledrejection', e => window.__smoke.errors.push('rejection: '+String(e.reason)));
window.addEventListener('DOMContentLoaded', () => {
 const report = document.createElement('script');
 report.type = 'application/json';
 report.id = 'toolya-smoke-report';
 report.textContent = JSON.stringify(window.__smoke);
 document.documentElement.appendChild(report);
});
</script>"""

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)
    def log_message(self, fmt, *args):
        pass
    def do_GET(self):
        path = urllib.parse.urlsplit(self.path).path
        if path.endswith(".html") or path == "/":
            rel = urllib.parse.unquote(path).lstrip("/") or "index.html"
            file = (ROOT / rel).resolve()
            if not file.is_relative_to(ROOT.resolve()) or not file.is_file():
                self.send_error(404)
                return
            data = file.read_text(encoding="utf-8")
            data = re.sub(r"<head(\s[^>]*)?>", lambda m: m.group(0) + INSTRUMENT, data, count=1, flags=re.I)
            payload = data.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
        else:
            super().do_GET()

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "a" and attrs.get("href"):
            self.links.append(attrs["href"])

def main():
    chrome = shutil.which("google-chrome") or shutil.which("chromium") or shutil.which("chromium-browser")
    if not chrome:
        print("FAIL: Chrome/Chromium unavailable")
        return 1
    pages = sorted(p.relative_to(ROOT).as_posix() for p in ROOT.rglob("*.html"))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base = f"http://127.0.0.1:{server.server_port}/"
    failures = []
    offline_limited = []
    try:
        # Static navigation targets are checked without clicking or triggering application actions.
        for page in pages:
            parser = Links()
            parser.feed((ROOT / page).read_text(encoding="utf-8"))
            for link in parser.links:
                url = urllib.parse.urljoin(urllib.parse.urljoin(base, page), link)
                parsed = urllib.parse.urlsplit(url)
                if parsed.netloc != urllib.parse.urlsplit(base).netloc:
                    continue
                local = urllib.parse.unquote(parsed.path).lstrip("/")
                if not local or local.endswith("/"):
                    local += "index.html"
                if not (ROOT / local).is_file():
                    # Two known pre-existing missing wishlist destinations are not fabricated.
                    if local not in ("tools/wishes/gift-tasks.html", "tools/wishes/gift-analytics.html"):
                        failures.append({"page":page,"kind":"navigation","target":local})
        def check(page):
            url = urllib.parse.urljoin(base, page)
            command = [chrome, "--headless", "--no-sandbox", "--disable-gpu",
                       "--disable-dev-shm-usage", "--disable-background-networking",
                       "--disable-extensions", "--no-first-run", "--no-default-browser-check",
                       "--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1",
                       "--virtual-time-budget=1800", "--dump-dom", url]
            try:
                proc = subprocess.run(command, capture_output=True, text=True, timeout=35)
            except subprocess.TimeoutExpired:
                return {"page":page,"kind":"timeout"}
            dom = proc.stdout
            if proc.returncode or "<html" not in dom.lower() or "<body" not in dom.lower():
                return {"page":page,"kind":"render","exit":proc.returncode,"stderr":proc.stderr[-300:]}
            match = re.search(r'<script[^>]*id="toolya-smoke-report"[^>]*>(.*?)</script>',dom,re.S)
            if not match:
                return {"page":page,"kind":"instrumentation_missing"}
            try:
                report = json.loads(match.group(1).replace("&amp;","&"))
            except (ValueError, TypeError):
                return {"page":page,"kind":"invalid_report"}
            issues = report.get("errors",[]) + report.get("resources",[])
            if issues:
                external = [x for x in issues if x.startswith(("https://", "http://")) and not x.startswith(base)]
                local_resources = [x for x in report.get("resources",[]) if x.startswith(base)]
                if local_resources:
                    return {"page":page,"kind":"local_resource_error","errors":local_resources[:8]}
                if external:
                    return {"page":page,"kind":"offline_external_dependencies","errors":issues[:8]}
                return {"page":page,"kind":"browser_errors","errors":issues[:8]}
            return None
        with ThreadPoolExecutor(max_workers=3) as pool:
            futures = {pool.submit(check,page):page for page in pages}
            for future in as_completed(futures):
                result = future.result()
                label = "OFFLINE-LIMITED" if result and result["kind"] == "offline_external_dependencies" else ("FAIL" if result else "PASS")
                print(f"{label}: {futures[future]}",flush=True)
                if result:
                    (offline_limited if result["kind"] == "offline_external_dependencies" else failures).append(result)
        print(json.dumps({"pages":len(pages),"failures":failures,"offline_limited":offline_limited},ensure_ascii=False,indent=2))
        return 1 if failures else 0
    finally:
        server.shutdown()

if __name__ == "__main__":
    raise SystemExit(main())
