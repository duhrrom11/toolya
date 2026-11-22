/* Toolya i18next foundation: only explicitly marked UI is translated. */
(function () {
'use strict';
const supported = ['de','en','fr','lb','es','it'];
const names = {de:'Deutsch',en:'English',fr:'Français',lb:'Lëtzebuergesch',es:'Español',it:'Italiano'};
const resources = {"de":{"translation":{"headline":"Kostenlose Online-Tools","headlineSuffix":"für den Alltag","intro":"Praktische, kostenlose Online-Tools für Finanzen, Zuhause, Organisation und unterwegs.","dashboard":"Mein Dashboard","dashboardDescription":"Dein persönlicher Bereich: Lieblings-Tools, Aufgaben und Erinnerungen an einem Ort.","discover":"Tools entdecken","settings":"Einstellungen","language":"Sprache","skip":"Direkt zum Inhalt springen"}},"en":{"translation":{"headline":"Free online tools","headlineSuffix":"for everyday life","intro":"Practical, free online tools for finances, home, organization and on the go.","dashboard":"My dashboard","dashboardDescription":"Your personal space: favorite tools, tasks and reminders in one place.","discover":"Discover tools","settings":"Settings","language":"Language","skip":"Skip to content"}},"fr":{"translation":{"headline":"Outils en ligne gratuits","headlineSuffix":"pour le quotidien","intro":"Des outils en ligne pratiques et gratuits pour les finances, la maison, l'organisation et les déplacements.","dashboard":"Mon tableau de bord","dashboardDescription":"Votre espace personnel : outils favoris, tâches et rappels au même endroit.","discover":"Découvrir les outils","settings":"Paramètres","language":"Langue","skip":"Aller au contenu"}},"lb":{"translation":{"headline":"Gratis Online-Tools","headlineSuffix":"fir den Alldag","intro":"Praktesch, gratis Online-Tools fir Finanzen, Doheem, Organisatioun an ënnerwee.","dashboard":"Mäin Dashboard","dashboardDescription":"Däi perséinleche Beräich: Liiblings-Tools, Aufgaben an Erënnerungen op enger Plaz.","discover":"Tools entdecken","settings":"Astellungen","language":"Sprooch","skip":"Direkt bei den Inhalt"}},"es":{"translation":{"headline":"Herramientas online gratuitas","headlineSuffix":"para el día a día","intro":"Herramientas online prácticas y gratuitas para las finanzas, el hogar, la organización y los desplazamientos.","dashboard":"Mi panel","dashboardDescription":"Tu espacio personal: herramientas favoritas, tareas y recordatorios en un solo lugar.","discover":"Descubrir herramientas","settings":"Configuración","language":"Idioma","skip":"Ir al contenido"}},"it":{"translation":{"headline":"Strumenti online gratuiti","headlineSuffix":"per tutti i giorni","intro":"Strumenti online pratici e gratuiti per finanze, casa, organizzazione e spostamenti.","dashboard":"La mia dashboard","dashboardDescription":"Il tuo spazio personale: strumenti preferiti, attività e promemoria in un unico posto.","discover":"Scopri gli strumenti","settings":"Impostazioni","language":"Lingua","skip":"Vai al contenuto"}}};
function preferred() {
 let stored; try {stored=localStorage.getItem('toolya_language');}catch(_){}
 if(stored && supported.includes(stored)) return stored;
 const browser=(navigator.languages&&navigator.languages[0])||navigator.language||'de';
 const code=browser.toLowerCase().split('-')[0];return supported.includes(code)?code:'de';
}
function apply(){
 const lang=window.i18next.language;
 document.documentElement.lang=lang;
 document.querySelectorAll('[data-i18n]').forEach(el=>{el.textContent=window.i18next.t(el.dataset.i18n);});
 document.querySelectorAll('[data-i18n-aria-label]').forEach(el=>{el.setAttribute('aria-label',window.i18next.t(el.dataset.i18nAriaLabel));});
 const picker=document.getElementById('toolya-language');if(picker)picker.value=lang;
}
function start(){
 if(!window.i18next){return;}
 window.i18next.init({lng:preferred(),fallbackLng:'de',supportedLngs:supported,resources,initImmediate:false,interpolation:{escapeValue:true}});
 const nav=document.querySelector('.b3-hub-nav');
 if(nav && !document.getElementById('toolya-language')){
 const label=document.createElement('label');label.className='toolya-language-label';label.htmlFor='toolya-language';label.setAttribute('aria-label','Sprache / Language');
 const select=document.createElement('select');select.id='toolya-language';select.className='toolya-language-select';select.setAttribute('aria-label','Sprache / Language');
 supported.forEach(lang=>{const opt=document.createElement('option');opt.value=lang;opt.textContent=names[lang];select.appendChild(opt);});
 select.addEventListener('change',()=>{const lang=select.value;try{localStorage.setItem('toolya_language',lang);}catch(_){}window.i18next.changeLanguage(lang).then(apply);});
 label.appendChild(select);nav.insertBefore(label,nav.firstChild);
 }
 apply();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
