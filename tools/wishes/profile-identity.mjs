// Public wishlist profile naming rules. Kept independent of browser/Supabase for CI.
export function profileIdentity(kind,first,last,organization,country){
 const trim=v=>String(v??'').trim().replace(/\s+/g,' ');
 const a=trim(first),b=trim(last),org=trim(organization),place=trim(country);
 if(!place)throw new Error('Bitte gib dein Land ein.');
 if(kind==='organization'){
  if(!org)throw new Error('Bitte gib den Namen deiner Organisation ein.');
  if(org.length>80)throw new Error('Der Organisationsname darf höchstens 80 Zeichen haben.');
  return {profile_kind:'organization',first_name:'',last_name:'',organization_name:org,display_name:org,country:place};
 }
 if(kind!=='person')throw new Error('Bitte wähle Person oder Organisation aus.');
 if(!a||!b)throw new Error('Bitte gib sowohl deinen Vornamen als auch deinen Nachnamen ein.');
 if((a+' '+b).length>80)throw new Error('Vorname und Nachname dürfen zusammen höchstens 80 Zeichen haben.');
 return {profile_kind:'person',first_name:a,last_name:b,organization_name:'',display_name:a+' '+b,country:place};
}
