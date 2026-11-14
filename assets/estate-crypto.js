/* AES-GCM owner storage and an independent read replica. No owner key is released. */
(function(root){
 'use strict';
 const encode=new TextEncoder();
 const hex=bytes=>Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
 const unhex=s=>{if(!/^[a-f0-9]{64}$/i.test(s))throw Error('invalid_key');return Uint8Array.from(s.match(/../g),x=>parseInt(x,16));};
 const b64=bytes=>{let s='';for(const x of new Uint8Array(bytes))s+=String.fromCharCode(x);return btoa(s);};
 const decode=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
 const random=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
 async function aes(s,uses){return crypto.subtle.importKey('raw',unhex(s),'AES-GCM',false,uses);}
 async function encrypt(value,key){const iv=crypto.getRandomValues(new Uint8Array(12));return {iv:b64(iv),ciphertext:b64(await crypto.subtle.encrypt({name:'AES-GCM',iv},await aes(key,['encrypt']),encode.encode(JSON.stringify(value))))};}
 async function decrypt(value,key){return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(value.iv)},await aes(key,['decrypt']),decode(value.ciphertext))));}
 async function hash(s){return hex(new Uint8Array(await crypto.subtle.digest('SHA-256',encode.encode(s))));}
 async function passwordKey(password,salt){const base=await crypto.subtle.importKey('raw',encode.encode(password),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:600000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);}
 async function wrap(key,password){const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));return {version:1,kdf:'PBKDF2-SHA256',iterations:600000,salt:b64(salt),iv:b64(iv),ciphertext:b64(await crypto.subtle.encrypt({name:'AES-GCM',iv},await passwordKey(password,salt),unhex(key)))};}
 async function unwrap(w,password){if(w?.version!==1||w.kdf!=='PBKDF2-SHA256'||w.iterations!==600000||decode(w.salt).length!==16||decode(w.iv).length!==12||decode(w.ciphertext).length!==48)throw Error('invalid_recovery');return hex(new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(w.iv)},await passwordKey(password,decode(w.salt)),decode(w.ciphertext))));}
 const normalize=s=>String(s).replace(/[\s-]/g,'').toLowerCase();
 async function readReplica(entries,people,keys){
  const readKey=random();
  const guardians=[];
  for(const person of people){const token=keys[person.id];unhex(token);guardians.push({id:String(person.id),hash:await hash(token),envelope:await encrypt({readKey},await hash('Toolya read envelope v2:'+token))});}
  return {content:await encrypt({entries},readKey),guardians};
 }
 async function openReplica(result,token){const {readKey}=await decrypt(result.envelope,await hash('Toolya read envelope v2:'+token));return decrypt(result.content,readKey);}
 root.EstateCrypto={random,encrypt,decrypt,hash,wrap,unwrap,normalize,readReplica,openReplica};
 if(typeof module!=='undefined')module.exports=root.EstateCrypto;
})(globalThis);
