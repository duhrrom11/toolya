import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {dashboardText} from '../../shared/toolya/i18n/dashboard-copy.mjs';
import {projectDueTasks} from '../../shared/toolya/connect-due-sources.mjs';

const html=readFileSync(resolve(import.meta.dirname,'../../dashboard/dashboard.js'),'utf8');
test('DE/EN dashboard preserves source-owned due-task permissions and localizes UI labels',()=>{
 const start=html.indexOf("  for(const item of extraTasks) {"),end=html.indexOf("  const remindHost=$('reminders');",start);
 assert.ok(start>0&&end>start);
 const section=html.slice(start,end);
 assert.match(section,/if\(!item\.readonly\)/);
 assert.match(section,/cb\.onchange=\(\)=>changeConnected\(item,cb\.checked\)/);
 assert.match(section,/item\.origin\+' · '\+title\+' erledigt'/);
 assert.match(section,/tx\(item\.origin\)\+' · '\+title\+' as completed'/);
 assert.match(section,/connect-task-marker/);
 assert.match(section,/const title=formatDueTaskDisplay\(item,dashboardLocale\(\)\)/);
 assert.match(section,/marker\.setAttribute\('aria-hidden','true'\)/);
 assert.match(section,/toLocaleDateString\(dashboardDateLocale\(\)/);
 assert.match(section,/element\('a',tx\('Tool öffnen'\)\)/);
 assert.equal(dashboardText('Tool öffnen','en'),'Open tool');
 assert.equal(dashboardText('Tool öffnen','de'),'Tool öffnen');
 assert.equal(dashboardText('Tiergesundheit','en'),'Pet health');
 assert.doesNotMatch(section,/item\.text\s*=/);
});
test('new due projections retain source values without turning readonly deadlines into completions',()=>{
 const today='2026-11-22';
 const snapshot={pets:[{id:4,name:'Test <pet>'}],meds:[],events:[{id:7,petId:4,type:'Impfung',title:'User <value>',date:'2025-11-11',expiryDate:'2026-12-01'}]};
 const backup=structuredClone(snapshot);
 const projected=projectDueTasks('pet',snapshot,today);
 assert.equal(projected.length,1);
 assert.equal(projected[0].readonly,true);
 assert.ok(projected[0].text.includes('Test <pet>'));
 assert.ok(projected[0].text.includes('User <value>'));
 assert.deepEqual(snapshot,backup);
});
