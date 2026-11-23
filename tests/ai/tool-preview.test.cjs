'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {generateTool} = require('../../scripts/create-tool.cjs');
const {createPreviewServer,parsePreviewOptions,allowedPath,assertDraft} =
  require('../../scripts/preview-tool.cjs');

const root = path.resolve(__dirname, '../..');
const slug = 'ci-toolya-preview-test';
function request(port, pathName, {method='GET',host='127.0.0.1'} = {}) {
  return new Promise((resolve,reject) => {
    const req = http.request({hostname:'127.0.0.1',port,path:pathName,method,
      headers:{Host:host}},res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data',chunk => body += chunk);
      res.on('end',()=>resolve({code:res.statusCode,headers:res.headers,body}));
    });
    req.on('error',reject);
    req.end();
  });
}

test('preview flag validation is strict and prevents invalid ports', () => {
  assert.deepEqual(parsePreviewOptions(['--slug','draft','--port','0']),{port:0,slug:'draft'});
  for (const port of ['65536','-1','0x11','1.5','NaN']) {
    assert.throws(()=>parsePreviewOptions(['--slug','draft','--port',port]),/Port/);
  }
  assert.equal(allowedPath('/tools/ci-toolya-preview-test/app.test.mjs',slug),null);
  assert.equal(allowedPath('/scripts/create-tool.cjs',slug),null);
});

test('preview server is read-only, local-only and never exposes other repo files', async () => {
  const folder = path.join(root,'tools',slug);
  assert.equal(fs.existsSync(folder),false);
  let server;
  try {
    generateTool({repoRoot:root,slug,title:'Lokaler Vorschautest',
      description:'Vollständig isolierter Vorschau-Test ohne API.',template:'counter'});
    assert.doesNotThrow(()=>assertDraft(root,slug));
    server = createPreviewServer({repoRoot:root,slug});
    await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
    assert.equal(server.address().address,'127.0.0.1');
    const port = server.address().port;
    const redirect = await request(port,'/');
    assert.equal(redirect.code,302);
    assert.equal(redirect.headers.location,'/tools/'+slug+'/');
    const page = await request(port,'/tools/'+slug+'/');
    assert.equal(page.code,200);
    assert.match(page.body,/noindex,nofollow/);
    assert.match(page.headers['content-security-policy'],/connect-src 'none'/);
    assert.match(page.headers['content-security-policy'],/script-src 'self'/);
    assert.equal(page.headers['cache-control'],'no-store');
    assert.equal((await request(port,'/tools/'+slug+'/app.mjs')).code,200);
    assert.equal((await request(port,'/shared/toolya/platform.mjs')).code,200);
    assert.equal((await request(port,'/shared/toolya/tool-builder/blocks.mjs')).code,200);
    const head = await request(port,'/tools/'+slug+'/',{method:'HEAD'});
    assert.equal(head.code,200);
    assert.equal(head.body,'');
    assert.equal((await request(port,'/tools/'+slug+'/app.test.mjs')).code,404);
    assert.equal((await request(port,'/tools/wishes/index.html')).code,404);
    assert.equal((await request(port,'/supabase/config.toml')).code,404);
    assert.equal((await request(port,'/.git/config')).code,404);
    assert.equal((await request(port,'/scripts/create-tool.cjs')).code,404);
    assert.equal((await request(port,'/tools/'+slug+'/app.mjs',{method:'POST'})).code,405);
    assert.equal((await request(port,'/tools/'+slug+'/',{host:'example.com'})).code,403);
    assert.equal((await request(port,'/%2e%2e/private.txt')).code,404);
  } finally {
    if (server) await new Promise(resolve=>server.close(resolve));
    fs.rmSync(folder,{recursive:true,force:true});
  }
});

test('preview refuses existing canonical tools and anything without explicit draft mark', () => {
  assert.throws(()=>assertDraft(root,'wishes'),/draft/i);
  assert.throws(()=>assertDraft(root,'../wishes'),/slug/i);
  assert.throws(()=>createPreviewServer({repoRoot:root,slug:'wishes'}),/draft/i);
});
