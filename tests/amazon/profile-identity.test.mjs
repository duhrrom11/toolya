import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {profileIdentity} from '../../tools/wishes/profile-identity.mjs';

test('public person profiles require first name, last name, and country',()=>{
 assert.throws(()=>profileIdentity('person','Ada','','','Deutschland'),/Vornamen.*Nachnamen/);
 assert.throws(()=>profileIdentity('person','','Lovelace','','Deutschland'),/Vornamen.*Nachnamen/);
 assert.throws(()=>profileIdentity('person','Ada','Lovelace','','  '),/Land/);
 assert.deepEqual(profileIdentity('person','  Ada ',' Lovelace','',' Deutschland '),{
  profile_kind:'person',first_name:'Ada',last_name:'Lovelace',organization_name:'',
  display_name:'Ada Lovelace',country:'Deutschland'
 });
});

test('organization profiles require an organization and country, not a personal name',()=>{
 assert.throws(()=>profileIdentity('organization','','','','Deutschland'),/Organisation/);
 assert.throws(()=>profileIdentity('organization','','','Verein Beispiel',''),/Land/);
 assert.deepEqual(profileIdentity('organization','','','  Verein Beispiel e.V.  ','Schweiz'),{
  profile_kind:'organization',first_name:'',last_name:'',organization_name:'Verein Beispiel e.V.',
  display_name:'Verein Beispiel e.V.',country:'Schweiz'
 });
 assert.throws(()=>profileIdentity('unknown','Ada','Lovelace','','Deutschland'),/Person oder Organisation/);
});

test('dashboard profile editor requires the chosen identity and the database enforces one per kind',()=>{
 const js=readFileSync('tools/wishes/directory-dashboard.mjs','utf8');
 const migration=readFileSync('supabase/migrations/20261128110000_wishlist_profiles_and_cards.sql','utf8');
 assert.match(js,/\['person', 'Für mich'\], \['organization', 'Für einen Verein'\]/);
 assert.match(js,/field\(form, 'country', 'Land', p\.country, \{required: true\}\)/);
 assert.match(js,/profileIdentity\(values\.get\('kind'\)/);
 assert.match(migration,/unique \(owner_id, kind\)/);
 assert.match(migration,/btrim\(country\)/);
});
