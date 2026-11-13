#!/usr/bin/env python3
"""Build a selective, path-renamed Toolya site from a local Helferlein checkout.

Usage: python3 scripts/build_from_helferlein.py /path/to/Helferlein /tmp/toolya-build
Does NOT deploy, write to the source, or modify the public toolya site.
"""
from __future__ import annotations
import argparse
import json
import re
import shutil
from pathlib import Path

FOLDERS = {
 "autokosten-reifenwechsel":"car", "backform-umrechner":"baking",
 "digitaler-nachlass":"estate", "energie":"energy",
 "haushaltsbuch-kassenbon":"budget", "haustier-gesundheitspass":"pet-health",
 "haustier":"pets", "kassenbon":"receipts", "kfz":"vehicle",
 "kisten":"boxes", "küche":"kitchen", "notizen":"notes",
 "parken":"parking", "parkplatz-merker-parkschein-timer":"park-timer",
 "pflanzen":"plants", "pflanzenpflege-giessplan":"watering",
 "umzugskisten-inventar":"moving", "verleih":"lending",
 "verliehene-gegenstaende-verwalten":"loans", "wg-kasse":"shared-budget",
 "wg-organisator":"housemates", "wishlist":"wishes",
 "zaehlerstaende-erfassen":"meters",
}
FILES = {
 "datenschutz.html":"privacy.html", "impressum.html":"legal.html",
 "küchenmathe.html":"index.html", "erben.html":"heirs.html",
 "erben-uebergabe.html":"handover.html", "schluessel-drucken.html":"print-key.html",
 "vertrauensperson-einladung.html":"invite.html",
 "vertrauensperson-erstellen.html":"create-trustee.html",
 "vertrauenspersonen-verwaltung.html":"trustees.html",
 "vertrauenspersonen.html":"trusted.html",
 "gift-assistant.html":"assistant.html", "gift-cockpit.html":"cockpit.html",
 "gift-dashboard.html":"dashboard.html", "gift-planner.html":"planner.html",
 "gift-task-report.html":"report.html", "my-reservations.html":"reservations.html",
 "social-dashboard.html":"social.html", "social-feed.html":"feed.html",
}
# Production pages/assets are copied; dev/test/docs/migration SQL and workflows are excluded.
INCLUDE_ROOT = {"index.html","datenschutz.html","impressum.html","manifest.json",
                "robots.txt","sitemap.xml",".nojekyll"}
INCLUDE_DIRS = {"tools","assets","shared"}
TEXT_EXT = {".html",".js",".mjs",".css",".json",".xml",".txt"}
URL_PATTERN = re.compile(r'(?<![\w/])(?:\.\./|\./|/)?(?:tools|assets|shared|amazon-wishlist)/[\w.\-/äöüÄÖÜß]+|(?<![\w/])(?:datenschutz|impressum)\.html')
OLD_HOST = "https://duhrrom11.github.io/Helferlein/"
NEW_HOST = "https://toolya.app/"

def mapped(path: str) -> str:
    parts = path.split("/")
    if parts[0] == "tools" and len(parts)>1:
        parts[1] = FOLDERS.get(parts[1],parts[1])
    parts[-1] = FILES.get(parts[-1],parts[-1])
    return "/".join(parts)

def main():
    p=argparse.ArgumentParser()
    p.add_argument("source",type=Path)
    p.add_argument("destination",type=Path)
    args=p.parse_args()
    src=args.source.resolve(); dst=args.destination.resolve()
    if not (src/"index.html").is_file() or not (src/"tools").is_dir():
        p.error("source must be the Helferlein checkout")
    if src==dst or src in dst.parents or dst in src.parents:
        p.error("source and destination must be disjoint")
    if dst.exists() and any(dst.iterdir()):
        p.error("destination must be empty (no destructive overwrite)")
    paths=[x for x in src.rglob("*") if x.is_file() and
           (x.relative_to(src).as_posix() in INCLUDE_ROOT or
            x.relative_to(src).parts[0] in INCLUDE_DIRS)]
    # Exclude known test fixtures and old redirect-only entrypoints.
    paths=[x for x in paths if not x.name.endswith(("test-fixture.html",".test.mjs")) and
           "/tests/" not in x.as_posix() and x.relative_to(src).as_posix() not in
           {"tools/kfz/index.html","tools/kassenbon/index.html","tools/kisten/index.html",
            "tools/haustier/index.html","tools/parken/index.html","tools/pflanzen/index.html",
            "tools/energie/index.html","tools/verleih/index.html","tools/wg-kasse/index.html"}]
    names={x.relative_to(src).as_posix():mapped(x.relative_to(src).as_posix()) for x in paths}
    if len(set(names.values()))!=len(names):
        p.error("path collision: review folder/file map before proceeding")
    # Map only explicit known repository paths, longest first, to avoid changing UI copy.
    replacements=[]
    for old,new in names.items():
        if old!=new:
            replacements.extend([(old,new),("/"+old,"/"+new)])
    replacements.sort(key=lambda pair:len(pair[0]),reverse=True)
    dst.mkdir(parents=True,exist_ok=True)
    for source in paths:
        old=source.relative_to(src).as_posix(); dest=dst/names[old]
        dest.parent.mkdir(parents=True,exist_ok=True)
        if source.suffix not in TEXT_EXT:
            shutil.copy2(source,dest);continue
        content=source.read_text(encoding="utf-8")
        content=content.replace(OLD_HOST,NEW_HOST)
        # Relative URLs need location-aware rewriting: resolve against old file location
        # then express relative to new file location.
        url_re=re.compile(r'(?P<quote>["\x27])(?P<path>(?:\.\./|\./|/)?(?:tools/|assets/|shared/|amazon-wishlist/)[^"\x27?#]+|(?:\.\./|\./)?[\w-]+\.html)(?P<suffix>[?#][^"\x27]*)?(?P=quote)')
        import posixpath
        def rewrite(m):
            raw=m.group("path")
            if raw.startswith("http:") or raw.startswith("https:"):return m.group(0)
            absolute=raw.startswith("/")
            target=posixpath.normpath(posixpath.join(posixpath.dirname(old),raw.lstrip("/"))) if not absolute else posixpath.normpath(raw.lstrip("/"))
            if target not in names:return m.group(0)
            newtarget=names[target]
            newraw=("/"+newtarget) if absolute else posixpath.relpath(newtarget,posixpath.dirname(names[old]) or ".")
            if raw.startswith("./") and not newraw.startswith("."):newraw="./"+newraw
            return m.group("quote")+newraw+(m.group("suffix") or "")+m.group("quote")
        content=url_re.sub(rewrite,content)
        dest.write_text(content,encoding="utf-8")
    (dst/"migration-manifest.json").write_text(json.dumps({
        "source_file_count":len(paths),"mapped_paths":names,
        "note":"Review JS dynamic routes, CSS url(), PWA, auth redirects, and all links before release."
    },indent=2,ensure_ascii=False),encoding="utf-8")
    print(f"Prepared {len(paths)} files in {dst}; NOT deployed. Review before publication.")

if __name__=="__main__":main()
