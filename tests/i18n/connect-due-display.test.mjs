import test from 'node:test';
import assert from 'node:assert/strict';
import {projectDueTasks} from '../../shared/toolya/connect-due-sources.mjs';
import {formatDueTaskDisplay} from '../../shared/toolya/i18n/connect-due-display.mjs';
const day='2026-11-22';

test('loan titles and people are literal in DE/EN while source-owned label translates',()=>{
 const title='Rückgabe: Original <item> & 🛠',person='Ada · Impfung auffrischen';
 const source={items:[{id:20,title,person,status:'active',returnDate:'2026-11-24'}],contacts:[],inventory:[]};
 const before=structuredClone(source);
 const [item]=projectDueTasks('loans',source,day);
 assert.equal(formatDueTaskDisplay(item,'en'),'Return: '+title+' · '+person);
 assert.equal(formatDueTaskDisplay(item,'de'),item.text);
 assert.equal(item.readonly,false);
 assert.deepEqual(source,before);
});
test('known car category is translated but user-authored title and vehicle remain literal',()=>{
 const source={cars:[{id:5,name:'Auto · Versicherung'}],
 events:[{id:8,carId:5,date:'2026-12-01',type:'TÜV / HU',title:'Original <title> & Öl'}],tires:[]};
 const [item]=projectDueTasks('car',source,day);
 assert.equal(formatDueTaskDisplay(item,'en'),'Auto · Versicherung · Vehicle inspection · Original <title> & Öl');
 assert.equal(formatDueTaskDisplay(item,'de'),item.text);
 assert.equal(item.readonly,true);
 assert.equal(source.events[0].type,'TÜV / HU');
});
test('pet reminders preserve the name and title and stay read-only',()=>{
 const source={pets:[{id:7,name:'Milo · Entwurmung prüfen'}],meds:[],
 events:[{id:9,petId:7,type:'Impfung',title:'Impfung auffrischen (Original)',date:'2026-01-01',expiryDate:'2026-12-01'},
 {id:10,petId:7,type:'Entwurmung',date:'2026-09-15'}]};
 const before=structuredClone(source);
 const entries=projectDueTasks('pet',source,day);
 assert.equal(entries.length,2);
 assert.ok(entries.every(item=>item.readonly));
 const vaccine=entries.find(t=>t.display?.kind==='pet-vaccine');
 const worm=entries.find(t=>t.display?.kind==='pet-deworming');
 assert.equal(formatDueTaskDisplay(vaccine,'en'),'Milo · Entwurmung prüfen · Vaccination booster due · Impfung auffrischen (Original)');
 assert.equal(formatDueTaskDisplay(worm,'en'),'Milo · Entwurmung prüfen · Check deworming');
 assert.equal(formatDueTaskDisplay(worm,'de'),worm.text);
 assert.deepEqual(source,before);
});
test('unknown, WG and user-defined strings are not interpreted as source labels',()=>{
 const cases=[{source:'wg',text:'Rückgabe: User',display:{kind:'loan-return',title:'User'}},
 {source:'loans',text:'Original data',display:{kind:'unknown'}}];
 for(const entry of cases)assert.equal(formatDueTaskDisplay(entry,'en'),entry.text);
});
