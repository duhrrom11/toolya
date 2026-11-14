/* Helferlein's own notice window instead of browser-branded alert boxes. */
(() => {
 'use strict';
 const nativeAlert=window.alert.bind(window), queue=[]; let showing=false;
 function next(){
  if(showing||!queue.length)return;
  if(!document.body){nativeAlert(queue.shift());return next();}
  showing=true;
  const message=queue.shift(), previous=document.activeElement;
  const overlay=document.createElement('div'),panel=document.createElement('div');
  overlay.className='hl-alert-overlay';panel.className='hl-alert-panel';
  panel.setAttribute('role','alertdialog');panel.setAttribute('aria-modal','true');
  const title=document.createElement('h2'),body=document.createElement('p'),button=document.createElement('button');
  title.textContent='Helferlein';title.id='hl-alert-title';
  body.textContent=message;body.id='hl-alert-message';
  button.type='button';button.textContent='OK';
  panel.setAttribute('aria-labelledby',title.id);panel.setAttribute('aria-describedby',body.id);
  function close(){overlay.remove();document.removeEventListener('keydown',onKey,true);showing=false;if(previous?.isConnected)previous.focus?.();next();}
  function onKey(e){if(e.key==='Escape'||e.key==='Enter'){e.preventDefault();e.stopPropagation();close();}else if(e.key==='Tab'){e.preventDefault();button.focus();}}
  button.addEventListener('click',close);
  panel.append(title,body,button);overlay.append(panel);document.body.append(overlay);
  document.addEventListener('keydown',onKey,true);button.focus();
 }
 function friendlyNotice(message){
  const original=String(message??'').trim();
  const cleaned=original.replace(/^[\s✅✔☑🎉]+/u,'').trim();
  // Only shorten clear success notices. Never mask errors, partial saves or warnings.
  if(/^(?:erfolgreich (?:gespeichert|synchronisiert)|(?:einstellungen|daten|eintrag|kontakt|pflanze|tarife|gegenstand|parkplatz|rezepte|buchung|notizen|vertrauenspersonen).{0,65}(?:erfolgreich )?gespeichert[!.]?|(?:lokal und (?:in der )?(?:cloud|online|supabase) gespeichert)|(?:mit der cloud synchronisiert)|(?:synchronisierung abgeschlossen))[!.]?$/i.test(cleaned))return 'Gespeichert';
  return original;
 }
 window.alert=(message)=>{const normalized=friendlyNotice(message);if(!normalized)return;queue.push(normalized);next();};
 const style=document.createElement('style');
 style.textContent='.hl-alert-overlay{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:20px;background:#080d1fc9;box-sizing:border-box}.hl-alert-panel{box-sizing:border-box;width:min(100%,440px);max-height:80vh;overflow:auto;padding:26px;border-radius:18px;background:#fff;color:#17223d;box-shadow:0 22px 80px #0006;font:inherit}.hl-alert-panel h2{font-size:1.15rem;font-weight:800;color:#5143a6;margin:0 0 14px}.hl-alert-panel p{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.55;margin:0 0 24px}.hl-alert-panel button{display:block;margin-left:auto;min-width:95px;min-height:42px;padding:10px 18px;border:0;border-radius:10px;background:#5143a6;color:white;font:inherit;font-weight:700;cursor:pointer}.hl-alert-panel button:focus-visible{outline:3px solid #8f80ef;outline-offset:3px}@media(prefers-color-scheme:dark){.hl-alert-panel{background:#1b2340;color:#f2f4ff}}';
 (document.head||document.documentElement).append(style);
})();
