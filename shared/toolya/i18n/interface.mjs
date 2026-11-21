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

/* Source-exact UI copy for existing static form controls. Text nodes are translated
   only on leaf controls, never on nested form elements or user content. */
const formCopy = Object.freeze({
 moving: {
  '📍 Standort anlegen':'📍 Add location','Standort Name':'Location name',
  'Standort speichern':'Save location','📦 Kiste hinzufügen':'📦 Add box',
  'Kisten-Name':'Box name','Wert in € (optional)':'Value in € (optional)',
  'Inhalt / Beschreibung':'Contents / description','Barcode / EAN (optional)':'Barcode / EAN (optional)',
  'Garantie- oder Ablaufdatum':'Warranty or expiry date','Foto der Kiste auswählen':'Choose box photo',
  'Kiste speichern & QR-Code':'Save box and QR code','🗄️ Kisten und Inhalte finden':'🗄️ Find boxes and contents',
  'Kiste & Artikel bearbeiten':'Edit box and items','Standort (Verschieben):':'Location (move):',
  'Kisten-Name:':'Box name:','Tag (Kategorie):':'Tag (category):',
  'Beschreibung / Inhalt:':'Description / contents:','Ausgeliehen an (leer = im Regal):':'Lent to (blank = in storage):',
  '🔎 Unterartikel in dieser Kiste:':'🔎 Items in this box:','+ Hinzufügen':'+ Add',
  'Abbrechen':'Cancel','Speichern':'Save','Schließen':'Close','Scanner schließen':'Close scanner',
  '⚙️ Einstellungen & Konto':'⚙️ Settings and account','☁️ Konto':'☁️ Account',
  'E-Mail':'Email','Passwort':'Password','💾 Daten sichern und wiederherstellen':'💾 Back up and restore data',
  '📤 Wiederherstellen':'📤 Restore','📖 Hilfe & Anleitung anzeigen':'📖 View help and guide'
 },
 housemates: {
  '📌 Digitale WG-Pinnwand & Sticky Notes':'📌 Shared noticeboard and sticky notes',
  '✏️ Neue Sticky Note':'✏️ New sticky note','ℹ️ WG-Stammdaten':'ℹ️ Household details',
  '📊 Visuelle Finanz-Analyse':'📊 Financial analysis',
  '🎯 Monats-Budgets & Limits':'🎯 Monthly budgets and limits',
  '🐷 Sparschwein & Sparziele':'🐷 Savings goals','+ Neues Sparziel':'+ New savings goal',
  '✍️ Buchung / WG-Kassenbon erfassen':'✍️ Add transaction / receipt',
  '✕ Abbrechen':'✕ Cancel','🔻 Ausgabe':'🔻 Expense','🔺 Einnahme':'🔺 Income',
  'Händler / Partner / Quelle (optional):':'Merchant / partner / source (optional):',
  'Bezahlt von:':'Paid by:','Garantie (Monate):':'Warranty (months):',
  'Rückgabe (Tage):':'Return period (days):','Nutzung (Jahre):':'Useful life (years):',
  'Seriennummer / S/N (optional):':'Serial number (optional):',
  '🔄 Wiederkehrende Fixkosten':'🔄 Recurring fixed costs',
  '💼 Steuerrelevant':'💼 Tax relevant',
  '👥 WG-Aufteilung (Wer beteiligt sich?):':'👥 Split among housemates (who participates?):',
  '📷 Belegfoto & OCR Scanner':'📷 Receipt photo and text scanner',
  '🔍 Texterkennung':'🔍 Extract text','Belegfoto auswählen':'Choose receipt photo',
  '📋 Transaktionen & Kassenbons':'📋 Transactions and receipts',
  '📦 WG-Inventar & Auszugs-Restwert-Rechner':'📦 Shared inventory and remaining value',
  '+ Gegenstand erfassen':'+ Add item','📅 WG-Kalender & Slots':'📅 Shared calendar and slots',
  '+ Slot / Termin':'+ Slot / event','🧹 Rotierender Putzplan':'🧹 Rotating cleaning schedule',
  '+ Aufgabe':'+ Task','🛒 WG-Einkaufsliste':'🛒 Shared shopping list',
  'Hinzufügen':'Add','🍲 Wochenkochplaner':'🍲 Weekly meal planner',
  '✏️ Bearbeiten':'✏️ Edit','Abbrechen':'Cancel','Speichern':'Save',
  'Erfassen':'Add','Anlegen':'Create','Erstellen':'Create',
  '📅 Termin / Slot buchen':'📅 Book event / slot',
  'Titel / Bezeichnung *:':'Title / description *:','Datum *:':'Date *:',
  'Startzeit (opt.):':'Start time (optional):','Endzeit (opt.):':'End time (optional):',
  'Gebucht von / Wer:':'Booked by:','Mitglied speichern':'Save member',
  'Fertig & Schließen':'Done and close','📶 WLAN-Passwort:':'📶 Wi-Fi password:'
 },
 plants: {
  '📅 Garten-Saisonkalender (Monatstipp)':'📅 Seasonal garden calendar (monthly tip)',
  '🌿 Neue Pflanze / Aussaat erfassen':'🌿 Add plant / sowing',
  'Name':'Name','Art / Sorte':'Species / variety','Standort / Beet':'Location / bed',
  'Lichtbedarf & Solar-Stufen:':'Light requirements:',
  'Topf-Größe (Ø):':'Pot size (diameter):',
  'Gieß-Tage (Intervall):':'Watering interval (days):','Letztes Gießen:':'Last watered:',
  'Vermehrung / Status:':'Propagation / status:','Stecklings- / Kultur-Datum:':'Cutting / propagation date:',
  'Pflanzenfoto (Initial):':'Initial plant photo:','Pflanze speichern':'Save plant',
  '📋 Meine Pflanzen & Vermehrung':'📋 My plants and propagation',
  '📦 Garten-Lager & Amazon Nachbestellung':'📦 Garden inventory and reordering',
  'Artikel':'Item','Menge':'Quantity','Artikel ins Lager aufnehmen':'Add item to inventory',
  '🌰 Saatgut-Lager':'🌰 Seed inventory','Sorte':'Variety','Erntejahr':'Harvest year',
  'Hinzufügen':'Add','💰 Garten-ROI-Rechner':'💰 Garden ROI calculator',
  'Gesamtausgaben (€):':'Total expenses (€):','Marktwert pro kg (€):':'Market value per kg (€):',
  '🌧️ Zisternen-Manager':'🌧️ Rainwater tank manager',
  'Fassungsvermögen (Liter):':'Capacity (litres):',
  '💧 Tonne auffüllen':'💧 Fill tank','🌿 Beet-Planer':'🌿 Bed planner',
  '🍅 Ernte erfassen':'🍅 Record harvest','Abbrechen':'Cancel','Speichern':'Save',
  '📸 Wachstums-Verlauf':'📸 Growth history','Foto hinzufügen':'Add photo',
  'Pflanzen-Steckbrief':'Plant profile','📖 Tagebucheintrag':'📖 Journal entry',
  'Pflanze bearbeiten':'Edit plant','Name:':'Name:','Art:':'Species:',
  'Standort:':'Location:','Gieß-Tage:':'Watering interval:','Anmerkungen:':'Notes:',
  '💧 Gießen':'💧 Water','Ausblenden':'Dismiss','Achtung: Frostgefahr!':'Warning: frost risk!'
 },
 baking: {
  '1. Backformen wählen':'1. Choose pans','Form im Rezept':'Original recipe pan',
  'Rund (Springform)':'Round (springform)','Kastenform / Eckig':'Loaf / rectangular',
  'Gugelhupf':'Bundt','Deine neue Form':'Your new pan',
  'Eine Form':'One pan','Zwei Formen':'Two pans',
  '2. Deine Zutaten':'2. Your ingredients','Metrisch (g / ml)':'Metric (g / ml)',
  'Mein Rezept':'My recipe','Meine Zutaten':'My ingredients',
  'Mengen ausrechnen':'Calculate quantities',
  '3. Backzeit & Ofen':'3. Baking time and oven',
  'Ober-/Unterhitze':'Conventional heat','Heißluft / Umluft (-20°C)':'Fan oven (-20°C)',
  'Material deiner Form':'Pan material','Silikon':'Silicone',
  'Metall / Blech':'Metal','Glas / Keramik':'Glass / ceramic',
  'Teigmenge nicht ändern':'Keep batter quantity unchanged',
  'Torte teilen':'Divide cake','Glasur und Fondant':'Icing and fondant',
  'Schoko':'Chocolate','Guss':'Glaze','Mit Rand':'With border',
  '← Zurück zum Backform-Rechner':'← Back to cake pan calculator',
  'Passende Formen finden':'Find matching pans','Zutaten ersetzen':'Ingredient substitutions',
  'Butter fehlt':'No butter','Eier fehlen (pro Ei)':'No eggs (per egg)',
  'Backpulver fehlt':'No baking powder','Buttermilch fehlt':'No buttermilk',
  'Zucker & Süßungsmittel umrechnen':'Sugar and sweetener conversion',
  'Alternative':'Alternative','Benötigte Menge':'Required quantity',
  'Zutatenkosten berechnen':'Calculate ingredient costs',
  'Back-Checkliste („Mise en place“)':'Baking checklist (mise en place)',
  'Aktuelle Raumtemperatur (°C)':'Current room temperature (°C)',
  'Meine gespeicherten Rezepte':'My saved recipes',
  'Umgerechnet & Analyse':'Converted quantities and analysis',
  'Zutaten & Einkaufsliste':'Ingredients and shopping list',
  'Drucken':'Print','Kochmodus & Multi-Timer starten':'Start cooking mode and multi-timer',
  'Einstellungen & Cloud-Konto':'Settings and cloud account',
  'Mein Ofenfaktor':'My oven factor','Speichern':'Save','Schließen':'Close',
  'Start':'Start','Pause':'Pause','Nächste Phase':'Next phase','Löschen':'Delete'
 }
});
function applyStaticFormCopy(document,tool,language){
 const dictionary=formCopy[tool];
 if(!dictionary)return;
 for(const element of document.querySelectorAll('label,button,option,h2,h3,h4')){
  if(element.children.length || element.closest('[contenteditable="true"]'))continue;
  let record=originals.get(element);
  const original=record?.get('text') ?? element.textContent;
  const translated=dictionary[original.trim()];
  if(translated!==undefined)updateElement(element,translated,null,language);
 }
}

export function applyToolInterfaceLocale(document,tool,language){
 for(const [selector,translation,attribute,attributeTranslation] of [...common,...(toolTranslations[tool]||[])]){
  const translated=attribute?attributeTranslation:translation;
  for(const element of document.querySelectorAll(selector)){
   updateElement(element,translated,attribute,language);
  }
 }
 applyStaticFormCopy(document,tool,language);
}
