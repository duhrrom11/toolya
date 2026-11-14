/* Toolya B3 pilot – presentation only. Never touches tool records or Supabase. */
(() => {
  'use strict';
  const THEME_KEY = 'helferlein_ui_theme_v1';
  const LAYOUT_KEY = 'helferlein_ui_layout_pflanzen_v1';
  const definitions = [
    {id:'stats',name:'Pflanzen-Statistiken',size:'l'},
    {id:'calendar',name:'Garten-Saisonkalender',size:'m'},
    {id:'create',name:'Pflanze erfassen',size:'l'},
    {id:'plants',name:'Pflanzenliste & Filter',size:'l'},
    {id:'recommendations',name:'Empfehlungen',size:'m'}
  ];
  const clone = x => JSON.parse(JSON.stringify(x));
  const defaults = () => definitions.map((d,i)=>({id:d.id,visible:true,size:d.size,order:i}));
  const safeRead = (key) => { try{return localStorage.getItem(key)}catch{return null} };
  const safeWrite = (key,value) => {try{localStorage.setItem(key,value);return true}catch{return false}};
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  let theme = safeRead(THEME_KEY) || 'auto';
  if(!['light','dark','auto'].includes(theme))theme='auto';
  function applyTheme(){
    const dark=theme==='dark'||(theme==='auto'&&media.matches);
    document.body.classList.toggle('b3-dark',dark);
    document.documentElement.style.colorScheme=dark?'dark':'light';
    // Account actions have legacy Tailwind fills; guarantee accessible contrast
    // even when CDN-generated utility styles arrive after the local stylesheet.
    [
      ['#settingsModal button[onclick="supabaseLogin()"]','#246b3f','#ffffff'],
      ['#settingsModal button[onclick="supabaseRegister()"]','#31495f','#f7fbff'],
      ['#settingsModal button[onclick="supabaseLogout()"]','#4b2934','#ffdce1']
    ].forEach(([selector,bg,fg])=>{
      const el=document.querySelector(selector);
      if(!el)return;
      if(dark){
        el.style.setProperty('background-color',bg,'important');
        el.style.setProperty('color',fg,'important');
      }else{
        el.style.removeProperty('background-color');
        el.style.removeProperty('color');
      }
    });
    document.querySelectorAll('[data-b3-theme]').forEach(el=>{el.value=theme});
  }
  function loadLayout(){
    try{
      const raw=JSON.parse(safeRead(LAYOUT_KEY)||'null');
      if(!Array.isArray(raw))return defaults();
      const byId=new Map(raw.map(x=>[x?.id,x]));
      return defaults().map((d,i)=>{
        const saved=byId.get(d.id)||{};
        const spec=definitions[i];
        return {id:d.id,visible:spec.locked?true:saved.visible!==false,size:['s','m','l'].includes(saved.size)?saved.size:d.size,order:Number.isInteger(saved.order)&&saved.order>=0&&saved.order<100? saved.order:i};
      }).sort((a,b)=>a.order-b.order).map((x,i)=>({...x,order:i}));
    }catch{return defaults()}
  }
  let layout=loadLayout(),draft=null;
  function renderLayout(data){
    data.forEach((x,i)=>{
      const el=document.querySelector('[data-b3-panel="'+x.id+'"]');
      if(!el)return;
      el.dataset.b3Size=x.size;
      el.dataset.b3Hidden=String(!x.visible);
      el.style.setProperty('--b3-order',String(i));
    });
  }
  function create(tag,attrs={},content=''){
    const e=document.createElement(tag);
    Object.entries(attrs).forEach(([k,v])=>{if(k==='class')e.className=v;else e.setAttribute(k,v)});
    if(content)e.textContent=content;
    return e;
  }
  function button(label,handler,secondary=false){
    const b=create('button',{type:'button',class:'b3-action'+(secondary?' b3-outline':'')},label);
    b.addEventListener('click',handler);
    return b;
  }
  function editorRender(host){
    host.replaceChildren(create('h2',{},'Dashboard bearbeiten'));
    host.append(create('p',{class:'text-sm'},'Bereiche sortieren, ein- oder ausblenden und die Größe S / M / L wählen. Änderungen gelten nur für dieses Tool.'));
    const list=create('div',{class:'b3-editor-list'});
    draft.forEach((entry,i)=>{
      const spec=definitions.find(d=>d.id===entry.id);
      const row=create('div',{class:'b3-editor-row'});
      row.append(create('strong',{},spec.name));
      const up=button('↑',()=>move(i,-1),true);up.disabled=i===0;up.setAttribute('aria-label',spec.name+' nach oben');
      const down=button('↓',()=>move(i,1),true);down.disabled=i===draft.length-1;down.setAttribute('aria-label',spec.name+' nach unten');
      row.append(up,down);
      const vis=create('label');
      const check=create('input',{type:'checkbox','aria-label':spec.name+' sichtbar'});
      check.checked=entry.visible;check.disabled=!!spec.locked;
      check.addEventListener('change',()=>{entry.visible=check.checked;renderLayout(draft)});
      vis.append(check,document.createTextNode('Sichtbar'));row.append(vis);
      const size=create('select',{'aria-label':'Größe: '+spec.name});
      for(const val of ['s','m','l']){
        const opt=create('option',{value:val},val.toUpperCase());size.append(opt);
      }
      size.value=entry.size;size.addEventListener('change',()=>{entry.size=size.value;renderLayout(draft)});
      row.append(size);list.append(row);
    });
    host.append(list);
    const actions=create('div',{class:'flex flex-wrap gap-2'});
    actions.append(button('Speichern',()=>{
      if(!safeWrite(LAYOUT_KEY,JSON.stringify(draft))){window.alert('Layout konnte nicht gespeichert werden. Bitte Browser-Speicher prüfen.');return}
      layout=clone(draft);closeEditor(host);
    }),button('Abbrechen',()=>{renderLayout(layout);closeEditor(host)},true),button('Standardlayout',()=>{
      draft=defaults();renderLayout(draft);editorRender(host);
    },true));
    host.append(actions);
  }
  function move(i,delta){
    const j=i+delta;if(j<0||j>=draft.length)return;
    [draft[i],draft[j]]=[draft[j],draft[i]];
    draft.forEach((x,k)=>x.order=k);
    renderLayout(draft);editorRender(document.getElementById('b3-editor'));
  }
  function closeEditor(host){
    draft=null;host.hidden=true;host.replaceChildren();
    const btn=document.getElementById('b3-edit-open');if(btn){btn.disabled=false}
  }
  function init(){
    document.body.classList.add('b3');
    applyTheme();
    const main=document.getElementById('main-content');if(!main)return;
    main.classList.add('b3-dashboard');
    const targets={
      stats:main.querySelector('[data-b3-panel="stats"]'),
      calendar:main.querySelector('[data-b3-panel="calendar"]'),
      create:main.querySelector('[data-b3-panel="create"]'),
      plants:main.querySelector('[data-b3-panel="plants"]'),
      recommendations:main.querySelector('[data-b3-panel="recommendations"]')
    };
    if(Object.values(targets).some(v=>!v)){console.warn('B3: Layout-Abschnitte unvollständig; Editor nicht gestartet');return}
    const shell=create('div',{class:'b3-shell'});
    const nav=create('nav',{class:'b3-nav','aria-label':'Pflanzenpflege Navigation'});
    const links=[
      ['🌱','Übersicht','#main-content'],
      ['📊','Statistiken','#b3-stats'],
      ['📅','Gießplan','#b3-calendar'],
      ['➕','Pflanze erfassen','#b3-create'],
      ['🪴','Meine Pflanzen','#b3-plants']
    ];
    const navLinks=create('div',{class:'b3-nav-links'});
    links.forEach(([icon,label,href])=>{
      const a=create('a',{href},icon+' '+label);
      navLinks.append(a);
    });
    nav.append(navLinks);
    const more=create('details',{class:'b3-more'});
    const moreTitle=create('summary',{},'☷ Weitere Tools');
    more.append(moreTitle);
    const moreContent=create('div',{class:'b3-more-content'});
    [
      ['💰 Garten-ROI','openRoiModal()'],
      ['🌧️ Zisterne','openCisternModal()'],
      ['🌰 Saatgut','openSeedsModal()'],
      ['📦 Lager & Nachbestellen','openInventoryModal()'],
      ['🌿 Beet','openBeetModal()'],
      ['📄 PDF exportieren','exportPDF()']
    ].forEach(([label,handler])=>{
      const b=create('button',{type:'button',class:'b3-more-item'},label);
      // Preserve calls to existing tool actions; do not modify their implementations.
      b.addEventListener('click',()=>{
        const fn=window[handler.slice(0,-2)];
        more.open=false;
        if(typeof fn==='function')fn();
      });
      moreContent.append(b);
    });
    more.append(moreContent);
    nav.append(more);
    main.parentNode.insertBefore(shell,main);
    shell.append(nav,main);
    // The settings dialog is the single entry point for personalization and account.
    const modal=document.getElementById('settingsModal');
    const modalSurface=modal?.firstElementChild;
    const prefs=create('section',{class:'b3-preferences','aria-label':'Darstellung und Dashboard'});
    prefs.append(create('h4',{},'Darstellung & Dashboard'));
    const label=create('label',{},'Designmodus');
    const select=create('select',{'aria-label':'Globaler Designmodus','data-b3-theme':'true',class:'b3-theme-select'});
    [['auto','Automatisch'],['light','Hell'],['dark','Dunkel']].forEach(([value,name])=>
      select.append(create('option',{value},name))
    );
    select.value=theme;
    select.addEventListener('change',()=>{
      theme=select.value;
      if(!safeWrite(THEME_KEY,theme))window.alert('Designmodus konnte nicht gespeichert werden');
      applyTheme();
    });
    label.append(select);
    prefs.append(label);
    const edit=button('✎ Dashboard bearbeiten',()=>{
      if(!draft)draft=clone(layout);
      const host=document.getElementById('b3-editor');
      host.hidden=false;
      edit.disabled=true;
      editorRender(host);
      renderLayout(draft);
      modal?.classList.add('hidden');
      host.scrollIntoView({block:'start',behavior:'smooth'});
    },true);
    edit.id='b3-edit-open';
    prefs.append(edit);
    const help=button('❔ Hilfe & Anleitung',()=>{
      modal?.classList.add('hidden');
      if(typeof window.toggleHelpModal==='function')window.toggleHelpModal();
    },true);
    prefs.append(help);
    // Independent footer: Ko-fi first, then the discovery link as the last item.
    const footer=create('div',{class:'b3-settings-footer'});
    const support=create('a',{
      href:'https://ko-fi.com/duhrrom',
      target:'_blank',
      rel:'noopener noreferrer',
      class:'b3-kofi-link',
      'aria-label':'Auf Ko-fi einen Kaffee spendieren'
    },'☕ Kaffee spendieren');
    footer.append(support);
    const home=create('a',{
      href:'../../index.html',
      class:'b3-home-link'
    },'↗ Entdecke mehr Toolya');
    footer.append(home);
    prefs.append(footer);
    // Place preferences after account status; retain auth UI and all original IDs.
    if(modalSurface)modalSurface.append(prefs);
    const editor=create('section',{id:'b3-editor',class:'b3-editor','aria-label':'Dashboard bearbeiten'});editor.hidden=true;
    main.prepend(editor);
    renderLayout(layout);
    // Only one tool-navigation row under the header, including on phones.
    // Remove the former duplicate mobile bottom bar.
    media.addEventListener?.('change',applyTheme);
    window.addEventListener('storage',e=>{
      if(e.key===THEME_KEY){theme=['light','dark','auto'].includes(e.newValue)?e.newValue:'auto';applyTheme()}
      if(e.key===LAYOUT_KEY&&!draft){layout=loadLayout();renderLayout(layout)}
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
