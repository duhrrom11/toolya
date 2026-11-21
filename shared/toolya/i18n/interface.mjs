/* Explicit, reversible UI translations. No access to auth/data stores or mascot settings. */
const common = [
 ['.toolya-auth-loading','Checking your sign-in…'],
 ['.toolya-auth-error:not(button)','We could not verify your sign-in. Check your internet connection and try again.'],
 ['#toolya-auth-retry','Try again'],
 ['.toolya-auth-status > a','View the guide'],
 ['a[href="#main-content"]','Skip to main content'],
 ['.b3-settings-trigger','', 'aria-label','Open settings'],
 ['.b3-settings-trigger','', 'title','Settings'],
 ['.b3-brand','', 'aria-label','Toolya home'],
 ['#settingsModal label[for="auth-email"]','Email address'],
 ['#settingsModal label[for="auth-password"]','Password'],
 ['#settingsModal [onclick="supabaseLogin()"]','Sign in'],
 ['#settingsModal [onclick="supabaseRegister()"]','Register'],
 ['#settingsModal [onclick="supabaseLogout()"]','Sign out'],
 ['#settingsModal button[onclick="toggleSettingsModal()"].w-full','Close']
];
const toolTranslations = {
 moving: [
  ['button[onclick="saveLocation()"]','Save location'],
  ['button[onclick="saveBox()"]','Save box and QR code'],
  ['button[onclick="registerUser()"]','👤 Register'],
  ['button[onclick="loginUser()"]','🔑 Sign in'],
  ['button[onclick="logoutUser()"]','🚪 Sign out'],
  ['button[onclick="exportBackup()"]','📥 Back up'],
  ['button[onclick="closeEditBoxModal()"]','Cancel'],
  ['button[onclick="updateBox()"]','Save'],
  ['label[for="editBoxName"]','Box name:'],
  ['label[for="editBoxDesc"]','Description / contents:'],
  ['label[for="locIcon"] .helferlein-field-label','Location icon'],
  ['label[for="locName"] .helferlein-field-label','Location name'],
  ['#locName','','placeholder','Location name'],
  ['#locName','','aria-label','Location name']
 ],
 housemates: [
  ['#settingsModal h3','⚙️ Settings and account'],
  ['label[for="receiptTitle"]','Title / item *:'],
  ['label[for="receiptDate"]','Purchase date *:'],
  ['label[for="receiptPrice"]','Amount (€) *:'],
  ['label[for="receiptCategory"]','Category:'],
  ['button[onclick="saveReceipt()"]','Save transaction / receipt']
 ],
 plants: [
  ['#settingsModal h3','⚙️ Settings and account'],
  ['label[for="plantLight"]','Light requirements:'],
  ['label[for="plantPotSize"]','Pot size (Ø):'],
  ['label[for="plantInterval"]','Watering interval (days):'],
  ['label[for="plantLastWatered"]','Last watered:'],
  ['label[for="plantPhotoInput"]','Plant photo:'],
  ['button[onclick="savePlant()"]','Save plant']
 ],
 baking: [
  ['#btn-tab-rechner','🧮 Cake pan calculator'],
  ['#btn-tab-rezepte','📚 My recipes'],
  ['#btn-tab-substanz','🥄 Baking helpers'],
  ['#btn-tab-tools','💶 Costs and planning'],
  ['label[for="orig-shape"]','Which pan?'],
  ['label[for="orig-d"]','Diameter (cm)'],
  ['label[for="orig-l"]','Length (cm)'],
  ['label[for="orig-w"]','Width (cm)'],
  ['label[for="combinator-mode"]','How many pans?'],
  ['label[for="target-shape"]','Type'],
  ['label[for="target-l"]','Length (cm)'],
  ['label[for="target-w"]','Width (cm)'],
  ['label[for="unit-system"]','Units:'],
  ['label[for="base-time"]','Recipe baking time (min)'],
  ['label[for="base-temp"]','Recipe temperature (°C)'],
  ['label[for="oven-mode"]','Oven mode'],
  ['label[for="slice-count"]','Desired portions'],
  ['button[onclick="supabaseLogin()"]','Sign in'],
  ['button[onclick="supabaseRegister()"]','Register'],
  ['button[onclick="supabaseLogout()"]','Sign out']
 ]
};
const originals = new WeakMap();
function updateElement(element, translation, attribute, language) {
 let record=originals.get(element);
 if(!record){record=new Map();originals.set(element,record);}
 const key=attribute || 'text';
 if(!record.has(key))record.set(key,attribute?element.getAttribute(attribute):element.textContent);
 const original=record.get(key);
 if(attribute){
  if(language==='en')element.setAttribute(attribute,translation);
  else if(original===null)element.removeAttribute(attribute);
  else element.setAttribute(attribute,original);
 }else element.textContent=language==='en'?translation:original;
}
export function applyToolInterfaceLocale(document,tool,language){
 for(const [selector,translation,attribute,attributeTranslation] of [...common,...(toolTranslations[tool]||[])]){
  const translated=attribute?attributeTranslation:translation;
  for(const element of document.querySelectorAll(selector)){
   updateElement(element,translated,attribute,language);
  }
 }
}
