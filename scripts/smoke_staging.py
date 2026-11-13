#!/usr/bin/env python3
"""Local, read-only headless Chrome smoke check of selected staged pages."""
from __future__ import annotations
import http.server
import pathlib
import shutil
import subprocess
import threading
import time
from functools import partial

ROOT = pathlib.Path(__file__).resolve().parent.parent / "staging"
PAGES = ["index.html", "tools/car/index.html", "tools/baking/index.html",
         "tools/estate/index.html", "tools/wishes/index.html"]
def main():
    chrome = shutil.which("google-chrome") or shutil.which("chromium") or shutil.which("chromium-browser")
    if not chrome:
        print("SKIP: Chrome/Chromium not available")
        return 0
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0),
        partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT)))
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        for page in PAGES:
            url = f"http://127.0.0.1:{server.server_port}/{page}"
            command = [chrome, "--headless", "--no-sandbox", "--disable-gpu",
                       "--disable-dev-shm-usage", "--disable-background-networking",
                       "--virtual-time-budget=2500", "--dump-dom", url]
            proc = subprocess.run(command, capture_output=True, text=True, timeout=35)
            dom = proc.stdout
            ok = proc.returncode == 0 and "<html" in dom.lower() and "<body" in dom.lower() and "404" not in dom[:500]
            print(f"{'PASS' if ok else 'FAIL'}: {page}, chrome_exit={proc.returncode}, dom_bytes={len(dom)}")
            if not ok:
                print(proc.stderr[-900:])
                return 1
        return 0
    finally:
        server.shutdown()

if __name__ == "__main__":
    raise SystemExit(main())
