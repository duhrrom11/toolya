import {readAppLocale} from '../../shared/toolya/i18n/locale.mjs';
import {createExportPdf} from '../../shared/toolya/pdf-export.mjs';
import {guardedWishlistWrite} from './wishlist-auth.mjs';
import {action, directoryUrl, element, httpsUrl, identityId, homeUrl, mascotUrl, translate as t, verifiedAccount} from './directory-links.mjs';
import {cardDesigns, cardFormats, cardLanguages, cardTextFields, newVariant} from './directory-card-designs.mjs';
import {drawCard, fourPlacements, loadCardImage, sheetImage} from './directory-card-render.mjs';

const toBlob = canvas => new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
const limits = {title:160, name:161, explanation:500, note:500, qr:90, promo:90, social:1000};

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = element('a', '', {href: url, download: name});
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

async function uploadPhoto(file) {
  if (!/^image\/(png|jpeg|webp|avif|gif)$/.test(file.type) || file.size>20*1024*1024) throw new Error();
  const url = URL.createObjectURL(file);
  try {
    const img = await loadCardImage(url);
    if (!img || !img.naturalWidth || !img.naturalHeight) throw new Error();
    const scale = Math.min(1,1200/Math.max(img.naturalWidth,img.naturalHeight));
    const canvas = element('canvas');
    canvas.width=Math.round(img.naturalWidth*scale);canvas.height=Math.round(img.naturalHeight*scale);
    canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
    return canvas.toDataURL('image/webp', .82);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function control(parent, tag, label, attributes = {}) {
  const wrapper = element('label', t(label));
  const input = element(tag, '', attributes);
  wrapper.append(input);
  parent.append(wrapper);
  return input;
}

function selector(parent, label, options, value, change) {
  const input = control(parent, 'select', label);
  for (const [key, text] of options) input.append(element('option', text, {value:key}));
  input.value=value;
  input.onchange=()=>change(input.value);
  return input;
}

function toggle(parent, label, value, change) {
  const wrapper=element('label','',{class:'wish-card-check'});
  const input=element('input','',{type:'checkbox'});
  input.checked=value;
  input.onchange=()=>change(input.checked);
  wrapper.append(input,t(label));parent.append(wrapper);
}

function initialDraft(kind, id, title = '') {
  const variant=newVariant(readAppLocale(),kind,title);
  return {
    kind,id,design:'simple',palette:0,accent:'',ink:false,showUrl:false,image:'',
    format:'square',active:variant.id,second:'',variants:[variant],title
  };
}

function restoredDraft(row) {
  const data=row.draft;
  if (!data || !['profile','list'].includes(data.kind) || !identityId.test(data.id)
    || !Array.isArray(data.variants) || !data.variants.length) throw new Error();
  const draft=initialDraft(data.kind,data.id,row.title);
  const design=cardDesigns.find(choice=>choice.id===data.design);
  if(design)draft.design=design.id;
  if(Number.isInteger(data.palette)&&data.palette>=0&&data.palette<5)draft.palette=data.palette;
  if(/^#[0-9a-f]{6}$/i.test(data.accent))draft.accent=data.accent;
  if(Object.hasOwn(cardFormats,data.format))draft.format=data.format;
  draft.ink=!!data.ink;draft.showUrl=!!data.showUrl;
  draft.image=typeof data.image==='string' && /^data:image\/(?:webp|png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(data.image) ? data.image : httpsUrl(data.image || '');
  draft.variants=data.variants.filter(v=>v&&identityId.test(v.id)&&Object.hasOwn(cardLanguages,v.language)).slice(0,12).map(v=>({
    id:v.id,language:v.language,direction:['ltr','rtl'].includes(v.direction)?v.direction:'auto',
    text:Object.fromEntries(Object.keys(limits).map(key=>[key,typeof v.text?.[key]==='string'?v.text[key].slice(0,limits[key]):'']))
  }));
  if(!draft.variants.length)throw new Error();
  draft.active=draft.variants.some(v=>v.id===data.active)?data.active:draft.variants[0].id;
  draft.second=draft.variants.some(v=>v.id===data.second&&v.id!==draft.active)?data.second:'';
  return draft;
}

export function mountCardEditor(root, {db, publicDb, params}) {
  root.classList.add('wish-card-workspace');
  root.setAttribute('data-user-content','');
  let account=verifiedAccount(), savedId=identityId.test(params.get('draft'))?params.get('draft'):'';
  let draft=null, targetProfile=null, targetName='', targets=[], privateOwner=null, photo=null, mascot=null, output=null;
  let version=0, photoVersion=0, accountVersion=0, saveBusy=false, banner='';
  let customize=false,mobileView='edit', canvas, preview, warning, shareButton, outputButtons, pageStatus;
  let formatReady=false, requestFrame=0, photoLoading=false, imageRevision=0;
  const printRoot=element('div','',{id:'wish-card-print'});
  document.body.classList.add('wish-card-active');
  document.body.append(printRoot);

  const targetUrl=()=>directoryUrl(draft.kind,draft.id).href;
  const variant=()=>draft.variants.find(v=>v.id===draft.active);
  const activeDesign=()=>cardDesigns.find(design=>design.id===draft.design);
  const caption=()=>variant().text.social.trim();
  const shareText=()=>[caption(),targetUrl()].filter(Boolean).join('\n');
  const updateStatus=(message='')=>{banner=message;if(pageStatus)pageStatus.textContent=t(message);};

  async function target(kind,id) {
    if (!identityId.test(id||'')) throw new Error();
    const response=kind==='profile'
      ? await publicDb.rpc('get_wishlist_public_profile',{profile_id:id})
      : await publicDb.rpc('get_wishlist_public_list',{list_id:id});
    if (response.error) throw response.error;
    if (kind==='profile' && response.data) return {id,name:response.data.display_name,profile:response.data};
    if (kind==='list' && response.data?.list) {
      const item=response.data.list;
      const profile=await publicDb.rpc('get_wishlist_public_profile',{profile_id:response.data.profile_id});
      return {id:item.id,name:item.name,profile:profile.data};
    }
    throw new Error();
  }

  async function pick(kind,id,fromDraft=null) {
    const g=++version;
    output=null;formatReady=false;
    updateStatus('Wird geladen …');
    try {
      const resolved=await target(kind,id);
      if(g!==version)return;
      targetName=resolved.name;targetProfile=resolved.profile;
      draft=fromDraft||initialDraft(kind,resolved.id,targetName);
      draft.id=resolved.id;
      updateStatus();
      render();
      void setPhoto(draft.image);
    } catch {
      if(g!==version)return;
      draft=null;output=null;photo=null;photoLoading=false;formatReady=false;
      render();
      updateStatus('Das QR-Ziel ist gerade nicht öffentlich erreichbar.');
    }
  }

  async function setPhoto(url) {
    const g=++photoVersion;
    photo=null;
    photoLoading=!!url;
    updatePreview();
    const cached=await loadCardImage(url,!!httpsUrl(url));
    if(g!==photoVersion)return;
    photo=cached;photoLoading=false;
    if(url&&!cached)updateStatus('Dieses Bild kann nicht exportiert werden. Wähle eine Bilddatei aus.');
    else updateStatus();
    updatePreview();
  }

  function updatePreview() {
    formatReady=false;
    const revision=++imageRevision;
    if(shareButton)shareButton.file=null;
    for(const button of outputButtons||[])button.disabled=true;
    cancelAnimationFrame(requestFrame);
    if(!draft||!canvas||!mascot||photoLoading)return;
    requestFrame=requestAnimationFrame(()=>{
      try {
        output=drawCard({draft,target:targetUrl(),format:draft.format,mascot,photo},canvas);
        preview.replaceChildren(sheetImage(canvas,draft.format));
        const texts=[draft.active,draft.second].map(id=>draft.variants.find(v=>v.id===id)?.text).filter(Boolean);
        const label=texts.flatMap(text=>[text.title,text.name,text.explanation,text.note,text.qr,text.promo]).filter(Boolean).join('. ');
        preview.setAttribute('aria-label',label||t('Kartenvorschau mit beiden QR-Codes'));
        const missingLabel=!texts.some(text=>text.qr.trim());
        warning.hidden=!output.overflow&&!missingLabel;
        warning.textContent=t(missingLabel?'Beschrifte den großen QR-Code vor dem Export.':'Für dieses Format ist der Text zu lang. Kürze ihn oder wähle ein größeres Format.');
        formatReady=!output.overflow&&!missingLabel;
        for(const button of outputButtons)button.disabled=!formatReady;
        if(formatReady && navigator.canShare){
          const shareCanvas=sheetImage(canvas,draft.format);
          void toBlob(shareCanvas).then(blob=>{
            if(blob&&revision===imageRevision)shareButton.file=new File([blob],'toolya-karte.png',{type:'image/png'});
          });
        }
      } catch {
        output=null;
        updateStatus('Die Kartenvorschau konnte nicht erstellt werden.');
      }
    });
  }

  function printCard() {
    if(!formatReady)return;
    const sheet=sheetImage(canvas,draft.format);
    const img=element('img','',{src:sheet.toDataURL(),alt:t('Kartenvorschau mit beiden QR-Codes')});
    const page=element('div','',{class:draft.format==='four'?'wish-four-page':'wish-print-page'});
    page.append(img);
    printRoot.replaceChildren(page);
    img.decode().then(()=>window.print()).catch(()=>updateStatus('Das Bild konnte nicht ausgegeben werden.'));
  }

  async function pdfCard() {
    if(!formatReady)return;
    const format=draft.format, {brand}=output;
    const source={width:canvas.width,height:canvas.height};
    const sheet=sheetImage(canvas,format);
    const png=sheet.toDataURL('image/png');
    const sheetWidth=sheet.width,sheetHeight=sheet.height;
    const pdf=await createExportPdf(readAppLocale());
    if(!pdf)return;
    const w=210,h=297;
    const pageScale=Math.min(w/sheetWidth,h/sheetHeight);
    const actualWidth=sheetWidth*pageScale,actualHeight=sheetHeight*pageScale;
    const x=(w-actualWidth)/2,y=(h-actualHeight)/2;
    pdf.addImage(png,'PNG',x,y,actualWidth,actualHeight,undefined,'FAST');
    const placements=format==='four'?fourPlacements():[{x,y,w:actualWidth,h:actualHeight}];
    for(const box of placements)pdf.link(box.x+brand.x/source.width*box.w,box.y+brand.y/source.height*box.h,brand.w/source.width*box.w,brand.h/source.height*box.h,{url:homeUrl});
    pdf.save('toolya-karte.pdf');
  }

  async function copy(value) {
    try {
      await navigator.clipboard.writeText(value);
      updateStatus('Kopiert.');
    } catch {
      const input=element('textarea','',{class:'wish-copy-fallback',readonly:'', 'aria-label':t('Text zum Kopieren')});
      input.value=value;pageStatus.after(input);input.focus();input.select();
      updateStatus('Kopiere den markierten Text.');
    }
  }

  async function deviceShare() {
    const base={title:variant().text.title||targetName,text:caption(),url:targetUrl()};
    if(!navigator.share)return copy(shareText());
    const visual=shareButton.file?[shareButton.file]:[];
    try {
      const full={...base,files:visual};
      if(visual.length&&navigator.canShare?.(full))await navigator.share(full);
      else await navigator.share(base);
    } catch(error) {
      if(error.name!=='AbortError')updateStatus('Teilen war gerade nicht möglich. Du kannst den Link kopieren und das Bild herunterladen.');
    }
  }

  async function save(duplicate) {
    if(!account||!draft||saveBusy)return;
    const owner=account.id;
    const g=accountVersion;
    const wasSaved=!!savedId;
    const data={title:draft.title.trim()||targetName.slice(0,100),draft:JSON.parse(JSON.stringify(draft))};
    saveBusy=true;
    try {
      const result=await guardedWishlistWrite(db,owner,()=>{
        const table=db.from('wishlist_card_drafts');
        return (duplicate||!wasSaved?table.insert(data):table.update(data).eq('id',savedId).eq('owner_id',owner)).select('id,title').single();
      });
      if(result.error||!result.data)throw result.error||new Error();
      if(g!==accountVersion)return;
      savedId=result.data.id;draft.title=result.data.title;privateOwner=owner;
      const url=new URL(location.href);url.searchParams.set('draft',savedId);history.replaceState(history.state,'',url);
      updateStatus(duplicate?'Kopie gespeichert.':'Gespeichert.');
      render();
    } catch {
      if(g===accountVersion)updateStatus('Speichern konnte nicht bestätigt werden. Bitte versuche es erneut.');
    } finally {saveBusy=false;}
  }

  function sharing(parent) {
    const list=element('div','',{class:'wish-edit-actions'});
    const facebook=new URL('https://www.facebook.com/sharer/sharer.php');facebook.searchParams.set('u',targetUrl());
    shareButton=action('Geräteteilen öffnen',deviceShare);
    list.append(shareButton,element('a','Facebook',{href:facebook.href,target:'_blank',rel:'noopener noreferrer'}));
    list.append(action('Link kopieren',()=>copy(targetUrl())),action('Text & Link kopieren',()=>copy(shareText())));
    const img=action('Bild herunterladen',async()=>{
      const blob=await toBlob(sheetImage(canvas,draft.format));
      if(blob)download(blob,'toolya-karte.png');
      else updateStatus('Das Bild konnte nicht ausgegeben werden.');
    });
    const pdf=action('PDF herunterladen',()=>void pdfCard().catch(()=>updateStatus('Das PDF konnte nicht ausgegeben werden.')));
    const print=action('Drucken',printCard);
    const qr=element('a',t('QR-Ziel öffnen'),{href:targetUrl(),target:'_blank',rel:'noopener noreferrer'});
    outputButtons=[img,pdf,print];
    list.append(img,pdf,print,qr);parent.append(list);
  }

  function controls(parent) {
    const designGroup=element('fieldset');
    designGroup.append(element('legend',t('Vorlage')));
    const designOptions=cardDesigns.map(d=>[d.id,t(d.category)+' · '+t(d.label)]);
    selector(designGroup,'Design',designOptions,draft.design,id=>{draft.design=id;draft.palette=0;render();});
    const swatches=element('div','',{class:'wish-card-palettes','aria-label':t('Farbpaletten')});
    activeDesign().colors.forEach((color,index)=>{
      const btn=action(color.name,()=>{draft.palette=index;draft.accent='';render();});
      btn.style.setProperty('--swatch-paper',color.paper);
      btn.style.setProperty('--swatch-accent',color.accent);
      btn.setAttribute('aria-pressed',String(index===draft.palette&&!draft.accent));
      if(index===draft.palette&&!draft.accent)btn.prepend('✓ ');
      swatches.append(btn);
    });
    designGroup.append(swatches);
    const accent=control(designGroup,'input','Eigene Akzentfarbe',{type:'color'});
    accent.value=draft.accent||activeDesign().colors[draft.palette].accent;
    accent.oninput=()=>{
      draft.accent=accent.value;
      for(const btn of swatches.children){btn.setAttribute('aria-pressed','false');btn.textContent=btn.textContent.replace(/^✓ /,'');}
      updatePreview();
    };
    toggle(designGroup,'Tintensparend mit weißem Hintergrund',draft.ink,value=>{draft.ink=value;updatePreview();});
    toggle(designGroup,'Toolya-Adresse beim großen QR-Code anzeigen',draft.showUrl,value=>{draft.showUrl=value;updatePreview();});
    parent.append(designGroup);

    const media=element('fieldset');
    media.append(element('legend',t('Foto oder Logo')));
    const file=control(media,'input','Eigenes Bild auswählen',{type:'file',accept:'image/png,image/jpeg,image/webp,image/avif,image/gif'});
    file.onchange=async()=>{
      const selected=file.files[0];if(!selected)return;
      const previous=draft;
      const upload=++photoVersion;
      try {
        const image=await uploadPhoto(selected);
        if(draft!==previous||upload!==photoVersion)return;
        draft.image=image;void setPhoto(image);
      } catch {updateStatus('Dieses Bild konnte nicht geladen werden.');}
    };
    if(targetProfile?.logo_url)media.append(action('Profilbild übernehmen',()=>{draft.image=targetProfile.logo_url;void setPhoto(draft.image);}));
    media.append(action('Bild entfernen',()=>{draft.image='';void setPhoto('');}));
    parent.append(media);

    const copyGroup=element('fieldset');
    copyGroup.append(element('legend',t('Kartentexte')));
    const languageOptions=Object.entries(cardLanguages).map(([lang,info])=>[lang,t(info[0])]);
    const versionLabel=v=>t(cardLanguages[v.language][0]);
    const variants=draft.variants.map(v=>[v.id,versionLabel(v)+(v.text.title?' · '+v.text.title.slice(0,28):'')]);
    selector(copyGroup,'Sprachfassung bearbeiten',variants,draft.active,value=>{
      if(value===draft.second)draft.second=draft.active;
      draft.active=value;render();
    });
    selector(copyGroup,'Kartensprache',languageOptions,variant().language,lang=>{
      variant().language=lang;
      variant().direction=lang==='ar'?'rtl':'auto';render();
    });
    const available=selector(copyGroup,'Neue Sprachfassung',languageOptions,'en',()=>{});
    const add=action('Sprachfassung hinzufügen',()=>{
      if(draft.variants.length>=12)return;
      const item=newVariant(available.value,draft.kind);
      draft.variants.push(item);draft.active=item.id;render();
    });
    add.disabled=draft.variants.length>=12;
    copyGroup.append(add);
    if(draft.variants.length>1) {
      selector(copyGroup,'Zweite Sprache auf der Karte',[['',t('Keine')],...variants.filter(([id])=>id!==draft.active)],draft.second,
        value=>{draft.second=value;updatePreview();});
      copyGroup.append(action('Sprachfassung entfernen',()=>{
        if(!window.confirm(t('Diese Sprachfassung entfernen?')))return;
        draft.variants=draft.variants.filter(v=>v.id!==draft.active);
        draft.active=draft.variants[0].id;
        if(draft.second===draft.active)draft.second='';
        render();
      }));
    }
    selector(copyGroup,'Schreibrichtung',[['auto',t('Automatisch')],['ltr',t('Links nach rechts')],['rtl',t('Rechts nach links')]],
      variant().direction,value=>{variant().direction=value;render();});
    if(targetProfile)copyGroup.append(action('Name aus dem Profil übernehmen',()=>{variant().text.name=targetProfile.display_name;render();}));
    if(variant().language!=='custom')copyGroup.append(action('Textidee übernehmen',()=>{
      const [,profile,list,promo,title,explanation,social]=cardLanguages[variant().language];
      const text=variant().text;
      text.title ||= title;text.explanation ||= explanation;text.social ||= social;
      text.qr ||= draft.kind==='profile'?profile:list;text.promo ||= promo;render();
    }));
    const sharingText=element('div');
    for(const [key,label] of Object.entries(cardTextFields)){
      const input=control(key==='social'?sharingText:copyGroup,['title','name'].includes(key)?'input':'textarea',label,{maxlength:limits[key],dir:variant().direction});
      input.value=variant().text[key];input.oninput=()=>{variant().text[key]=input.value;updatePreview();};
    }
    copyGroup.append(sharingText);parent.append(copyGroup);
  }

  function render() {
    root.replaceChildren();
    const links=element('nav','',{class:'wish-edit-actions','aria-label':t('Wunschlisten')});
    links.append(element('a',t('Zum Verzeichnis'),{href:directoryUrl().pathname}),element('a',t('Meine Karten'),{href:'/dashboard/#wish-cards'}));
    root.append(links,element('h2',t('Karten gestalten')));
    pageStatus=element('p',t(banner),{role:'status'});
    root.append(pageStatus);
    if(!draft){
      if(!savedId && targets.length){
        const picker=selector(root,'QR-Ziel',[['',t('Profil oder Liste auswählen')],...targets.map(item=>[item.kind+':'+item.id,item.name])],'',value=>{
          if(!value)return;
          const [kind,id]=value.split(':');void pick(kind,id);
        });
        picker.required=true;
      }else if(!account&&!params.has('profile')&&!params.has('list')){
        root.append(action('Anmelden',()=>window.openSettings()));
      }
      return;
    }
    const grid=element('div','',{class:'wish-card-grid'});
    const edit=element('div','',{class:'wish-card-controls'});
    const previewPanel=element('div','',{class:'wish-card-preview-panel'});
    const tabs=element('div','',{class:'wish-card-mobile-switch'});
    tabs.append(action('Bearbeiten',()=>{mobileView='edit';updateTabs();}),action('Vorschau',()=>{mobileView='preview';updateTabs();}));
    function updateTabs(){
      grid.dataset.mobile=mobileView;
      [...tabs.children].forEach((btn,index)=>btn.setAttribute('aria-pressed',String(mobileView===(index?'preview':'edit'))));
    }
    updateTabs();
    const choose=action(customize?'Gestaltung schließen':'Vorlage gestalten',()=>{customize=!customize;render();root.querySelector('.wish-card-design-toggle')?.focus();});
    choose.className='wish-card-design-toggle';
    edit.append(choose);
    selector(edit,'Ausgabeformat',Object.entries(cardFormats).map(([key,format])=>[key,t(format.label)]),draft.format,value=>{
      draft.format=value;updatePreview();
    });
    if(customize)controls(edit);
    if(account){
      const name=control(edit,'input','Name unter „Meine Karten“',{maxlength:100});
      name.value=draft.title;name.oninput=()=>{draft.title=name.value;};
      const actions=element('div','',{class:'wish-edit-actions'});
      actions.append(action('Entwurf speichern',()=>void save(false)));
      if(savedId)actions.append(action('Duplizieren',()=>void save(true)));
      edit.append(actions);
    }else edit.append(action('Anmelden, um Karten zu speichern',()=>window.openSettings()));
    preview=element('div','',{class:'wish-card-preview',role:'img'});
    warning=element('p',t('Für dieses Format ist der Text zu lang. Kürze ihn oder wähle ein größeres Format.'),{role:'status',class:'wish-card-warning',hidden:''});
    canvas=element('canvas');
    previewPanel.append(preview,warning);
    sharing(previewPanel);
    grid.append(edit,previewPanel);
    root.append(tabs,grid);
    updatePreview();
  }

  async function refreshAccount(state,initial=false){
    const next=verifiedAccount(state);
    if(!initial&&next?.id===account?.id)return;
    const previous=account;
    account=next;const g=++accountVersion;
    targets=[];
    if((privateOwner&&privateOwner!==account?.id)||(previous&&previous.id!==account?.id)){
      ++version;++photoVersion;
      draft=null;photo=null;output=null;privateOwner=null;formatReady=false;
      photoLoading=false;
    }
    render();
    if(!account)return;
    try {
      if(savedId&&!draft){
        const result=await db.from('wishlist_card_drafts').select('id,title,draft').eq('id',savedId).eq('owner_id',account.id).maybeSingle();
        if(g!==accountVersion)return;
        if(result.error||!result.data)throw new Error();
        const fromDraft=restoredDraft(result.data);
        privateOwner=account.id;customize=true;
        await pick(fromDraft.kind,fromDraft.id,fromDraft);
      } else if(!params.has('list')&&!params.has('profile')&&!draft){
        const [profiles,lists]=await Promise.all([
          db.from('wishlist_directory_profiles').select('id,display_name,visibility'),
          db.from('wishlist_directory_lists').select('id,profile_id,name,visibility')
        ]);
        if(g!==accountVersion)return;
        if(profiles.error||lists.error)throw new Error();
        const visible=(profiles.data||[]).filter(p=>p.visibility!=='private');
        targets=[
          ...visible.map(p=>({kind:'profile',id:p.id,name:p.display_name})),
          ...(lists.data||[]).filter(l=>l.visibility!=='private'&&visible.some(p=>p.id===l.profile_id)).map(l=>({kind:'list',id:l.id,name:l.name}))
        ];
        if(!targets.length)updateStatus('Veröffentliche zuerst ein Profil oder eine Wunschliste.');
        render();
      }
    } catch {if(g===accountVersion)updateStatus('Deine Karten konnten nicht geladen werden.');}
  }

  document.addEventListener('toolya:account-state',event=>void refreshAccount(event.detail));
  document.addEventListener('toolya:wishes-locale-change',render);
  let selectedMascot='';
  document.addEventListener('change',event=>{
    if(event.target.closest?.('.toolya-appearance'))void loadMascot();
  });
  window.addEventListener('storage',event=>{
    if(event.key==='helferlein-toolya-preferences-v1')void loadMascot();
  });
  async function loadMascot(){
    const url=mascotUrl();
    if(mascot&&selectedMascot===url)return;
    selectedMascot=url;
    const image=await loadCardImage(url);
    if(selectedMascot!==url)return;
    mascot=image;
    if(!mascot)updateStatus('Das Toolya-Maskottchen konnte nicht geladen werden.');
    updatePreview();
  }
  render();
  void loadMascot();
  if(savedId)void refreshAccount(window.toolyaAccountState,true);
  else if(params.has('list')||params.has('profile')){
    const kind=params.has('list')?'list':'profile';
    void pick(kind,params.get(kind));
  }else void refreshAccount(window.toolyaAccountState,true);

}
