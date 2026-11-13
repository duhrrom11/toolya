#!/usr/bin/env python3
"""Read-only link/dependency audit for the staged Toolya website.

Run from a checkout of migration/english-paths-clean:
  python3 scripts/audit_staging.py

This is static analysis, not a browser smoke test.
"""
from pathlib import Path
import json
import posixpath
import re
import sys
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent.parent / "staging"
SOURCE_EXT = {".html", ".js", ".mjs", ".css", ".json", ".xml"}
HTML_ATTR = re.compile(r"""(?:href|src|action|poster)\s*=\s*["']([^"'<>]+)["']""", re.I)
MODULE_REF = re.compile(r"""(?:import\s*(?:[^"'\x60]*?\sfrom\s*)?|import\s*\(|require\s*\()\s*["'\x60]([^"'\x60]+)["'\x60]""")
CSS_REF = re.compile(r"""(?:url\(\s*["']?([^"'\)]+)|@import\s+["']([^"']+))""")
QUOTED_PAGE = re.compile(r"""["'\x60]((?:\.{1,2}/|/)?[^"'\x60\s]*\.html(?:[?#][^"'\x60]*)?)["'\x60]""")
OLD_ROUTES = re.compile(r"""(?:tools/(?:wishlist|digitaler-nachlass|haushaltsbuch-kassenbon|autokosten-reifenwechsel|umzugskisten-inventar)/|amazon-wishlist/|gift-(?:dashboard|assistant|planner|cockpit|task-report)\.html|social-(?:dashboard|feed)\.html|my-reservations\.html|duhrrom11\.github\.io/Helferlein/)""")
KNOWN_MISSING_IN_ORIGINAL = {"tools/wishes/gift-tasks.html", "tools/wishes/gift-analytics.html"}

def target_for(source, raw):
    raw = raw.strip()
    if not raw or raw.startswith(("#", "data:", "mailto:", "tel:", "javascript:", "//", "${")):
        return None
    parsed = urlsplit(raw)
    if parsed.scheme or parsed.netloc:
        return None
    path = parsed.path
    if not path or "{" in path or "}" in path:
        return None
    rel = path.lstrip("/") if path.startswith("/") else posixpath.join(posixpath.dirname(source), path)
    result = posixpath.normpath(rel)
    if result.startswith("../") or result == "..":
        return "OUTSIDE_ROOT:" + result
    return result

def main():
    if not ROOT.is_dir():
        print("Missing staging directory; checkout migration branch", file=sys.stderr)
        return 2
    files = {p.relative_to(ROOT).as_posix(): p for p in ROOT.rglob("*") if p.is_file()}
    broken, legacy, checked = [], [], 0
    for name, path in sorted(files.items()):
        if path.suffix not in SOURCE_EXT:
            continue
        content = path.read_text(encoding="utf-8")
        for match in OLD_ROUTES.finditer(content):
            legacy.append({"source": name, "match": match.group(), "offset": match.start()})
        candidates = []
        if path.suffix == ".html":
            candidates.extend((m.group(1), "html-attr") for m in HTML_ATTR.finditer(content))
        if path.suffix in {".js", ".mjs", ".css", ".html"}:
            candidates.extend((m.group(1), "module") for m in MODULE_REF.finditer(content))
            candidates.extend(((m.group(1) or m.group(2)), "css") for m in CSS_REF.finditer(content))
            candidates.extend((m.group(1), "quoted-html") for m in QUOTED_PAGE.finditer(content))
        seen = set()
        for raw, kind in candidates:
            if (raw, kind) in seen:
                continue
            seen.add((raw, kind))
            target = target_for(name, raw)
            if target is None:
                continue
            checked += 1
            if target not in files and target + "/index.html" not in files:
                broken.append({"source": name, "reference": raw, "resolved": target, "kind": kind, "preexisting": target in KNOWN_MISSING_IN_ORIGINAL})
    report = {"scanned_files": len(files), "references_checked": checked, "missing": broken, "old_route_occurrences": legacy}
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 1 if any(not x["preexisting"] for x in broken) or legacy else 0

if __name__ == "__main__":
    raise SystemExit(main())
