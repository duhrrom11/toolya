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

test('public profile editor chooses a required identity mode and retains country as mandatory',()=>{
 const html=readFileSync('tools/wishes/public.html','utf8');
 const js=readFileSync('tools/wishes/public-amazon.mjs','utf8');
 const migration=readFileSync('supabase/migrations/20261119161500_wishlist_profile_identity_fields.sql','utf8');
 assert.match(html,/name="profileKind" value="person" checked/);
 assert.match(html,/name="profileKind" value="organization"/);
 for(const id of ['firstName','lastName','organizationName','country'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/<input id="country" required/);
 assert.doesNotMatch(html,/id="displayName"/);
 assert.match(js,/profileIdentity\(selectedProfileKind\(\)/);
 assert.match(js,/profile_kind/);
 assert.match(js,/own\?\.organization_name/);
 assert.match(migration,/check \(/);
 assert.match(migration,/btrim\(country\)/);
});
