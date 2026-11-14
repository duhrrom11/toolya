/* Local-only, explicitly irreversible encrypted estate handoff. No network requests. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const enc = new TextEncoder(), dec = new TextDecoder('utf-8', {fatal:true});
  const MAX = 5 * 1024 * 1024;
  const MAX_PLAINTEXT = 5 * 1024 * 1024;
  const B64 = bytes => btoa(Array.from(bytes, b => String.fromCharCode(b)).join(''));
  const unb64 = value => {
    if (typeof value !== 'string' || value.length > 8_000_000 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) throw Error('Ungültiges Dateiformat.');
    return Uint8Array.from(atob(value), c => c.charCodeAt(0));
  };
  const download = (name, data) => {
    const blob = new Blob([JSON.stringify(data)], {type:'application/json'});
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  };
  const read = async file => {
    if (!file || file.size > MAX || file.size < 2) throw Error('Datei fehlt oder ist zu groß (max. 5 MB).');
    return JSON.parse(await file.text());
  };
  const show = (id, message) => { $(id).textContent = message; };
  const validPublic = obj => obj && obj.kind === 'helferlein-heir-public-key' && obj.version === 1 &&
    obj.algorithm === 'RSA-OAEP-3072-SHA256' && obj.publicKey?.kty === 'RSA' &&
    obj.publicKey?.alg === 'RSA-OAEP-256' && obj.publicKey?.key_ops?.includes('encrypt') &&
    typeof obj.publicKey.n === 'string' && obj.publicKey.n.length >= 500 && obj.publicKey.n.length < 1500 &&
    obj.publicKey.e === 'AQAB';
  const derive = async (passphrase, salt) => {
    const material = await crypto.subtle.importKey('raw',enc.encode(passphrase),'PBKDF2',false,['deriveKey']);
    return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:600000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
  };
  const protectPrivate = async (jwk, passphrase) => {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await derive(passphrase,salt);
    const ciphertext = await crypto.subtle.encrypt({name:'AES-GCM',iv},key,enc.encode(JSON.stringify(jwk)));
    return {kind:'helferlein-heir-private-key-protected',version:2,algorithm:'PBKDF2-SHA256+AES-256-GCM',
      iterations:600000,salt:B64(salt),iv:B64(iv),ciphertext:B64(new Uint8Array(ciphertext))};
  };
  const unlockPrivate = async (obj, passphrase) => {
    if (obj?.kind !== 'helferlein-heir-private-key-protected' || obj.version !== 2 ||
        obj.algorithm !== 'PBKDF2-SHA256+AES-256-GCM' || obj.iterations !== 600000)
      throw Error('Ungültige private Schlüsseldatei.');
    const salt=unb64(obj.salt),iv=unb64(obj.iv),ciphertext=unb64(obj.ciphertext);
    if (salt.length !== 16 || iv.length !== 12 || ciphertext.length < 32 || ciphertext.length > 16384)
      throw Error('Ungültige private Schlüsseldatei.');
    const key = await derive(passphrase,salt);
    return JSON.parse(dec.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv},key,ciphertext)));
  };
  let pendingPublicKey = null;
  let publicKeySaved = false;
  $('downloadPublicKey').addEventListener('click', () => {
    if (!pendingPublicKey) return;
    download('helferlein-erbe-oeffentlicher-schluessel.json',pendingPublicKey);
    publicKeySaved = true;
    show('keyStatus','Öffentlicher Schlüssel heruntergeladen. Nur diese Datei an den Nachlassbesitzer weitergeben. Privaten Schlüssel und Passwort getrennt sicher aufbewahren.');
  });
  $('createKey').addEventListener('click', async () => {
    $('createKey').disabled = true;
    try {
      if (pendingPublicKey && !publicKeySaved) throw Error('Bitte zuerst den öffentlichen Schlüssel herunterladen, bevor du ein neues Schlüsselpaar erstellst.');
      const passphrase = $('keyPassphrase').value;
      const confirmation = $('keyPassphraseConfirm').value;
      if (passphrase.length < 16 || passphrase.length > 1024) throw Error('Mindestens 16 Zeichen Passwort erforderlich.');
      if (passphrase !== confirmation) throw Error('Passwörter stimmen nicht überein.');
      const pair = await crypto.subtle.generateKey({name:'RSA-OAEP',modulusLength:3072,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['encrypt','decrypt']);
      const publicKey = await crypto.subtle.exportKey('jwk',pair.publicKey);
      const privateKey = await crypto.subtle.exportKey('jwk',pair.privateKey);
      const protectedPrivate = await protectPrivate(privateKey,passphrase);
      download('helferlein-erbe-privatschluessel-verschluesselt.json',protectedPrivate);
      pendingPublicKey = {kind:'helferlein-heir-public-key',version:1,algorithm:'RSA-OAEP-3072-SHA256',publicKey};
      publicKeySaved = false;
      $('downloadPublicKey').disabled = false;
      show('keyStatus','Privater Schlüssel heruntergeladen. Jetzt den öffentlichen Schlüssel mit dem zweiten Button herunterladen. Beide Dateien sind für die Übergabe nötig.');
    } catch(e) { show('keyStatus',e instanceof Error ? e.message : 'Schlüsselerstellung fehlgeschlagen.'); }
    finally { $('keyPassphrase').value = ''; $('keyPassphraseConfirm').value = ''; $('createKey').disabled = false; }
  });
  $('exportEstate').addEventListener('click', async () => {
    $('exportEstate').disabled = true;
    try {
      if (!$('confirmRelease').checked) throw Error('Bitte die unwiderrufliche Übergabe ausdrücklich bestätigen.');
      const recipient = await read($('publicKeyFile').files[0]);
      if (!validPublic(recipient)) throw Error('Ungültiger öffentlicher Erbenschlüssel.');
      const publicKey = await crypto.subtle.importKey('jwk',recipient.publicKey,{name:'RSA-OAEP',hash:'SHA-256'},false,['encrypt']);
      const raw = localStorage.getItem('digital_estate_vault');
      if (!raw || raw.length > MAX) throw Error('Kein geeigneter lokaler Tresor vorhanden.');
      const cfg = JSON.parse(raw);
      if (!/^[a-f0-9]{64}$/i.test(cfg.masterKeyHex || '') ||
          typeof cfg.encryptedData?.iv !== 'string' || typeof cfg.encryptedData?.ciphertext !== 'string')
        throw Error('Lokaler Tresor unvollständig.');
      const masterBytes = Uint8Array.from(cfg.masterKeyHex.match(/.{2}/g), x => parseInt(x,16));
      const master = await crypto.subtle.importKey('raw',masterBytes,{name:'AES-GCM'},false,['decrypt']);
      masterBytes.fill(0);
      const plaintext = await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(cfg.encryptedData.iv)},master,unb64(cfg.encryptedData.ciphertext));
      if (plaintext.byteLength > MAX_PLAINTEXT) throw Error('Tresorinhalt zu groß.');
      const vault = JSON.parse(dec.decode(plaintext));
      if (!Array.isArray(vault.entries)) throw Error('Tresorinhalt ungültig.');
      const payload = enc.encode(JSON.stringify({version:1,createdAt:new Date().toISOString(),entries:vault.entries}));
      if (payload.length > MAX) throw Error('Nachlass zu groß für diese Übergabe.');
      const aes = await crypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt','decrypt']);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const ciphertext = await crypto.subtle.encrypt({name:'AES-GCM',iv},aes,payload);
      const rawAes = new Uint8Array(await crypto.subtle.exportKey('raw',aes));
      const wrapped = await crypto.subtle.encrypt({name:'RSA-OAEP'},publicKey,rawAes);
      rawAes.fill(0);
      download('helferlein-nachlass-fuer-erbe-verschluesselt.json',{
        kind:'helferlein-heir-estate-package',version:1,algorithm:'RSA-OAEP-3072-SHA256+AES-256-GCM',
        iv:B64(iv),wrappedKey:B64(new Uint8Array(wrapped)),ciphertext:B64(new Uint8Array(ciphertext))
      });
      show('exportStatus','Verschlüsseltes Nachlasspaket erstellt. Nur der passende private Erbenschlüssel kann es öffnen. Bereits übergebene Kopien lassen sich später nicht zurückrufen.');
    } catch(e) { show('exportStatus',e instanceof Error?e.message:'Übergabe fehlgeschlagen.'); }
    finally { $('exportEstate').disabled = false; }
  });
  $('openEstate').addEventListener('click', async () => {
    $('openEstate').disabled = true;
    $('estateOutput').replaceChildren();
    try {
      const secret = await read($('privateKeyFile').files[0]);
      const pkg = await read($('estateFile').files[0]);
      if (pkg?.kind !== 'helferlein-heir-estate-package' || pkg.version !== 1 ||
          pkg.algorithm !== 'RSA-OAEP-3072-SHA256+AES-256-GCM')
        throw Error('Schlüssel oder Nachlassdatei haben ein ungültiges Format.');
      const passphrase = $('unlockPassphrase').value;
      if (!passphrase) throw Error('Passwort fehlt.');
      const privateJwk = await unlockPrivate(secret,passphrase);
      if (privateJwk?.kty !== 'RSA' || privateJwk?.alg !== 'RSA-OAEP-256' || !privateJwk?.d)
        throw Error('Ungültiger privater Schlüssel.');
      const privateKey = await crypto.subtle.importKey('jwk',privateJwk,{name:'RSA-OAEP',hash:'SHA-256'},false,['decrypt']);
      const wrapped = unb64(pkg.wrappedKey), iv = unb64(pkg.iv), ciphertext = unb64(pkg.ciphertext);
      if (wrapped.length !== 384 || iv.length !== 12 || ciphertext.length > MAX) throw Error('Ungültiges Paket.');
      const rawKey = new Uint8Array(await crypto.subtle.decrypt({name:'RSA-OAEP'},privateKey,wrapped));
      if (rawKey.length !== 32) throw Error('Ungültiger Schlüssel.');
      const aes = await crypto.subtle.importKey('raw',rawKey,{name:'AES-GCM'},false,['decrypt']);
      rawKey.fill(0);
      const plaintext = await crypto.subtle.decrypt({name:'AES-GCM',iv},aes,ciphertext);
      if (plaintext.byteLength > MAX_PLAINTEXT) throw Error('Nachlassinhalt zu groß.');
      const vault = JSON.parse(dec.decode(plaintext));
      if (vault.version !== 1 || !Array.isArray(vault.entries)) throw Error('Nachlassinhalt ungültig.');
      // Show text only; never inject untrusted estate contents as HTML.
      const pre = document.createElement('pre');
      pre.className = 'whitespace-pre-wrap break-words text-sm bg-slate-950 p-4 rounded-xl max-h-96 overflow-auto';
      pre.textContent = JSON.stringify(vault.entries,null,2);
      $('estateOutput').append(pre);
      show('openStatus','Deine Daten sind geöffnet.');
    } catch { show('openStatus','Entschlüsselung fehlgeschlagen. Bitte passenden privaten Schlüssel und Nachlassdatei prüfen.'); }
    finally { $('unlockPassphrase').value = ''; $('openEstate').disabled = false; }
  });
  window.addEventListener('pagehide',() => { pendingPublicKey = null; publicKeySaved = false; $('estateOutput').replaceChildren(); });
})();
