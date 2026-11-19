#!/usr/bin/env python3
"""Record tracked HTML and the corresponding public HTTP responses as JSON."""

import argparse
import json
import re
import subprocess
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

ROOT = Path(__file__).resolve().parents[1]
SITE = "https://toolya.app"
HOSTS = {"toolya.app", "www.toolya.app"}


class Page(HTMLParser):
    def __init__(self, url):
        super().__init__()
        self.url = url
        self.title = ""
        self.h1 = []
        self.description = []
        self.canonical = []
        self.robots = []
        self.meta_refresh = []
        self.links = set()
        self.external_links = 0
        self.scripts = {"external": 0, "inline": 0, "invalid_json_ld": 0}
        self.schema = set()
        self.capture = None
        self.parts = []

    def handle_starttag(self, tag, attrs):
        values = {name: value or "" for name, value in attrs}
        if tag in ("title", "h1"):
            self.capture, self.parts = tag, []
        elif tag == "script":
            if values.get("type", "").lower() == "application/ld+json":
                self.capture, self.parts = tag, []
            else:
                kind = "external" if values.get("src") else "inline"
                self.scripts[kind] += 1
        elif tag == "meta":
            name = values.get("name", "").lower()
            if values.get("http-equiv", "").lower() == "refresh":
                self.meta_refresh.append(values.get("content", ""))
            if name == "description":
                self.description.append(values.get("content", ""))
            if name in ("robots", "googlebot", "bingbot"):
                self.robots.append(values.get("content", ""))
        elif tag == "link" and "canonical" in values.get("rel", "").lower().split():
            if values.get("href"):
                self.canonical.append(urljoin(self.url, values["href"]))
        elif tag == "a" and values.get("href"):
            target = urlsplit(urljoin(self.url, values["href"]))
            if target.scheme in ("http", "https"):
                if target.hostname in HOSTS:
                    self.links.add(target.path or "/")
                else:
                    self.external_links += 1

    def handle_data(self, data):
        if self.capture:
            self.parts.append(data)

    def handle_endtag(self, tag):
        if self.capture != tag:
            return
        raw = "".join(self.parts)
        self.capture, self.parts = None, []
        if tag == "title":
            self.title = " ".join(raw.split())
        elif tag == "h1":
            self.h1.append(" ".join(raw.split()))
        else:
            try:
                self.add_schema(json.loads(raw))
            except json.JSONDecodeError:
                self.scripts["invalid_json_ld"] += 1

    def add_schema(self, node):
        if isinstance(node, dict):
            kinds = node.get("@type", [])
            if isinstance(kinds, str):
                kinds = [kinds]
            if isinstance(kinds, list):
                self.schema.update(kind for kind in kinds if isinstance(kind, str))
            for item in node.values():
                self.add_schema(item)
        elif isinstance(node, list):
            for item in node:
                self.add_schema(item)

    def result(self):
        return {
            "title": self.title,
            "h1": self.h1,
            "description": self.description,
            "canonical": self.canonical,
            "robots": self.robots,
            "meta_refresh": self.meta_refresh,
            "noindex": any(re.search(r"\bnoindex\b", rule, re.I) for rule in self.robots),
            "schema_types": sorted(self.schema),
            "scripts": self.scripts,
            "internal_links": sorted(self.links),
            "external_link_count": self.external_links,
        }


class Redirects(HTTPRedirectHandler):
    def __init__(self):
        self.steps = []

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        self.steps.append({"url": req.full_url, "status": code, "location": newurl})
        target = urlsplit(newurl)
        if target.hostname not in HOSTS or target.scheme not in ("http", "https"):
            return None
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def parse(html, url):
    page = Page(url)
    page.feed(html)
    return page.result()


def live(url):
    redirects = Redirects()
    result = {"url": url, "redirects": redirects.steps}
    try:
        opener = build_opener(redirects)
        request = Request(url, headers={"User-Agent": "Toolya SEO inventory"})
        try:
            reply = opener.open(request, timeout=12)
        except HTTPError as http_error:
            reply = http_error
        with reply:
            result.update(
                status=reply.code,
                final_url=reply.geturl(),
                content_type=reply.headers.get_content_type(),
                robots_header=reply.headers.get_all("X-Robots-Tag", []),
            )
            if result["content_type"] == "text/html":
                metadata = parse(reply.read().decode("utf-8", errors="replace"), reply.geturl())
                metadata["noindex"] |= any(
                    re.search(r"\bnoindex\b", rule, re.I) for rule in result["robots_header"]
                )
                result["html"] = metadata
    except (URLError, TimeoutError, OSError) as err:
        result["error"] = str(err)
    return result



def compare_audit(observations):
    audit = (ROOT / "docs/audits/toolya-master-audit.md").read_text(encoding="utf-8")
    appendix = audit.split("## Anhang A", 1)[1]
    rows = re.findall(r"^\| `(/[^`]*)` \| (\d+) \| ([^|]+) \| ([^|]+) \|", appendix, re.M)
    by_url = {item["url"]: item for item in observations}
    compared = 0
    changes = []
    missing = []
    for path, code, canonical, robots in rows:
        url = SITE + path
        current = by_url.get(url, {})
        if "html" not in current:
            missing.append(path)
            continue
        compared += 1
        canonical = canonical.strip().strip("`")
        if canonical == "gleich":
            previous_canonical = [url]
        elif canonical.startswith("/"):
            previous_canonical = [SITE + canonical]
        else:
            previous_canonical = []
        before = {
            "status": int(code),
            "canonical": previous_canonical,
            "noindex": "noindex" in robots.lower(),
        }
        after = {"status": current["status"], **{key: current["html"][key] for key in ("canonical", "noindex")}}
        if before != after:
            changes.append({"path": path, "before": before, "after": after})
    return {"listed": len(rows), "compared": compared, "not_measured": missing, "changes": changes}


def git(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT, text=True).strip()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--offline", action="store_true", help="inventory tracked source only")
    args = parser.parse_args()

    sitemap = [
        node.text for node in ET.parse(ROOT / "sitemap.xml").findall(".//{*}loc")
    ]
    files = git("ls-files", "--", "*.html").splitlines()
    source = {
        path: parse((ROOT / path).read_text(encoding="utf-8"), SITE + "/" + path)
        for path in files
    }
    history = json.loads((ROOT / "docs/audits/page-inventory.json").read_text(encoding="utf-8"))
    previous = {page["path"] for page in history["pages"]}
    urls = {SITE + "/" + path for path in files} | set(sitemap)
    urls.update(SITE + "/" + path.removesuffix("index.html") for path in files if path.endswith("/index.html"))
    urls.update(
        (
            "http://toolya.app/",
            "http://www.toolya.app/",
            "https://www.toolya.app/",
            SITE + "/robots.txt",
            SITE + "/sitemap.xml",
            SITE + "/tools/wishes/public.html?profile=00000000-0000-0000-0000-000000000000",
            SITE + "/__toolya-seo-inventory-missing__/",
        )
    )
    observations = []
    if not args.offline:
        with ThreadPoolExecutor(max_workers=6) as pool:
            observations = list(pool.map(live, sorted(urls)))
    report = {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "checkout": git("rev-parse", "HEAD"),
        "mode": "source" if args.offline else "source_and_http",
        "sitemap": sitemap,
        "source": source,
        "live": observations,
        "audit_3_comparison": compare_audit(observations) if not args.offline else None,
        "previous_repo_inventory": {
            "base_commit": history["base_commit"],
            "added_paths": sorted(set(source) - previous),
            "removed_paths": sorted(previous - set(source)),
        },
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
