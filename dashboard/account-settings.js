/* Dashboard account controls use the same Supabase project and browser session as the homepage.
   This module does not modify dashboard records or write to application tables. */
(()=>{
'use strict';
const URL='https://yheogmeaosuigyaxkwth.supabase.co';
const KEY='sb_publishable_PK20oOPzG3AB-bd95Ji9Tg_C-MIUgyv';
const $=id=>document.getElementById(id);
const client=window.supabase?.createClient(URL,KEY);
let authRequest=0,recoveryActive=false,lastFocus=null;
const message=text=>{$('loginMessage').textContent=text};
function renderUser(user,error){
 const button=$('userInfo');
 button.classList.toggle('b3-auth-signed-in',!!user);
 button.classList.toggle('b3-auth-signed-out',!user);
 button.textContent=user?'Angemeldet':'Anmelden';
 button.setAttribute('aria-label',user?'Angemeldet – Kontoeinstellungen öffnen':'Anmelden oder registrieren');
 $('cloudStatus').textContent=user?'✅ Angemeldet':error?'Anmeldestatus gerade nicht verfügbar':'Nicht angemeldet';
}
async function refresh(token){
 const request=++authRequest;
 if(!client){renderUser(null,true);return}
 try{
  const {data,error}=await client.auth.getUser(token);
  if(request!==authRequest)return;
  renderUser(error?null:data?.user,error&&error.name!=='AuthSessionMissingError');
 }catch{if(request===authRequest)renderUser(null,true)}
}
function openSettings(){
 const dialog=$('settingsModal');
 if(dialog.open)return;
 lastFocus=document.activeElement;
 dialog.showModal();
 document.body.classList.add('dashboard-modal-open');
 ($('userInfo').classList.contains('b3-auth-signed-in')?$('cloudStatus'):$('loginEmail')).focus();
}
function closeSettings(){
 $('settingsModal').close();
}
$('settingsModal').addEventListener('close',()=>{
 if($('settingsModal').open)return;
 document.body.classList.remove('dashboard-modal-open');
 (lastFocus?.isConnected?lastFocus:$('settingsBtn')).focus();
});
window.openSettings=openSettings;
window.closeSettings=closeSettings;
function credentials(){
 const email=$('loginEmail').value.trim().toLowerCase(),password=$('loginPassword').value;
 if(!email||!$('loginEmail').checkValidity()){message('Bitte eine gültige E-Mail-Adresse eingeben.');$('loginEmail').focus();return null}
 if(password.length<6){message('Das Passwort muss mindestens 6 Zeichen lang sein.');$('loginPassword').focus();return null}
 return {email,password};
}
async function login(){
 const values=credentials();if(!values||!client)return;
 const button=$('loginSubmit');if(button.disabled)return;
 button.disabled=true;button.textContent='Wird angemeldet …';message('Anmeldung wird geprüft …');
 try{
  const {data,error}=await client.auth.signInWithPassword(values);
  if(error)throw error;
  if(!data?.user||!data?.session?.access_token)throw Error('Keine bestätigte Anmeldung erhalten.');
  ++authRequest;renderUser(data.user);message('Erfolgreich angemeldet.');closeSettings();
 }catch(error){message(error?.message||'Anmeldung momentan nicht erreichbar.')}
 finally{$('loginPassword').value='';button.disabled=false;button.textContent='🔑 Anmelden'}
}
async function register(){
 const values=credentials();if(!values||!client)return;
 try{
  const {data,error}=await client.auth.signUp(values);
  if(error)throw error;
  message(data?.session?'Registrierung erfolgreich.':'Registrierung eingereicht. Bitte prüfe deine E-Mails zur Bestätigung.');
  await refresh(data?.session?.access_token);
 }catch(error){message(error?.message||'Registrierung momentan nicht erreichbar.')}
 finally{$('loginPassword').value=''}
}
async function logout(){
 if(!client)return;
 try{const {error}=await client.auth.signOut();if(error)throw error;++authRequest;renderUser(null);$('loginPassword').value='';message('Abgemeldet.')}
 catch(error){message('Abmeldung fehlgeschlagen: '+(error?.message||'Bitte erneut versuchen.'))}
}
async function reset(){
 const input=$('loginEmail'),email=input.value.trim().toLowerCase();
 if(!email||!input.checkValidity()){message('Bitte zuerst eine gültige E-Mail-Adresse eingeben.');input.focus();return}
 try{
  const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:'https://toolya.app/index.html'});
  if(error)throw error;
  message('Falls ein Konto für diese E-Mail-Adresse existiert, erhältst du einen Link zum Zurücksetzen des Passworts.');
 }catch{message('Die Anfrage konnte gerade nicht verarbeitet werden. Bitte versuche es später erneut.')}
}
function showRecovery(){recoveryActive=true;$('passwordRecoveryPanel').hidden=false;openSettings();$('recoveryPassword').focus()}
async function saveRecovery(){
 if(!recoveryActive){message('Bitte öffne zuerst den Link aus deiner Passwort-E-Mail.');return}
 const a=$('recoveryPassword'),b=$('recoveryPasswordConfirm');
 if(a.value.length<8||a.value!==b.value){message('Bitte zwei identische Passwörter mit mindestens 8 Zeichen eingeben.');return}
 try{
  const {error}=await client.auth.updateUser({password:a.value});if(error)throw error;
  a.value='';b.value='';recoveryActive=false;$('passwordRecoveryPanel').hidden=true;
  await client.auth.signOut();++authRequest;renderUser(null);message('Passwort geändert. Bitte erneut anmelden.');
 }catch{message('Passwort konnte nicht geändert werden. Bitte fordere einen neuen Link an.')}
}
$('settingsBtn').addEventListener('click',openSettings);
$('userInfo').addEventListener('click',openSettings);
$('closeSettingsBtn').addEventListener('click',closeSettings);
$('cancelSettingsBtn').addEventListener('click',closeSettings);
$('settingsModal').addEventListener('click',e=>{if(e.target===$('settingsModal'))closeSettings()});
$('loginSubmit').addEventListener('click',login);
$('registerUser').addEventListener('click',register);
$('logoutUser').addEventListener('click',logout);
$('forgotPassword').addEventListener('click',reset);
$('saveRecovery').addEventListener('click',saveRecovery);
if(new URLSearchParams(location.search).has('auth')||new URLSearchParams(location.search).has('settings')){
 openSettings();history.replaceState(null,'',location.pathname+location.hash);
}
if(client){
 client.auth.onAuthStateChange((event,session)=>{
  if(event==='PASSWORD_RECOVERY')showRecovery();
  if(!session){++authRequest;renderUser(null);return}
  setTimeout(()=>refresh(session.access_token),0);
 });
 refresh();
}else{renderUser(null,true);message('Anmeldung momentan nicht verfügbar.')}
})();