#!/usr/bin/env node
'use strict';

// CI-only batch builder. Generates local previews and unit-tests them, then
// stages downloadable artifacts. Does not commit, deploy, call APIs or touch DB.
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {buildFromBrief} = require('./create-tool-from-brief.cjs');

const ROOT = path.resolve(__dirname,'..');
const STAGE = 'test-results/ai-brief-artifacts';
const MAX_BRIEFS = 8;

function runNode(root, args) {
  const r = spawnSync(process.execPath, args, {
    cwd: root, encoding:'utf8', timeout:30_000, env:{...process.env}
  });
  if (r.error || r.status !== 0) {
    throw new Error('Generated test failed (' + args.join(' ') + '): ' +
      (r.error?.message || (r.stdout+r.stderr).slice(-1400)));
  }
  return r.stdout;
}

function batchBuild({repoRoot=ROOT, stageDir=STAGE}={}) {
  const root=fs.realpathSync(repoRoot);
  const briefDir=path.resolve(root,'docs/ai/briefs');
  const names=fs.readdirSync(briefDir).filter(n=>n.endsWith('.json')).sort();
  if (names.length === 0 || names.length > MAX_BRIEFS) {
    throw new Error('Expected 1-' + MAX_BRIEFS + ' reviewable tool briefs.');
  }
  const relativePaths=names.map(n=>'docs/ai/briefs/'+n);
  const prelim=relativePaths.map(filename=>buildFromBrief({repoRoot:root,filename,dryRun:true}));
  const seen=new Set();
  for(const item of prelim){
    if(seen.has(item.slug)) throw new Error('Duplicate tool slug in briefs: '+item.slug);
    seen.add(item.slug);
  }
  const stage=path.resolve(root,stageDir);
  if (!stage.startsWith(root+path.sep) ||
      stageDir!==STAGE || fs.existsSync(stage)) {
    throw new Error('Unsafe or already existing stage directory.');
  }
  const generated=[];
  try {
    fs.mkdirSync(stage,{recursive:true});
    const report=[];
    for (const filename of relativePaths) {
      const result=buildFromBrief({repoRoot:root,filename});
      generated.push(result.directory);
      runNode(root,['--check',path.join(result.directory,'app.mjs')]);
      if (result.files.includes('app.test.mjs')) {
        runNode(root,['--test',path.join(result.directory,'app.test.mjs')]);
      }
      const dir=path.join(stage,result.slug);
      fs.mkdirSync(dir);
      for (const file of result.files) {
        fs.copyFileSync(path.join(result.directory,file),path.join(dir,file));
      }
      report.push({brief:filename,slug:result.slug,template:result.template,
        generatedFiles:result.files,tests:result.files.includes('app.test.mjs')?'passed':'starter-only',
        published:false});
      process.stdout.write('PASS: '+filename+' -> '+result.slug+' (offline draft)\n');
    }
    fs.writeFileSync(path.join(stage,'report.json'),JSON.stringify({
      schemaVersion:1,publiclyReleased:false,productionDataUsed:false,briefs:report
    },null,2)+'\n');
    return {stage,report};
  } catch (error) {
    fs.rmSync(stage,{recursive:true,force:true});
    throw error;
  } finally {
    // Only remove directories this run created, never an existing production tool.
    for(const folder of generated)fs.rmSync(folder,{recursive:true,force:true});
  }
}

if(require.main===module){
  try {
    const result=batchBuild();
    console.log('Artifact preview: '+result.stage+' ('+result.report.length+' brief(s), not deployed)');
  } catch(error) {
    console.error('Brief batch: '+error.message);
    process.exitCode=1;
  }
}
module.exports={batchBuild,MAX_BRIEFS};
