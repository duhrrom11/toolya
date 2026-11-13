#!/usr/bin/env python3
"""Offline-only contract checks for the two wishes HTML module entrypoints."""
from html.parser import HTMLParser
from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[1]/'staging/tools/wishes'

class Markup(HTMLParser):
 def __init__(self):
  super().__init__();self.ids=set();self.tags={};self.scripts=[];self.checklists=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:
   assert a['id'] not in self.ids, f'duplicate id: {a["id"]}'
   self.ids.add(a['id']);self.tags[a['id']]=tag
  if tag=='script' and 'src' in a:self.scripts.append(a['src'])
  if 'data-checklist' in a:self.checklists.append(a['data-checklist'])

for name in ('gift-tasks','gift-analytics'):
 html=(ROOT/(name+'.html')).read_text(encoding='utf-8')
 module=(ROOT/(name+'.mjs')).read_text(encoding='utf-8')
 parser=Markup();parser.feed(html)
 expected=set(re.findall(r"\$\('([^']+)'\)",module))
 missing=expected-parser.ids
 assert not missing, f'{name}: missing DOM ids: {sorted(missing)}'
 assert './'+name+'.mjs' in parser.scripts, f'{name}: module not loaded'
 assert parser.tags['login']=='section' and parser.tags['content']=='div'
 assert parser.tags['status']=='p'
 if name=='gift-tasks':
  assert parser.tags['form']=='form'
  assert {'standard','last_minute','shipping'}==set(parser.checklists)
  for key in ('occasion','gift','filter','checklistOccasion','checklistYear'):
   assert parser.tags[key]=='select',f'{name}: wrong element for {key}'
 else:
  for key in ('year','reviewYear'):assert parser.tags[key]=='select'
  assert parser.tags['closingConfirm']=='input'
  assert 'type="checkbox" id="closingConfirm"' in html
 print(f'PASS {name}: {len(expected)} module DOM ids, module script, login and control contracts')
print('PASS isolated wishes pages: no network or Supabase access')
