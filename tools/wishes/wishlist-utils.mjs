/** Small pure validators shared by the browser and Node tests. */
export function normalizeProfileSearch(input) {
 if(typeof input!=='string')return '';
 return input.trim().replace(/[^a-zA-Z0-9äöüÄÖÜß -]/g,'').slice(0,80).trim();
}
export function validateWishFields(title,note) {
 const t=typeof title==='string'?title.trim():'';
 const n=typeof note==='string'?note.trim():'';
 if(!t||t.length>250)throw Error('Produkttitel muss 1 bis 250 Zeichen enthalten');
 if(n.length>500)throw Error('Notiz darf maximal 500 Zeichen enthalten');
 return {title:t,note:n};
}
export function validateHandle(handle) {
 const h=typeof handle==='string'?handle.trim().toLowerCase():'';
 if(!/^[a-z0-9_]{3,30}$/.test(h))throw Error('Benutzername: 3–30 Zeichen, nur a–z, 0–9 und _');
 return h;
}

export function validatePriority(input) {
 if(typeof input!=='string'&&typeof input!=='number')throw Error('Ungültige Priorität');
 if(typeof input==='string'&&!/^[123]$/.test(input))throw Error('Ungültige Priorität');
 const value=Number(input);
 if(![1,2,3].includes(value))throw Error('Ungültige Priorität');
 return value;
}

/** Preserve unrelated query parameters when switching a public profile view. */
export function profilePageUrl(currentUrl,handle=null) {
 const url=new URL(currentUrl);
 url.searchParams.delete('profile');
 if(handle!==null){url.searchParams.delete('url');url.searchParams.set('profile',validateHandle(handle));}
 return url.toString();
}

/** Only a uniqueness race should trigger a retry after a product insert fails. */
export function isUniqueViolation(error) {
 return error?.code==='23505';
}

/** Normalize a deep-linked profile handle; reject malformed values safely. */
export function requestedProfileHandle(value) {
 if(typeof value!=='string')return null;
 try{return validateHandle(value)}catch{return null}
}

/** Enforce the public profile limits before sending data to Supabase. */
export function validateProfileFields(displayName,bio) {
 const display_name=typeof displayName==='string'?displayName.trim():'';
 const description=typeof bio==='string'?bio.trim():'';
 if(!display_name||display_name.length>80)throw Error('Profilname muss 1 bis 80 Zeichen enthalten');
 if(description.length>500)throw Error('Profilbeschreibung darf maximal 500 Zeichen enthalten');
 return {display_name,bio:description};
}

/** Fetch one lookahead row to know whether another feed page exists. */
export function feedPage(rows,pageSize=20) {
 if(!Array.isArray(rows)||!Number.isInteger(pageSize)||pageSize<1)throw Error('Ungültige Feed-Seite');
 return {items:rows.slice(0,pageSize),hasMore:rows.length>pageSize};
}

/** Reject empty credentials before invoking the remote auth endpoint. */
export function validateCredentials(email,password) {
 const address=typeof email==='string'?email.trim():'';
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)||address.length>254)throw Error('Bitte eine gültige E-Mail-Adresse eingeben');
 if(typeof password!=='string'||password.length<8)throw Error('Passwort muss mindestens 8 Zeichen enthalten');
 return {email:address,password};
}

/** A profile search must contain two useful characters after normalization. */
export function validatedProfileSearch(input) {
 const term=normalizeProfileSearch(input);
 if(term.replace(/[ -]/g,'').length<2)throw Error('Bitte mindestens zwei gültige Suchzeichen eingeben');
 return term;
}

/** Preserve a shared product link across sign-in only while the user has not replaced it. */
export function shouldRestoreSharedProductUrl(currentUrl,sharedUrl) {
 return typeof sharedUrl==='string'&&sharedUrl.length>0&&currentUrl===sharedUrl;
}

/** Compare a feed request snapshot with current UI state after async work. */
export function isFeedRequestStale(request,current) {
 return request.offset!==current.offset||request.revision!==current.revision||request.filter!==current.filter||request.sort!==current.sort||request.userId!==current.userId||request.profileId!==current.profileId;
}

/** A hidden profile or wish is filtered locally; pagination still advances over server rows. */
export function isWishLocallyHidden(wish,hiddenWishIds,hiddenProfileIds) {
 return hiddenWishIds.has(wish.id)||hiddenProfileIds.has(wish.user_id);
}

/** A profile permalink is only built from a valid public handle. */
export function profileDisplayLabel(displayName,handle) {
 const name=typeof displayName==='string'?displayName.trim():'';
 const safe=requestedProfileHandle(handle);
 return safe?(name||'Profil')+' (@'+safe+')':(name||'Profil');
}

/** Convert database errors to actionable, non-sensitive German messages. */
export function wishlistErrorMessage(error) {
 if(!error)return 'Unbekannter Fehler. Bitte erneut versuchen.';
 if(error?.code==='23505')return 'Dieser Eintrag existiert bereits.';
 if(error?.code==='42501'||error?.code==='PGRST301')return 'Keine Berechtigung. Bitte melde dich erneut an.';
 if(error?.code==='23503')return 'Der verknüpfte Eintrag ist nicht mehr verfügbar. Bitte neu laden.';
 if(error?.code==='429'||error?.status===429)return 'Zu viele Anfragen. Bitte warte kurz und versuche es erneut.';
 if(typeof error?.message==='string'&&/failed to fetch|networkerror|load failed|fetch failed/i.test(error.message))return 'Netzwerkfehler. Bitte Internetverbindung prüfen und erneut versuchen.';
 if(error?.code==='23514'||error?.code==='22P02')return 'Ungültige Eingabe. Bitte deine Angaben prüfen.';
 if(error?.code==='PGRST116')return 'Eintrag nicht gefunden. Bitte neu laden.';
 if(typeof error?.status==='number'&&error.status>=500)return 'Der Dienst ist vorübergehend nicht erreichbar. Bitte später erneut versuchen.';
 if(typeof error?.status==='number'&&error.status>=400)return 'Anfrage fehlgeschlagen. Bitte Eingaben und Anmeldung prüfen.';
 if(error instanceof Error&&!('code' in error)&&!('status' in error))return error.message||'Unbekannter Fehler. Bitte erneut versuchen.';
 return 'Die Anfrage konnte nicht abgeschlossen werden. Bitte erneut versuchen.';
}

/** Copy links without requiring a secure-context Clipboard API. */
export async function copyShareLink(text,clipboard=globalThis.navigator?.clipboard,doc=globalThis.document) {
 if(typeof text!=='string'||!/^https:\/\//.test(text))throw Error('Ungültiger Link.');
 try{const url=new URL(text);if(url.protocol!=='https:'||!url.hostname||url.username||url.password)throw Error('Ungültiger Link.');}catch{throw Error('Ungültiger Link.');}
 if(clipboard?.writeText){try{await clipboard.writeText(text);return 'clipboard'}catch{}}
 if(!doc?.createElement||!doc?.body)throw Error('Kopieren nicht möglich. Bitte den Link aus der Adresszeile kopieren.');
 const input=doc.createElement('textarea');
 input.value=text;input.setAttribute('readonly','');input.style.position='fixed';input.style.left='-9999px';
 doc.body.append(input);
 try{
  input.select();
  if(typeof doc.execCommand!=='function'||!doc.execCommand('copy'))throw Error('Kopieren nicht möglich. Bitte den Link aus der Adresszeile kopieren.');
  return 'fallback';
 }finally{input.remove()}
}

/** Produce a spreadsheet-safe, UTF-8 CSV backup from the signed-in user's own wishes. */
export function exportWishlistCsv(rows) {
 if(!Array.isArray(rows))throw Error('Ungültige Exportdaten');
 const safe=value=>{
  let s=String(value??'').replace(/\r\n?/g,'\n');
  // Avoid spreadsheet formula execution when opening a downloaded CSV.
  if(/^[\s\u0000-\u001f]*[=+@-]/.test(s))s="'"+s;
  return '"'+s.replace(/"/g,'""')+'"';
 };
 const header=['Amazon-ASIN','Produkttitel','Notiz','Priorität','Erstellt am','Amazon-Link'];
 const lines=[header.map(safe).join(';')];
 for(const row of rows){
  const product=row?.wishlist_products;
  if(!product||!/^([A-Z0-9]{10})$/.test(product.asin)||product.marketplace!=='amazon.de')throw Error('Ungültiger Exportdatensatz');
  lines.push([product.asin,product.title,row.note,validatePriority(row.priority),row.created_at,'https://www.amazon.de/dp/'+product.asin].map(safe).join(';'));
 }
 return '\uFEFF'+lines.join('\r\n')+'\r\n';
}

/** Stable, localized priority names for cards and exports. */
export function priorityLabel(value) {
 const priority=validatePriority(value);
 return {1:'Sehr wichtig',2:'Normal',3:'Irgendwann'}[priority];
}

/** Reject unexpected export rows rather than silently exporting partial data. */
export function validateWishlistExportPage(rows,pageSize=200) {
 if(!Array.isArray(rows)||!Number.isInteger(pageSize)||pageSize<1||rows.length>pageSize)throw Error('Ungültige Exportantwort');
 return rows;
}

/** Build a portable JSON backup without private auth fields or internal account IDs. */
export function exportWishlistJson(rows, publicProfile=null) {
 if(!Array.isArray(rows))throw Error('Ungültige Exportdaten');
 const wishes=rows.map(row=>{
  const product=row?.wishlist_products;
  if(!product||product.marketplace!=='amazon.de'||!/^[A-Z0-9]{10}$/.test(product.asin))throw Error('Ungültiger Exportdatensatz');
  return {asin:product.asin,amazon_url:'https://www.amazon.de/dp/'+product.asin,title:String(product.title??''),note:String(row.note??''),priority:validatePriority(row.priority),created_at:String(row.created_at??'')};
 });
 const handle=requestedProfileHandle(publicProfile?.handle);
 return JSON.stringify({format:'helferlein-wishlist-backup',version:1,exported_at:new Date().toISOString(),profile:handle?{handle,display_name:String(publicProfile.display_name??''),bio:String(publicProfile.bio??'')}:null,wishes},null,2)+'\n';
}

/** A failed export must not retain stale progress text. */
export function exportProgressText(count,total=null) {
 if(!Number.isSafeInteger(count)||count<0)throw Error('Ungültiger Exportfortschritt');
 return total===null?count+' Wünsche geladen …':count+' von '+total+' Wünschen geladen …';
}

/**
 * Parse a local Helferlein backup without performing any writes.
 * The preview deliberately ignores any unrecognized fields, including account IDs.
 */
export function previewWishlistBackup(raw) {
 if(typeof raw!=='string'||raw.length>2_000_000)throw Error('Sicherungsdatei fehlt oder ist zu groß (maximal 2 MB).');
 let data;
 try{data=JSON.parse(raw)}catch{throw Error('Die Datei enthält kein gültiges JSON.')}
 if(!data||Array.isArray(data)||data.format!=='helferlein-wishlist-backup'||data.version!==1||!Array.isArray(data.wishes))throw Error('Keine unterstützte Helferlein-Wunschlisten-Sicherung.');
 if(data.wishes.length>10000)throw Error('Die Sicherung enthält zu viele Wünsche.');
 let profile=null;
 if(data.profile!==null&&data.profile!==undefined){
  if(!data.profile||Array.isArray(data.profile))throw Error('Ungültiges Profil in der Sicherung.');
  const handle=validateHandle(data.profile.handle);
  const fields=validateProfileFields(data.profile.display_name,data.profile.bio);
  profile={handle,...fields};
 }
 const seen=new Set();
 const wishes=data.wishes.map((row,index)=>{
  if(!row||Array.isArray(row)||typeof row!=='object')throw Error('Ungültiger Wunsch in Zeile '+(index+1)+'.');
  if(typeof row.asin!=='string'||!/^[A-Z0-9]{10}$/.test(row.asin))throw Error('Ungültige ASIN in Zeile '+(index+1)+'.');
  const {title,note}=validateWishFields(row.title,row.note);
  const priority=validatePriority(row.priority);
  if(seen.has(row.asin))throw Error('Doppelte ASIN in der Sicherung: '+row.asin);
  seen.add(row.asin);
  return {asin:row.asin,title,note,priority};
 });
 return {profile,wishes,count:wishes.length};
}
