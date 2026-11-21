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
/* Additional explicitly selected static form fields; never translate stored values or event handlers. */
const extendedFormTranslations = {
 "moving": [
  [
   "#loginEmail",
   "",
   "placeholder",
   "Email"
  ],
  [
   "#loginPassword",
   "",
   "placeholder",
   "Password"
  ],
  [
   "#boxName",
   "",
   "placeholder",
   "Box name (e.g. Box #3)"
  ],
  [
   "#boxName",
   "",
   "aria-label",
   "Box name"
  ],
  [
   "#boxValue",
   "",
   "placeholder",
   "Value in € (optional)"
  ],
  [
   "#boxDesc",
   "",
   "placeholder",
   "Contents / description"
  ],
  [
   "#boxBarcode",
   "",
   "placeholder",
   "Barcode / EAN (optional)"
  ],
  [
   "#boxExpiry",
   "",
   "aria-label",
   "Warranty or expiry date"
  ],
  [
   "#boxLocationSelect",
   "",
   "aria-label",
   "Box location"
  ],
  [
   "#boxTag",
   "",
   "aria-label",
   "Box label"
  ],
  [
   "#searchBox",
   "",
   "placeholder",
   "Search boxes, items or barcodes…"
  ],
  [
   "#searchBox",
   "",
   "aria-label",
   "Search boxes, items or barcodes"
  ],
  [
   "#newSubItemName",
   "",
   "placeholder",
   "Item name"
  ],
  [
   "#newSubItemVal",
   "",
   "placeholder",
   "Value €"
  ],
  [
   "#editBoxLentTo",
   "",
   "placeholder",
   "e.g. Alex"
  ],
  [
   "label[for='editBoxValue']",
   "Value (€):"
  ],
  [
   "label[for='editBoxLentTo']",
   "Lent to (blank = stored):"
  ],
  [
   "button[onclick='closeScannerModal()']",
   "Close scanner"
  ]
 ],
 "housemates": [
  [
   "#auth-email",
   "",
   "placeholder",
   "name@example.com"
  ],
  [
   "#receiptTitle",
   "",
   "placeholder",
   "e.g. detergent, rent, salary"
  ],
  [
   "#receiptStore",
   "",
   "placeholder",
   "e.g. shop, employer"
  ],
  [
   "#receiptPhotoInput",
   "",
   "aria-label",
   "Select receipt photo"
  ],
  [
   "label[for='receiptStore']",
   "Merchant / partner / source (optional):"
  ],
  [
   "label[for='receiptPaymentPayer']",
   "Paid by:"
  ],
  [
   "label[for='receiptWarranty']",
   "Warranty (months):"
  ],
  [
   "label[for='receiptReturnDays']",
   "Returns (days):"
  ],
  [
   "label[for='receiptLifespan']",
   "Useful life (years):"
  ],
  [
   "label[for='receiptSN']",
   "Serial number (optional):"
  ],
  [
   "#receiptLocation",
   "",
   "placeholder",
   "e.g. basement shelf 2"
  ],
  [
   "#filterType",
   "",
   "aria-label",
   "Filter transactions by type"
  ],
  [
   "#filterCategory",
   "",
   "aria-label",
   "Filter by category"
  ],
  [
   "#newShoppingItem",
   "",
   "placeholder",
   "e.g. oat milk, dish soap"
  ],
  [
   "#newShoppingItem",
   "",
   "aria-label",
   "e.g. oat milk, dish soap"
  ],
  [
   "button[onclick='addShoppingItem()']",
   "Add"
  ],
  [
   "#noteTitleInput",
   "",
   "placeholder",
   "e.g. parcel in the hallway"
  ],
  [
   "#noteContentInput",
   "",
   "placeholder",
   "Write a household note…"
  ],
  [
   "#eventTitle",
   "",
   "placeholder",
   "e.g. laundry, visitor"
  ],
  [
   "label[for='eventTitle']",
   "Title / description *:"
  ],
  [
   "label[for='eventDate']",
   "Date *:"
  ],
  [
   "label[for='eventTimeStart']",
   "Start time (optional):"
  ],
  [
   "label[for='eventTimeEnd']",
   "End time (optional):"
  ]
 ],
 "plants": [
  [
   "#auth-email",
   "",
   "placeholder",
   "name@example.com"
  ],
  [
   "#plantName",
   "",
   "placeholder",
   "Name (e.g. tomato)"
  ],
  [
   "#plantName",
   "",
   "aria-label",
   "Plant name"
  ],
  [
   "#plantSpecies",
   "",
   "placeholder",
   "Species / variety"
  ],
  [
   "#plantSpecies",
   "",
   "aria-label",
   "Species / variety"
  ],
  [
   "#plantLocation",
   "",
   "placeholder",
   "Location / bed"
  ],
  [
   "#plantLocation",
   "",
   "aria-label",
   "Location / bed"
  ],
  [
   "#plantNote",
   "",
   "placeholder",
   "Care notes…"
  ],
  [
   "#plantNote",
   "",
   "aria-label",
   "Care notes"
  ],
  [
   "label[for='plantPropagation']",
   "Propagation / status:"
  ],
  [
   "label[for='plantPropDate']",
   "Propagation date:"
  ],
  [
   "#filterLocation",
   "",
   "aria-label",
   "Filter plants by location"
  ],
  [
   "#invItemName",
   "",
   "placeholder",
   "Item (e.g. fertilizer)"
  ],
  [
   "#invItemQty",
   "",
   "placeholder",
   "Quantity (e.g. 2 L)"
  ],
  [
   "#seedName",
   "",
   "placeholder",
   "Variety"
  ],
  [
   "#seedYear",
   "",
   "placeholder",
   "Harvest year"
  ],
  [
   "#harvestWeightGrams",
   "",
   "placeholder",
   "Grams (g)"
  ],
  [
   "#diaryText",
   "",
   "placeholder",
   "Enter a note…"
  ],
  [
   "button[onclick='addInventoryItem()']",
   "Add item"
  ],
  [
   "button[onclick='addSeedItem()']",
   "Add"
  ],
  [
   "button[onclick='saveHarvest()']",
   "Save"
  ],
  [
   "button[onclick='addGalleryPhoto()']",
   "Add photo"
  ]
 ],
 "baking": [
  [
   "#auth-email",
   "",
   "placeholder",
   "Email address"
  ],
  [
   "#auth-password",
   "",
   "placeholder",
   "Password"
  ],
  [
   "#recipe-name",
   "",
   "placeholder",
   "Recipe name (e.g. apple cake)"
  ],
  [
   "#recipe-input",
   "",
   "placeholder",
   "Enter ingredients (e.g. 250 g flour, 3 eggs)"
  ],
  [
   "label[for='target-d']",
   "Diameter (cm)"
  ],
  [
   "label[for='combo-d1']",
   "Pan 1 Ø (cm)"
  ],
  [
   "label[for='combo-d2']",
   "Pan 2 Ø (cm)"
  ],
  [
   "label[for='recipe-material']",
   "Pan material"
  ],
  [
   "label[for='glaze-type']",
   "Type"
  ],
  [
   "label[for='user-oven-factor']",
   "My oven factor"
  ],
  [
   "label[for='sugar-input']",
   "Granulated sugar (g)"
  ],
  [
   "label[for='sugar-type']",
   "Alternative"
  ],
  [
   "label[for='room-temp']",
   "Current room temperature (°C)"
  ],
  [
   "button[onclick='calculateRecipe()']",
   "Calculate amounts"
  ],
  [
   "button[onclick='runFormFinder()']",
   "Find matching pans"
  ],
  [
   "button[onclick='openCookMode()']",
   "Start cooking mode and timers"
  ],
  [
   "button[onclick='saveSettings()']",
   "Save"
  ],
  [
   "button[onclick='startTimer()']",
   "Start"
  ],
  [
   "button[onclick='pauseTimer()']",
   "Pause"
  ],
  [
   "button[onclick='nextTimerPhase()']",
   "Next phase"
  ],
  [
   "#use-oven-factor",
   "",
   "aria-label",
   "My oven factor"
  ]
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
 for(const [selector,translation,attribute,attributeTranslation] of [...common,...(toolTranslations[tool]||[]),...(extendedFormTranslations[tool]||[])]){
  const translated=attribute?attributeTranslation:translation;
  for(const element of document.querySelectorAll(selector)){
   updateElement(element,translated,attribute,language);
  }
 }
 applyStaticFormCopy(document,tool,language);
}

/* Only application-owned, source-exact browser-dialog copy. Dynamic user values,
   email addresses, backend errors and machine-readable exports are untouched. */
const dialogCopy = Object.freeze({
 moving: {
  'Bitte E-Mail und Passwort eingeben.':'Enter your email address and password.',
  'Registrierung erfolgreich.':'Registration successful.',
  'Bitte Standort eingeben!':'Enter a location.',
  'Standort umbenennen:':'Rename location:',
  '⚠️ Möchtest du diesen Standort und ALLE Kisten darin wirklich löschen?':'⚠️ Delete this location and ALL boxes in it?',
  'Bitte Standort und Kisten-Name angeben!':'Enter a location and box name.',
  'Bild konnte nicht gelesen werden. Nichts gespeichert.':'The image could not be read. Nothing was saved.',
  'Bitte Artikel-Name eingeben!':'Enter an item name.',
  '⚠️ Möchtest du diese Kiste wirklich löschen?':'⚠️ Delete this box?',
  'Keine Kisten vorhanden.':'No boxes available.',
  'Der QR-Code konnte nicht geladen werden. Bitte versuche es erneut.':'The QR code could not be loaded. Please try again.',
  'Vorhandene Gerätedaten in dein Toolya-Konto übernehmen? Cloud-Daten werden nicht überschrieben.':'Import existing device data into your Toolya account? Cloud data will not be overwritten.',
  'Cloud- und Gerätedaten vorhanden. Cloud-Daten behalten und Gerätedaten separat sichern?':'Cloud and device data both exist. Keep cloud data and back up device data separately?',
  'Bitte bestätigen, dass die Sicherung tatsächlich heruntergeladen wurde.':'Confirm that the backup was downloaded.'
 },
 housemates: {
  'Ungültige WG-ID im Link.':'Invalid household ID in the link.',
  'Bitte E-Mail und Passwort eingeben.':'Enter your email address and password.',
  'Angemeldet. Dein Konto ist einsatzbereit.':'Signed in. Your account is ready.',
  'Anfrage verarbeitet. Falls eine Bestätigung erforderlich ist, prüfe dein E-Mail-Postfach und bestätige die Adresse. Melde dich danach an.':'Request processed. If confirmation is required, check your inbox and verify your email address, then sign in.',
  'Erfolgreich angemeldet!':'Signed in successfully!',
  'Abmeldung angehalten: Deine Änderungen sind noch nicht online gesichert. Bitte speichere sie, bevor du dich abmeldest.':'Sign-out paused: your changes have not been saved online. Save them before signing out.',
  'Abgemeldet.':'Signed out.',
  'Migration ist nur für eine ältere WG verfügbar.':'Migration is only available for an older household.',
  'Mitgliederverwaltung ist nur für geschützte WGs verfügbar.':'Member management is only available for protected households.',
  'Deine Benutzer-ID zum Freigeben durch den WG-Eigentümer:':'Your user ID for approval by the household owner:',
  'Die Cloud-Daten der alten WG wurden gelesen. Jetzt eine private Kopie für dein Konto erstellen?':'The old household cloud data was read. Create a private copy for your account now?'
 },
 plants: {
  'Bitte E-Mail und Passwort eingeben.':'Enter your email address and password.',
  'Registrierung erfolgreich!':'Registration successful!',
  'Erfolgreich angemeldet!':'Signed in successfully!',
  'Abgemeldet.':'Signed out.',
  'Bitte ein gültiges Fassungsvermögen größer als 0 eingeben.':'Enter a valid capacity greater than 0.',
  'Regentonne / Zisterne vollständig aufgefüllt!':'Rainwater tank filled completely!',
  'Bitte ein gültiges Saatgutjahr eingeben.':'Enter a valid seed year.',
  'Mehrere Pflanzen gefunden. Bitte die eindeutige Pflanzen-ID eingeben.':'Multiple plants found. Enter the unique plant ID.',
  'Nicht gefunden.':'Not found.',
  'Ungültige Pflanzen-ID.':'Invalid plant ID.',
  'Bitte eine gültige Erntemenge in ganzen Gramm eingeben.':'Enter a valid harvest amount in whole grams.',
  'Die gesamte Erntemenge überschreitet den unterstützten Zahlenbereich.':'The total harvest amount exceeds the supported numeric range.',
  'Lokale Pflanzendaten nach Sicherung in die Cloud übernehmen?':'Back up local plant data and then import it into the cloud?'
 },
 baking: {
  'Bitte E-Mail und Passwort eingeben.':'Enter your email address and password.',
  'Registrierung erfolgreich!':'Registration successful!',
  'Erfolgreich angemeldet!':'Signed in successfully!',
  'Abgemeldet.':'Signed out.',
  'Lokale Rezepte nach Sicherung in die Cloud übernehmen?':'Back up local recipes and then import them into the cloud?',
  'Cloud- und Gerätedaten vorhanden. Cloud-Bestand behalten und lokale Daten separat sichern?':'Cloud and device data both exist. Keep cloud data and back up local data separately?',
  'Bitte bestätigen, dass die Sicherung heruntergeladen wurde.':'Confirm that the backup was downloaded.',
  'Gespeichert':'Saved',
  'Timer abgelaufen!':'Timer finished!'
 }
});
const dialogPrefixes = Object.freeze({
 housemates: {
  'Registrierung fehlgeschlagen: ':'Registration failed: ',
  'Abmeldung fehlgeschlagen: ':'Sign-out failed: ',
  'Migration fehlgeschlagen: ':'Migration failed: '
 }
});
export function translateToolDialog(tool, language, message) {
 if(language!=='en' || typeof message!=='string') return message;
 const exact=dialogCopy[tool]?.[message];
 if(exact!==undefined) return exact;
 for(const [prefix,translated] of Object.entries(dialogPrefixes[tool]||{}))
  if(message.startsWith(prefix)) return translated+message.slice(prefix.length);
 return message;
}
