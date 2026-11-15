// Toolya page access gate: verified account required, no loading overlay or data writes.
(()=>{
 const home='../../index.html?auth=required';
 const reject=()=>window.location.replace(home);
 if(!window.supabase?.createClient){reject();return;}
 const client=window.supabase.createClient('https://yheogmeaosuigyaxkwth.supabase.co','sb_publishable_PK20oOPzG3AB-bd95Ji9Tg_C-MIUgyv');
 let finished=false;
 const timeout=setTimeout(()=>{if(!finished){finished=true;reject();}},8000);
 client.auth.getUser().then(({data,error})=>{
  if(finished)return;
  finished=true;clearTimeout(timeout);
  if(error||!data?.user?.id||data.user.is_anonymous){reject();return;}
  document.documentElement.classList.remove('toolya-auth-pending');
  window.dispatchEvent(new Event('toolya-auth-verified'));
 }).catch(()=>{if(!finished){finished=true;clearTimeout(timeout);reject();}});
 client.auth.onAuthStateChange((event)=>{
  if(event==='SIGNED_OUT'){
   document.documentElement.classList.add('toolya-auth-pending');
   reject();
  }
 });
})();
