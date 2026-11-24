import {connectConfirmation} from './connect-copy.mjs';
/* Explicit, reversible UI translations. No access to auth/data stores or mascot settings. */
const common = [
 ['.toolya-auth-loading','Checking your sign-in…'],
 ['.toolya-auth-error:not(button)','We could not verify your sign-in. Check your internet connection and try again.'],
 ['#toolya-auth-retry','Try again'],
 ['.toolya-auth-status > a','View the guide'],
 ['a[href="#main-content"]','Skip to main content'],
 ['.b3-settings-trigger','', 'aria-label','Open settings'],
 ['.b3-settings-trigger','', 'title','Settings'],
 ['#b3-backform-edit','✎ Edit dashboard'],
 ['#b3-backform-editor','', 'aria-label','Dashboard settings'],
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
  ['#toolya-auth-title strong','Moving boxes'],
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
  ['#locName','','aria-label','Location name'],
  ['label[for="boxName"] .helferlein-field-label','Box name']
 ],
 housemates: [
  ['#toolya-auth-title strong','Roommate organizer'],
  ['#settingsModal h3','⚙️ Settings and account'],
  ['label[for="receiptTitle"]','Title / item *:'],
  ['label[for="receiptDate"]','Purchase date *:'],
  ['label[for="receiptPrice"]','Amount (€) *:'],
  ['label[for="receiptCategory"]','Category:'],
  ['button[onclick="saveReceipt()"]','Save transaction / receipt']
 ],
 plants: [
  ['#toolya-auth-title strong','Plant care tracker'],
  ['#settingsModal h3','⚙️ Settings and account'],
  ['label[for="plantLight"]','Light requirements:'],
  ['label[for="plantPotSize"]','Pot size (Ø):'],
  ['label[for="plantInterval"]','Watering interval (days):'],
  ['label[for="plantLastWatered"]','Last watered:'],
  ['label[for="plantPhotoInput"]','Plant photo:'],
  ['button[onclick="savePlant()"]','Save plant'],
  ['#cisternModal p.text-sky-700','Remaining volume'],
  ['button[onclick="closeCisternModal()"]','Close']
 ],
 baking: [
  ['#toolya-auth-title strong','Cake pan calculator'],
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
  ['label[for="recipe-name"] .helferlein-field-label','My recipe'],
  ['label[for="recipe-input"] .helferlein-field-label','My ingredients'],
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
  ],
  ["#locIcon","","aria-label","Location icon"],
  ["#boxPhotoInput","","aria-label","Select box photo"],
  ["#tagFilter","","aria-label","Filter inventory by label"],
  ["#sortFilter","","aria-label","Sort inventory"],
  ["#imageModal","","aria-label","Image preview"],
  ["#boxValue","","aria-label","Value in euros (optional)"],
  ["#boxDesc","","aria-label","Contents / description"],
  ["#boxBarcode","","aria-label","Barcode / EAN (optional)"],
  ["#boxName","","aria-label","Box name (e.g. Box #3)"],
  ["#boxPhotoInput","","title","Select box photo"],
  ["#locName","","aria-label","Location name"],
 ],
 "housemates": [
  ["#invTitle", "", "placeholder", "e.g. microwave, coffee machine"],
  ["#goalTitle", "", "placeholder", "e.g. holiday, deposit reserve"],
  ["#mateVorname", "", "placeholder", "First name *"],
  ["#mateNachname", "", "placeholder", "Last name / display name *"],
  ["#mateEmail", "", "placeholder", "Email address"],
  ["#matePhone", "", "placeholder", "WhatsApp / phone number"],
  ["#mateInsta", "", "placeholder", "Instagram (@handle)"],
  ["#mateFb", "", "placeholder", "Facebook profile URL / name"],
  ["#cleanTaskTitle", "", "placeholder", "e.g. clean the bathroom"],
  ["#contractName", "", "placeholder", "e.g. broadband, broadcasting fee"],
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
const implicitOptionValues = new WeakSet();
function updateElement(element, translation, attribute, language) {
 // Replacing textContent on an interactive element with nested icons/controls
 // removes its children and can destroy delegated UI state. Only leaf text
 // nodes are safe for exact text replacements; attributes remain safe.
 if(!attribute && element.children?.length) return;
 let record=originals.get(element);
 if(!record){record=new Map();originals.set(element,record);}
 const key=attribute || 'text';
 if(!record.has(key))record.set(key,attribute?element.getAttribute(attribute):element.textContent);
 const original=record.get(key);
 if(attribute){
  if(language==='en')element.setAttribute(attribute,translation);
  else if(original===null)element.removeAttribute(attribute);
  else element.setAttribute(attribute,original);
 }else{
  if(element.tagName==='OPTION'){
   if(language==='en' && !element.hasAttribute('value')){
    element.setAttribute('value',original.replace(/[ \t\n\f\r]+/g,' ').replace(/^ | $/g,''));
    implicitOptionValues.add(element);
   }
   if(language!=='en' && implicitOptionValues.delete(element))element.removeAttribute('value');
  }
  element.textContent=language==='en'?translation:original;
 }
}

/* Source-exact UI copy for existing static form controls. Text nodes are translated
   only on leaf controls, never on nested form elements or user content. */
const formCopy = Object.freeze({
 moving: {
  // Additional source-exact static labels, never translated in stored objects.
  "🏢 Büro": "🏢 Office",
  "-- Standort wählen --": "-- Select location --",
  "Höchster Wert zuerst": "Highest value first",
  "✕ Schließen": "✕ Close",
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
  '📤 Wiederherstellen':'📤 Restore','📖 Hilfe & Anleitung anzeigen':'📖 View help and guide',
  // Sprint A: audited static controls and options; displayed text only.
  "📊 Wert nach Standorten": "📊 Value by location",
  "🏷️ Wert nach Kategorien (Tags)": "🏷️ Value by category (tags)",
  "📦 Karton": "📦 Box",
  "🏠 Haus": "🏠 House",
  "🚪 Keller": "🚪 Basement",
  "🏡 Dachboden": "🏡 Attic",
  "🚗 Garage": "🚗 Garage",
  "⛺ Schuppen": "⛺ Shed",
  "🏷️ Standard": "🏷️ Standard",
  "⚠️ Zerbrechlich": "⚠️ Fragile",
  "💎 Wertvoll": "💎 Valuable",
  "❄️ Saison / Deko": "❄️ Seasonal / decorations",
  "Alle Tags": "All tags",
  "Zerbrechlich": "Fragile",
  "Wertvoll": "Valuable",
  "Sortierung: Name": "Sort: name",
  "Geringster Wert zuerst": "Lowest value first",
  "Wert (€):": "Value (€):",
  "Barcode / EAN:": "Barcode / EAN:",
  "Ablauf:": "Expiry:",
  "🔍 Live Scanner": "🔍 Live scanner",
  "👤 Registrieren": "👤 Register",
  "🔑 Anmelden": "🔑 Sign in",
  "🚪 Abmelden": "🚪 Sign out",
  "📥 Sicherung": "📥 Backup",
 },
 housemates: {
  "👥 Mitglieder- & Kontaktverwaltung": "👥 Member and contact management",
  // Source-exact help and workflow headings; never change stored records.
"1. Digitale Pinnwand & Notizen": "1. Digital noticeboard and notes",
  "2. Finanzen & Kasse": "2. Finances and shared funds",
  "3. Termine & Wasch-Slots": "3. Events and laundry slots",
  "4. Küche & Inventar": "4. Kitchen and inventory",
  "🧮 Optimaler WG-Schuldenausgleich": "🧮 Optimized household debt settlement",
  "Nachricht / Notiz (optional):": "Message / note (optional):",
  "📅 Allgemeiner WG-Termin": "📅 General household event",
  "📦 WG-Inventar erfassen": "📦 Add household inventory",
  "📌 WG-Stammdaten bearbeiten": "📌 Edit household details",
  "➕ Neues Mitglied hinzufügen": "➕ Add household member",
  "Gemeinsamer WG-Planer": "Shared household planner",
  "🔐 Private WG erstellen (Anmeldung erforderlich)": "🔐 Create private household (sign-in required)",
  // Additional source-exact static labels, never translated in stored objects.
  "⚙️ Einstellungen und Konto": "⚙️ Settings and account",
  "📖 Hilfe & WG-Handbuch": "📖 Help and household guide",
  "📶 WLAN QR": "📶 Wi-Fi QR",
  "🏠 Wohnen & Miete": "🏠 Housing and rent",
  "🚗 Auto, Tanken & ÖPNV": "🚗 Car, fuel and public transport",
  "📜 Verträge & Abos": "📜 Contracts and subscriptions",
  "🥦 Ernährungs- & Allergie-Matrix": "🥦 Diet and allergy matrix",
  "📜 WG-Verträge & Abo-Manager": "📜 Shared contracts and subscriptions",
  "+ Vertrag": "+ Contract",
  "🛒 Nützliches WG- & Haushalts-Zubehör auf Amazon": "🛒 Useful household accessories on Amazon",
  "🌿 Grün": "🌿 Green",
  "👤 Gäste-Besuch / Übernachtung": "👤 Guest visit / overnight stay",
  "🎉 Party / Lärm-Ankündigung": "🎉 Party / noise notice",
  "📜 Verträge": "📜 Contracts",
  "🐷 Neues Sparziel anlegen": "🐷 Create a savings goal",
  "📶 Gäste-WLAN QR-Code": "📶 Guest Wi-Fi QR code",
  "🖨️ Für Küche Drucken": "🖨️ Print for kitchen",
  "🗑️ Müllabfuhr-Zeiten:": "🗑️ Waste collection times:",
  "Aufgabe / Bereich *:": "Task / area *:",
  "Zuständig gestartet mit:": "Initially assigned to:",
  "📜 Vertrag / Abo eintragen": "📜 Add contract / subscription",
  "Kündigungsfrist Datum (optional):": "Cancellation deadline (optional):",
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
  'Fertig & Schließen':'Done and close','📶 WLAN-Passwort:':'📶 Wi-Fi password:',
  // Sprint A: audited static controls and options; displayed text only.
  "⚙️ Anpassen": "⚙️ Customize",
  "Titel / Artikel *:": "Title / item *:",
  "Kaufdatum *:": "Purchase date *:",
  "Betrag (€) *:": "Amount (€) *:",
  "Kategorie:": "Category:",
  "🛒 Lebensmittel & Haushalt": "🛒 Groceries and household",
  "⚡ Strom, Gas & Wasser": "⚡ Electricity, gas and water",
  "🎉 Freizeit & Party": "🎉 Leisure and parties",
  "📱 Elektronik & Technik": "📱 Electronics and technology",
  "💊 Gesundheit & Drogerie": "💊 Health and toiletries",
  "💶 Einnahmen & Gehalt": "💶 Income and salary",
  "📦 Sonstiges": "📦 Other",
  "Lagerort Karton (optional):": "Storage box location (optional):",
  "Buchung / Kassenbon speichern": "Save transaction / receipt",
  "✓ Ausgleichshinweis": "✓ Settlement notice",
  "Alle Typen": "All types",
  "🔻 Nur Ausgaben": "🔻 Expenses only",
  "🔺 Nur Einnahmen": "🔺 Income only",
  "🔄 Nur Fixkosten": "🔄 Recurring costs only",
  "🛡️ Nur Garantie aktiv": "🛡️ Active warranties only",
  "Alle Kategorien": "All categories",
  "🛒 Lebensmittel": "🛒 Groceries",
  "⚡ Energie": "⚡ Energy",
  "🎉 Freizeit": "🎉 Leisure",
  "📱 Elektronik": "📱 Electronics",
  "💊 Gesundheit": "💊 Health",
  "💶 Einnahmen": "💶 Income",
  "🔄 Rotieren": "🔄 Rotate",
  "Titel / Betreff *:": "Title / subject *:",
  "Erstellt von:": "Created by:",
  "Zettel-Farbe:": "Note colour:",
  "🨨 Gelb": "🨨 Yellow",
  "🌸 Rosa": "🌸 Pink",
  "🌊 Blau": "🌊 Blue",
  "🔮 Violett": "🔮 Violet",
  "Kategorie / Typ *:": "Category / type *:",
  "🧺 Waschmaschine buchen": "🧺 Book washing machine",
  "💨 Trockner buchen": "💨 Book tumble dryer",
  "Gegenstand / Titel *:": "Item / title *:",
  "Kaufpreis (€) *:": "Purchase price (€) *:",
  "Nutzungsdauer (Jahre):": "Useful life (years):",
  "⚙️ Monats-Budgets festlegen": "⚙️ Set monthly budgets",
  "Zielbetrag (€) *:": "Target amount (€) *:",
  "Bereits gespart (€):": "Already saved (€):",
  "🏠 Vermieter Contact:": "🏠 Landlord contact:",
  "🛠️ Hausmeister / Notdienst:": "🛠️ Caretaker / emergency contact:",
  "📇 Aus Handy importieren": "📇 Import from phone",
  "🧹 Neue Putzaufgabe": "🧹 New cleaning task",
  "🍲 Wochenkochplan bearbeiten": "🍲 Edit weekly meal plan",
  "Vertragsname / Titel *:": "Contract name / title *:",
 },
 plants: {
  // Source-exact help and workflow headings; never change stored records.
"Wie erfasse und verwalte ich meine Pflanzen?": "How do I add and manage my plants?",
  "Wie nutze ich den Zisternen- & ROI-Rechner?": "How do I use the rainwater tank and ROI calculators?",
  "Wie erstelle ich einen PDF-Report?": "How do I create a PDF report?",
  // Additional source-exact static labels, never translated in stored objects.
  "📖 Hilfe & Anleitungen": "📖 Help and guides",
  "Groß (20 cm ~ 600ml)": "Large (20 cm ~ 600 ml)",
  "Sehr groß (30+ cm ~ 1.5L)": "Very large (30+ cm ~ 1.5 L)",
  "Alle Standorte / Räume": "All locations / rooms",
  "🛒 Empfohlenes Garten-Zubehör auf Amazon": "🛒 Recommended garden supplies on Amazon",
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
  '💧 Gießen':'💧 Water','Ausblenden':'Dismiss','Achtung: Frostgefahr!':'Warning: frost risk!',
  // Sprint A: audited static controls and options; displayed text only.
  "☀️ Volle Sonne (ca. 7-8 Std.)": "☀️ Full sun (approx. 7–8 hrs)",
  "⛅ Halbschatten (ca. 4-5 Std.)": "⛅ Partial shade (approx. 4–5 hrs)",
  "🌥️ Schatten / Indoor (ca. 1-2 Std.)": "🌥️ Shade / indoors (approx. 1–2 hrs)",
  "Klein (10 cm ~ 120ml)": "Small (10 cm ~ 120 ml)",
  "Mittel (15 cm ~ 300ml)": "Medium (15 cm ~ 300 ml)",
  "🌱 Standard / Gekauft": "🌱 Standard / purchased",
  "✂️ Steckling / Ableger in Kultur": "✂️ Cutting / offshoot growing",
  "🎁 Bereit zum Verschenken / Tauschen": "🎁 Ready to give away / swap",
 },
 baking: {
  // Source-exact help and workflow headings; never change stored records.
"☷ Mehr": "☷ More",
  // Additional source-exact static labels, never translated in stored objects.
  "📖 Hilfe & Anleitung": "📖 Help and guide",
  "⭕ Welche Backform passt? Formen-Finder öffnen": "⭕ Which pan fits? Open pan finder",
  "Zeit laut Rezept (Min.)": "Recipe time (min)",
  "Temperatur laut Rezept (°C)": "Recipe temperature (°C)",
  "Gewünschte Stücke": "Desired slices",
  "Deine Rezept-Originalform:": "Original recipe pan:",
  "Xylit (ungefähr 1:1)": "Xylitol (approximately 1:1)",
  "Erythrit (weniger süß)": "Erythritol (less sweet)",
  "Ei (€/Stück)": "Egg (€/piece)",
  "Schließen ✕": "Close ✕",
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
  'Start':'Start','Pause':'Pause','Nächste Phase':'Next phase','Löschen':'Delete',
  // Sprint A: audited static controls and options; displayed text only.
  "⭕ Formen-Finder": "⭕ Pan finder",
  "⏱️ Backtimer": "⏱️ Baking timer",
  "Welche Form?": "Which pan?",
  "Durchmesser (cm)": "Diameter (cm)",
  "Länge (cm)": "Length (cm)",
  "Breite (cm)": "Width (cm)",
  "Wie viele Formen?": "How many pans?",
  "Form 1 Ø (cm)": "Pan 1 diameter (cm)",
  "Form 2 Ø (cm)": "Pan 2 diameter (cm)",
  "Einheit:": "Units:",
  "US Cups / Ounces": "US cups / ounces",
  "Ofen-Modus": "Oven mode",
  "Runde Springform Ø 26 cm (Standard)": "26 cm round springform (standard)",
  "Runde Springform Ø 28 cm": "28 cm round springform",
  "Runde Springform Ø 24 cm": "24 cm round springform",
  "Runde Springform Ø 20 cm": "20 cm round springform",
  "Kastenform 30 cm": "30 cm loaf pan",
  "Gugelhupfform 22 cm": "22 cm Bundt pan",
  "Haushaltszucker (g)": "Granulated sugar (g)",
  "Honig / Ahornsirup": "Honey / maple syrup",
  "Stevia (Konzentrat)": "Stevia (concentrate)",
  "Mehl (€/kg)": "Flour (€/kg)",
  "Butter (€/250g)": "Butter (€/250 g)",
  "Zucker (€/kg)": "Sugar (€/kg)",
  "⚙ Dashboard anpassen": "⚙ Customize dashboard",
  "Kurzanleitung – So funktioniert's:": "Quick guide – How it works:",
  "Phase 1: Backen": "Phase 1: Baking"
 }
});
function applyStaticFormCopy(document,tool,language){
 const dictionary=formCopy[tool];
 if(!dictionary)return;
 for(const element of document.querySelectorAll('label,button,option,h2,h3,h4,summary')){
  if(element.children.length || element.closest('[contenteditable="true"]'))continue;
  let record=originals.get(element);
  const original=record?.get('text') ?? element.textContent;
  const translated=dictionary[original.trim()];
  if(translated!==undefined)updateElement(element,translated,null,language);
 }
}

const backstudioCopy = {
 'Einfach backen':'Baking made easy','Welche Backform brauchst du?':'Which pan do you need?',
 'Form auswählen – wir rechnen für dich.':'Choose a pan and we’ll do the maths.',
 'Kuchenhöhe ändern':'Adjust cake height','✎ Zutaten eingeben':'✎ Enter ingredients',
 '♨ Backzeit und Ofen':'♨ Baking time and oven','So sieht deine Form aus':'Pan preview',
 'Zum Drehen':'Rotate the pan','Das passt':'Good matches','Diese Formen passen auch':'Other pans that fit',
 'Tippe eine Form an.':'Choose a pan.','Meine eigenen Backformen':'My pans',
 'Meine Backformen':'My pans','Deine Backzeit & Mengen':'Baking time and quantities',
 'Noch mehr Backhelfer':'More baking tools','Rezept einlesen':'Import a recipe',
 'Meine Torte planen':'Plan my cake','Meine Backnotizen':'My baking notes',
 'Meine Einkaufsliste':'My shopping list','← Zurück':'← Back',
 'Backform ändern':'Resize a recipe','Formen finden':'Find pans','Rezeptfoto':'Recipe photo',
 'Torte planen':'Plan a cake','Backnotizen':'Baking notes','Einkaufsliste':'Shopping list',
 'Form wählen':'Choose a pan','Zutaten':'Ingredients','Ergebnis':'Result',
 'Foto auswählen':'Choose a photo','Böden & Creme':'Layers and filling',
 'Meine Erfahrungen':'What worked for me','Was noch fehlt':'What you still need',
 'Trage dein Rezept ein. Hier siehst du die neuen Mengen.':'Enter your recipe to see the new quantities here.',
 '↻ Form drehen':'↻ Rotate pan'
};
const backstudioAttributes = [
 ['.bsui-side','aria-label','Backstudio navigation'],
 ['.bsui-side-nav','aria-label','Backstudio sections'],
 ['.bsui-stepper','aria-label','Four steps for resizing a recipe'],
 ['.bsui-quicknav','aria-label','Backstudio shortcuts'],
 ['.bsui-baker','aria-label','Turquoise Toolya baker mascot'],
 ['.bsui-stage-pan img','alt','Springform pan filled with cake batter']
];
function applyBackstudioCopy(document,language){
 const shell=document.querySelector('#bsui-app');
 if(!shell)return;
 for(const element of shell.querySelectorAll('.bsui-headerline :is(p,h2),.bsui-recipe-details > summary,.bsui-stage-top > *, .bsui-finder > :is(p,h2,button),.bsui-recommend-detail > summary,.bsui-metrics > p,.bsui-additional > summary,.bsui-tool-head > *, .bsui-nav > span:last-child,.bsui-step > span:last-child,.bsui-quick :is(strong,small),#bsui-ingredients-empty,#bsui-webgl button')){
  const original=originals.get(element)?.get('text') ?? element.textContent;
  if(Object.hasOwn(backstudioCopy,original))updateElement(element,backstudioCopy[original],null,language);
 }
 for(const [selector,attribute,translation] of backstudioAttributes){
  for(const element of shell.querySelectorAll(selector))updateElement(element,translation,attribute,language);
 }
}

/* B3 menus are generated after page parse; translate only known action labels.
   Never replace links, handlers, panel keys, user-generated content or account data. */
// Only update accessibility attributes owned by the dashboard shell.
const b3KnownAttributes=Object.freeze([
 ['.b3-preferences','aria-label','Darstellung und Dashboard','Appearance and dashboard'],
 ['.b3-kofi-link','aria-label','Auf Ko-fi einen Kaffee spendieren','Support Toolya with a coffee']
]);
function applyKnownB3Accessibility(document,language){
 for(const [selector,attribute,source,english] of b3KnownAttributes){
  for(const element of document.querySelectorAll(selector)){
   const original=originals.get(element)?.get(attribute)??element.getAttribute(attribute);
   if(original===source)updateElement(element,english,attribute,language);
  }
 }
}
const b3NavigationCopy=Object.freeze({
 common:{
  '☷ Weitere Tools':'☷ More tools',
  'Darstellung & Dashboard':'Appearance & dashboard',
  '✎ Dashboard bearbeiten':'✎ Edit dashboard',
  '❔ Hilfe & Anleitung':'❔ Help and guide',
  '☕ Kaffee spendieren':'☕ Buy a coffee',
  '↗ Entdecke mehr Toolya':'↗ Explore more Toolya',

 },
 moving:{
  '📦 Übersicht':'📦 Overview',
  '📊 Statistiken':'📊 Statistics',
  '➕ Kiste erfassen':'➕ Add box',
  '🗄️ Inventar':'🗄️ Inventory',
  '🔍 QR- & Barcode-Scanner':'🔍 QR & barcode scanner',
  '📄 Inventar als PDF':'📄 Inventory as PDF',
  '🖨️ QR-Etiketten als PDF':'🖨️ QR labels as PDF',
  '💾 Sicherung herunterladen':'💾 Download backup',
  '📂 Daten importieren':'📂 Import data'
 },
 plants:{
  '🌱 Übersicht':'🌱 Overview',
  '📊 Statistiken':'📊 Statistics',
  '📅 Gießplan':'📅 Watering schedule',
  '➕ Pflanze erfassen':'➕ Add plant',
  '🪴 Meine Pflanzen':'🪴 My plants',
  '💰 Garten-ROI':'💰 Garden ROI',
  '🌧️ Zisterne':'🌧️ Rainwater tank',
  '🌰 Saatgut':'🌰 Seeds',
  '📦 Lager & Nachbestellen':'📦 Inventory & restocking',
  '🌿 Beet':'🌿 Garden bed',
  '📄 PDF exportieren':'📄 Export PDF'
 },
 housemates:{
  '🏠 Übersicht':'🏠 Overview',
  '📊 Statistiken':'📊 Statistics',
  '📌 Pinnwand':'📌 Noticeboard',
  '💶 Ausgaben':'💶 Expenses',
  '🧹 Putzplan':'🧹 Cleaning schedule',
  '📅 Kalender':'📅 Calendar',
  '👥 Mitglieder / Kontakte':'👥 Members / contacts',
  '🔄 Jetzt speichern':'🔄 Save now',
  '📄 Finanzbericht (PDF)':'📄 Financial report (PDF)',
  '🔐 Alte WG privat kopieren':'🔐 Copy older household privately',
  '🔐 WG-Zugriff verwalten':'🔐 Manage household access',
  '🔗 WG-Link teilen':'🔗 Share household link',
  '📶 WLAN QR-Code':'📶 Wi-Fi QR code'
 }
});
/* B3 navigation displays are generated from source-language configuration.
   Never translate configuration IDs, targets or action handlers themselves. */
const additionalB3NavCopy=Object.freeze({
 "budget": {
  "📊 Übersicht": "📊 Overview",
  "📈 Statistiken": "📈 Statistics",
  "🎯 Budgets": "🎯 Budgets",
  "🧾 Beleg erfassen": "🧾 Add receipt",
  "📋 Buchungen": "📋 Transactions",
  "📊 Alle Buchungen (CSV)": "📊 All transactions (CSV)",
  "💼 Steuer-Datei herunterladen (CSV)": "💼 Download tax file (CSV)",
  "📄 Finanzbericht (PDF)": "📄 Financial report (PDF)",
  "💾 Sicherung herunterladen": "💾 Download backup",
  "📂 Sicherung einlesen": "📂 Import backup"
 },
 "car": {
  "🚗 Übersicht": "🚗 Overview",
  "📊 Statistiken": "📊 Statistics",
  "➕ Fahrzeug erfassen": "➕ Add vehicle",
  "🛞 Reifenlager": "🛞 Tyre storage",
  "📋 Kostenhistorie": "📋 Cost history",
  "📄 PDF-Report": "📄 PDF report",
  "💾 Sicherung herunterladen": "💾 Download backup",
  "📂 Daten importieren": "📂 Import data"
 },
 "loans": {
  "🤝 Übersicht": "🤝 Overview",
  "📊 Statistiken": "📊 Statistics",
  "➕ Verleih erfassen": "➕ Record loan",
  "🛠️ Inventar": "🛠️ Inventory",
  "📋 Rückgaben": "📋 Returns",
  "📄 Verleih-Bericht (PDF)": "📄 Lending report (PDF)"
 },
 "meters": {
  "⚡ Übersicht": "⚡ Overview",
  "📊 Statistiken": "📊 Statistics",
  "✍️ Ablesung erfassen": "✍️ Record reading",
  "💶 Tarife": "💶 Tariffs",
  "📈 Prognose": "📈 Forecast",
  "📋 Verlauf": "📋 History",
  "📅 Ablese-Erinnerung (Kalender)": "📅 Reading reminder (calendar)",
  "💡 Energiespar-Tipps": "💡 Energy-saving tips",
  "💬 Verbrauch teilen": "💬 Share consumption",
  "📋 Übergabebericht (PDF)": "📋 Handover report (PDF)",
  "📄 Zählerbericht (PDF)": "📄 Meter report (PDF)"
 },
 "parking": {
  "🅿️ Übersicht": "🅿️ Overview",
  "📊 Statistiken": "📊 Statistics",
  "⏱️ Parkschein-Timer": "⏱️ Parking timer",
  "📍 Parkplatz merken": "📍 Save parking spot",
  "📋 Parkhistorie": "📋 Parking history",
  "🔔 Browser-Benachrichtigung erlauben": "🔔 Enable browser notifications",
  "📄 Parkbericht (PDF)": "📄 Parking report (PDF)"
 },
 "pet-health": {
  "🐾 Übersicht": "🐾 Overview",
  "📊 Statistiken": "📊 Statistics",
  "➕ Haustier erfassen": "➕ Add pet",
  "💊 Apotheke": "💊 Pharmacy",
  "📋 Gesundheitsverlauf": "📋 Health history",
  "📄 Gesundheitsbericht (PDF)": "📄 Health report (PDF)",
  "💾 Backup herunterladen": "💾 Download backup",
  "📂 Daten importieren": "📂 Import data"
 }
});
function applyB3NavigationCopy(document,tool,language){
 const translations=b3NavigationCopy[tool]??additionalB3NavCopy[tool];
 if(!translations)return;
 const nav=document.querySelector('.b3-nav');
 const sourceNavLabel={moving:'Umzugskisten & Inventarliste Navigation',housemates:'WG-Organisator Navigation',plants:'Pflanzenpflege Navigation',budget:'Haushaltsbuch & Kassenbon-Scanner Navigation',car:'Autokosten & Reifenwechsel Navigation',loans:'Verliehene Gegenstände Navigation',meters:'Zählerstände erfassen Navigation',parking:'Parkplatz-Merker Navigation','pet-health':'Haustier-Gesundheitspass Navigation'}[tool];
 if(nav && sourceNavLabel && (nav.getAttribute('aria-label')===sourceNavLabel || originals.get(nav)?.has('aria-label'))){
  const accessibleLabel={moving:'Moving boxes navigation',housemates:'Roommate organizer navigation',plants:'Plant care navigation',budget:'Household budget navigation',car:'Vehicle costs navigation',loans:'Lending tracker navigation',meters:'Meter readings navigation',parking:'Parking saver navigation','pet-health':'Pet health navigation'}[tool];
  updateElement(nav,accessibleLabel,'aria-label',language);
 }
 for(const element of document.querySelectorAll('.b3-nav-links > a,.b3-more > summary,.b3-more-content > button,.b3-preferences > h4,.b3-preferences > button,.b3-settings-footer > a')){
  if(element.children.length||element.isContentEditable)continue;
  const original=originals.get(element)?.get('text')??element.textContent;
  const sourceLabel=original.trim();
  const translation=translations[sourceLabel]??b3NavigationCopy.common[sourceLabel];
  if(translation!==undefined)updateElement(element,original.replace(sourceLabel,translation),null,language);
 }
}
/* Dynamic dashboard editor. The panel identifiers and stored layout stay in German/source form.
   Only the known B3 core view labels and exact panel names receive translated display copy. */
const b3EditorPanels=Object.freeze({
 moving:{
  'Inventar-Statistiken':'Inventory statistics',
  'Werte nach Standort & Kategorie':'Values by location and category',
  'Standort & Kisten erfassen':'Add locations and boxes',
  'Inventar durchsuchen':'Search inventory'
 },
 plants:{
  'Pflanzen-Statistiken':'Plant statistics',
  'Garten-Saisonkalender':'Seasonal garden calendar',
  'Pflanze erfassen':'Add plant',
  'Pflanzenliste & Filter':'Plant list and filters',
  'Empfehlungen':'Recommendations'
 },
 baking:{
  'Rechner':'Calculator',
  'Formen-Finder':'Pan finder',
  'Ersatz & Zucker':'Substitutions & sugar',
  'Extras & Kosten':'Extras & costs',
  'Gespeicherte Rezepte':'Saved recipes'
 },
 housemates:{
  'WG-Statistiken':'Household statistics',
  'Pinnwand & Notizen':'Noticeboard and notes',
  'WG-Stammdaten':'Household details',
  'Ausgabenanalyse & Budgets':'Expense analysis and budgets',
  'Sparziele':'Savings goals',
  'Buchungen & Kassenbons':'Transactions and receipts',
  'Schulden & Ausgleich':'Debts and settlements',
  'WG-Inventar':'Household inventory',
  'WG-Kalender':'Household calendar',
  'Putzplan & Einkaufsliste':'Chores and shopping list',
  'Kochplan & Ernährung':'Meal plan and diet',
  'Verträge & Abos':'Contracts and subscriptions',
  'Empfehlungen':'Recommendations'
 }
});
const b3EditorCopy=Object.freeze({
 'Dashboard bearbeiten':'Edit dashboard',
 'Bereiche sortieren, ein-/ausblenden oder in S / M / L darstellen.':'Sort sections, show or hide them, or choose S / M / L sizes.',
 'Sichtbar':'Visible',
 'Speichern':'Save',
 'Abbrechen':'Cancel',
 'Standardlayout':'Default layout',
 'Bereiche sortieren, ein- oder ausblenden und die Größe S / M / L wählen. Änderungen gelten nur für dieses Tool.':'Sort, show or hide sections and choose S / M / L sizes. Changes apply to this tool only.',
 'Werkzeuge sortieren und Abstände anpassen. Alle Berechnungen bleiben erreichbar.':'Arrange tools and adjust spacing. All calculations stay available.',
 'Kompakt':'Compact',
 'Standard':'Standard',
 'Großzügig':'Spacious'
});
const b3EditorLabelNodes=new WeakMap();
/* Additional panel display names only; B3 layout persistence keeps its original keys. */
const additionalB3EditorPanels=Object.freeze({
 "budget": {
  "Monatsstatistiken": "Monthly statistics",
  "Diagramme & Budgets": "Charts and budgets",
  "Sparziele": "Savings goals",
  "Buchungen & Kassenbons erfassen": "Record transactions and receipts",
  "Buchungshistorie & Belege": "Transaction history and receipts"
 },
 "car": {
  "Fahrzeug-Statistiken": "Vehicle statistics",
  "Dringende Fristen & Warnungen": "Urgent deadlines and warnings",
  "Fahrzeug & Wartung erfassen": "Record vehicle and maintenance",
  "Fahrzeuge, Reifenlager & Kostenhistorie": "Vehicles, tyre storage and cost history"
 },
 "loans": {
  "Ausleih-Statistiken": "Lending statistics",
  "Kontakte, Gegenstände & Verleih erfassen": "Add contacts, items and loans",
  "Stamm-Inventar": "Master inventory",
  "Verleih-Liste & Rückgaben": "Loans and returns",
  "Hilfreiches Zubehör": "Useful accessories"
 },
 "meters": {
  "Ablese-Erinnerung": "Reading reminder",
  "Verbrauchsstatistiken": "Consumption statistics",
  "Tarife & Abschläge": "Tariffs and monthly payments",
  "Zählerstand erfassen": "Record meter reading",
  "Monatsvergleich": "Monthly comparison",
  "Jahresprognose": "Annual forecast",
  "Ableseverlauf": "Reading history",
  "Anleitung & Energiespartipps": "Guide and energy-saving tips"
 },
 "parking": {
  "Parkstatistiken": "Parking statistics",
  "Parkschein-Timer & Parkplatz erfassen": "Parking timer and spot entry",
  "Gespeicherte Parkplätze und Gebühren": "Saved spots and fees",
  "Parkzubehör": "Parking accessories"
 },
 "pet-health": {
  "Haustier-Statistiken": "Pet statistics",
  "Impfungen & Fristen": "Vaccinations and deadlines",
  "Haustier & Gesundheitsdaten erfassen": "Record pet and health details",
  "Medikamentenvorrat": "Medication stock",
  "Haustiere, Kalender & Gesundheitsverlauf": "Pets, calendar and health history"
 }
});
function applyB3EditorCopy(document,tool,language){
 const names=b3EditorPanels[tool]??additionalB3EditorPanels[tool];
 const host=document.querySelector(tool==='baking'?'#b3-backform-editor':'#b3-editor');
 if(!host||!names)return;
 const originalEditorLabel=originals.get(host)?.get('aria-label')??host.getAttribute('aria-label');
 if(originalEditorLabel==='Dashboard bearbeiten')updateElement(host,'Edit dashboard','aria-label',language);
 for(const el of host.querySelectorAll('h2,h3,p,.b3-editor-row strong,.b3-editor-row label,.b3-backform-editor-row strong,.flex > button,.b3-backform-editor-actions > button,.b3-backform-editor-row option')){
  if(el.closest('[contenteditable="true"]'))continue;
  // A checkbox is nested in a label. Modify only its direct text node to preserve the input.
  for(const node of el.childNodes){
   if(node.nodeType!==3)continue;
   const original=b3EditorLabelNodes.get(node)??node.textContent;
   const key=original.trim();
   const english=names[key]??b3EditorCopy[key];
   if(english===undefined)continue;
   b3EditorLabelNodes.set(node,original);
   const value=language==='en'?original.replace(key,english):original;
   if(node.textContent!==value)node.textContent=value;
  }
 }
 for(const el of host.querySelectorAll('.b3-editor-row [aria-label],.b3-backform-editor-row [aria-label]')){
  const original=originals.get(el)?.get('aria-label')??el.getAttribute('aria-label');
  if(!original)continue;
  let translation;
  for(const [de,en]of Object.entries(names)){
   if(original===de+' nach oben')translation=en+' move up';
   else if(original===de+' nach unten')translation=en+' move down';
   else if(original===de+' sichtbar')translation=en+' visible';
   else if(original==='Kartengröße '+de)translation='Card size: '+en;
   else if(original==='Größe: '+de)translation='Size: '+en;
   if(translation)break;
  }
  if(!translation&&tool==='baking'){
    for(const [id,label] of [['rechner','Calculator'],['finder','Pan finder'],['substanz','Substitutions & sugar'],['tools','Extras & costs'],['rezepte','Saved recipes']]){
      if(original===id+' nach oben')translation=label+' move up';
      else if(original===id+' nach unten')translation=label+' move down';
      else if(original==='Kartendichte '+id)translation='Card density: '+label;
      if(translation)break;
    }
  }
  if(translation)updateElement(el,translation,'aria-label',language);
 }
}
/* Help-modal body copy is deliberately restricted to fixed help paragraphs.
   Do not touch shared notes, user content, interactive controls or stored records. */
const toolHelpBodyCopy=Object.freeze({
 housemates:{
  'Farbige Sticky Notes erstellen, wichtige Zettel oben anpinnen 📌, Autor wählen und Notizen per Klick verwalten.':'Create colorful sticky notes, pin important items 📌, select an author, and manage notes with a click.',
  'Einnahmen und Ausgaben erfassen, Belegfotos per Texterkennung auslesen und Rückzahlungen berechnen lassen. Die vorgeschlagenen Überweisungen führt ihr selbst durch.':'Track income and expenses, scan receipt photos with text recognition, and calculate reimbursements. You make any suggested transfers yourselves.',
  'WG-Kalender für Waschmaschine, Trockner, Übernachtungsgäste oder Partys nutzen.':'Use the shared calendar for laundry, dryers, overnight visitors or parties.',
  'Putzaufgaben verteilen, Mahlzeiten planen, Einkaufsartikel sammeln und den geschätzten Restwert gemeinsamer Anschaffungen ansehen.':'Assign chores, plan meals, collect shopping items, and view estimated remaining values of shared purchases.',
  'Schritt-für-Schritt-Anleitung zum WG-Organisator':'Step-by-step roommate organizer guide'
 },
 plants:{
  'Gib den Pflanzennamen, die Sorte und den Standort ein. Die App berechnet anhand der Topfgröße automatisch die empfohlene Gießmenge in Millilitern. Über den „💧 Gießen“-Button aktualisierst du den Rhythmus und ziehst Wasser von deiner Zisterne ab.':'Enter the plant name, variety and location. The app estimates the recommended watering amount in millilitres from the pot size. Use “💧 Water” to update the schedule and subtract water from your rainwater tank.',
  'Im Zisternen-Manager kannst du dein Fassungsvermögen festlegen und den Wasserstand bei jedem Gießen automatisch reduzieren. Der Garten-ROI-Rechner vergleicht deine Ausgaben mit dem Marktwert der geernteten Früchte (in kg).':'Set the tank capacity and reduce the water level automatically whenever you water. The garden ROI calculator compares expenses with the estimated market value of harvested produce (in kg).',
  'Nutze den Button „📄 PDF“, um jederzeit einen kompakten Report aller erfassten Pflanzen und Daten als Dokument zu generieren.':'Use “📄 PDF” to generate a compact report of your recorded plants and data at any time.',
  'Schritt-für-Schritt-Anleitung zur Pflanzenpflege':'Step-by-step plant care guide'
 }
});
/* Plant frost notices remain visible and accessible in the selected language;
   the weather and frost-detection logic is intentionally untouched. */
const toolAlertCopy=Object.freeze({
 plants:{
  'Bitte empfindliche Kübelpflanzen schützen oder ins Winterquartier holen!':'Protect sensitive potted plants or move them indoors for winter.'
 }
});
function applyToolAlertCopy(document,tool,language){
 const dictionary=toolAlertCopy[tool];if(!dictionary)return;
 for(const el of document.querySelectorAll('#frostBanner p')){
  if(el.children.length||el.isContentEditable)continue;
  const original=originals.get(el)?.get('text')??el.textContent;
  const source=original.trim(),english=dictionary[source];
  if(english!==undefined)updateElement(el,original.replace(source,english),null,language);
 }
}
function applyToolHelpBodyCopy(document,tool,language){
 const dictionary=toolHelpBodyCopy[tool];
 if(!dictionary)return;
 for(const element of document.querySelectorAll('#helpModal details > p,#helpModal > div > p > a')){
  if(element.children.length||element.isContentEditable)continue;
  const original=originals.get(element)?.get('text')??element.textContent;
  const source=original.trim();
  const english=dictionary[source];
  if(english!==undefined)updateElement(element,original.replace(source,english),null,language);
 }
}
/* Fixed introduction, guidance and empty-state copy. Only source-exact
   leaf paragraphs inside tool-owned UI are eligible. Never translate form
   values, user-edited text or contenteditable descendants. */
const toolParagraphCopy=Object.freeze({
  "moving": {
    "Erfasse Umzugskisten mit Standort und Inhalt und finde deine Sachen über die Suche oder per QR-Code wieder.": "Record moving boxes with their location and contents, then find items using search or QR codes.",
    "Noch keine Standorte oder Kisten erfasst.": "No locations or boxes added yet.",
    "Drucke diesen Code aus. Beim Scannen öffnet sich die Kiste direkt in der App!": "Print this code. Scanning it opens the box directly in the app!"
  },
  "housemates": {
    "Nachrichten, Hinweise oder Einkaufs-Zettel für die Küche anpinnen": "Pin messages, reminders or shopping notes for the kitchen",
    "Die Pinnwand ist noch leer. Erstelle die erste Sticky Note!": "The noticeboard is empty. Create your first sticky note!",
    "Noch keine Sparziele angelegt.": "No savings goals yet.",
    "Noch keine Buchungen vorhanden.": "No transactions yet.",
    "Wasch-Slots, Gäste-Übernachtungen & Events": "Laundry slots, overnight guests and events",
    "Keine anstehenden Termine oder Slots.": "No upcoming events or slots.",
    "Küche & Haushaltshelfer": "Kitchen and household helpers",
    "Praktische Geräte für die WG-Küche →": "Useful equipment for the shared kitchen →",
    "Für den perfekten Putzplan-Einsatz →": "Useful cleaning tools →",
    "Mit Smartphone-Kamera scannen für Sofort-Verbindung:": "Scan with your phone camera to connect instantly:",
    "Übernimmt Name & Telefonnummer direkt aus deinem Handy-Adressbuch.": "Imports name and phone number directly from your phone contacts.",
    "Neue WG-Daten werden geschützt in deinem angemeldeten Konto gespeichert. Zugriff hat zunächst nur der Ersteller; gemeinsames Bearbeiten erfordert eine spätere Mitgliederfreigabe.": "New household data is stored securely in your signed-in account. Initially only the creator has access; sharing edits requires granting members access."
  },
  "plants": {
    "Gießplan, Pflegenotizen und Fotos für Zimmerpflanzen und Garten": "Watering schedule, care notes and photos for houseplants and gardens",
    "Keine Pflanzen erfasst.": "No plants recorded.",
    "Erde & Bio-Dünger": "Soil and organic fertilizer",
    "Für ein gesundes Pflanzenwachstum →": "For healthy plant growth →",
    "Gewächshäuser & Frühbeete": "Greenhouses and cold frames",
    "Optimal für Aussaat & Zucht →": "Ideal for sowing and propagation →",
    "Verwalte dein Schuppen-Inventar. Nutze den Nachbestell-Button, um Artikel direkt über deine Partner-ID bei Amazon zu ordern:": "Manage your shed inventory. Use the reorder button to find items on Amazon through your affiliate link:"
  },
  "baking": {
    "Backformen umrechnen, Zutatenmengen anpassen und Backzeiten abschätzen": "Resize baking pans, scale ingredient quantities and estimate baking times",
    "Wähle zuerst deine Backformen, füge bei Bedarf Zutaten hinzu und passe anschließend die Backbedingungen an. Die Ergebnisse werden automatisch berechnet.": "Choose your baking pans, add ingredients if needed, then adjust the baking conditions. Results are calculated automatically.",
    "Stückbreite am Rand.": "Portion width at the edge.",
    "Du hast ein Rezept für eine bestimmte Springformgröße im Kopf, möchtest aber wissen, welche Alternativen (Kastenform, Muffins etc.) exakt dasselbe Teigvolumen ergeben?": "Have a recipe for a particular round pan? Find alternatives such as loaf pans or muffins with the same batter volume.",
    "Klicke auf den Button, um äquivalente Backformen zu berechnen...": "Select the button to calculate equivalent baking pans…",
    "Margarine (1:1) oder Pflanzenöl (100g Butter = 75g Öl).": "Margarine (1:1) or vegetable oil (100 g butter = 75 g oil).",
    "Richtwerte: Süßkraft und Backeigenschaften hängen vom Produkt und Rezept ab.": "Guidance only: sweetness and baking properties depend on the product and recipe.",
    "Perfektes Backklima. Keine Anpassung nötig.": "Ideal baking conditions. No adjustment needed.",
    "Fehlt dir noch die richtige Form oder das passende Equipment? Hier direkt stöbern:": "Need the right pan or baking equipment? Browse here:",
    "Noch keine Rezepte gespeichert.": "No recipes saved yet.",
    "Teighöhe entspricht exakt dem Original.": "Batter height matches the original exactly.",
    "Schätzung erst nach Rezepteingabe verfügbar": "Estimate available after entering a recipe.",
    "Füge links ein Rezept ein...": "Enter a recipe on the left…",
    "Rührkuchen: Bei Raumtemperatur in Alufolie luftdicht verpacken (3-4 Tage frisch).": "Pound cake: wrap airtight in foil and store at room temperature (fresh for 3–4 days).",
    "Alle Rechenwerkzeuge bleiben erreichbar. Hier kannst du Reihenfolge und Kartendichte anpassen.": "All calculators remain accessible. Adjust their order and card density here."
  },
  "budget": {
    "Setze Monats-Limits pro Kategorie mit visuellen Ampel-Fortschrittsbalken. Erstelle eigene Sparschwein-Ziele (Urlaub, Notgroschen) und zahle flexibel Beträge ein.": "Set monthly spending limits by category and track progress visually. Create savings goals for holidays or emergencies and add contributions whenever you like.",
    "Trage bei einem Kaufbeleg die Garantiedauer und die Rückgabefrist ein. Das Garantieende kannst du in Google Kalender übernehmen oder als Kalenderdatei (ICS) herunterladen. Für Geräte kannst du einen QR-Sticker zum Beleg drucken. Steuerrelevante Buchungen exportierst du als CSV. Den allgemeinen Finanzbericht erhältst du als PDF.": "Record warranty periods and return deadlines for purchases. Add warranty expiry dates to Google Calendar or download an ICS file. Print receipt QR labels for devices, export tax-relevant transactions as CSV, or download a financial report as PDF."
  },
  "parking": {
    "Speichere deinen Parkplatz mit Standort, Notiz oder Foto. Behalte Parkzeit und Gebühren im Blick.": "Save your parking spot with its location, notes or a photo. Keep track of parking time and fees.",
    "Über „PDF-Report“ erstellst du eine Übersicht deiner Parkvorgänge und Gebühren.": "Use the PDF report to review your parking sessions and fees.",
    "Gespeicherte Parkvorgänge": "Saved parking sessions",
    "Gebühren (Gefiltert)": "Fees (filtered)",
    "GPS-Standort": "GPS location",
    "Kein aktiver Parkschein-Timer": "No active parking timer",
    "Stamm-Parkplatz wählen:": "Choose a favourite parking spot:",
    "Keine Parkvorgänge gespeichert.": "No parking sessions saved.",
    "Digitale Parkscheiben": "Digital parking discs",
    "Mit Zulassung für die Windschutzscheibe →": "Approved for use on windscreens →",
    "Für sichere Navigation zum Parkplatz →": "For reliable navigation back to your car →"
  },
  "loans": {
    "Verliehene Gegenstände erfassen und Rückgabetermine und Kautionen im Blick behalten": "Track lent items, return dates and deposits",
    "Für aktive Verleihvorgänge mit Rückgabedatum kannst du direkt einen Google-Kalender-Eintrag generieren oder eine ICS-Datei herunterladen, um rechtzeitig erinnert zu werden.": "For active loans with a return date, create a Google Calendar event or download an ICS reminder.",
    "Mit dem Button „📄 PDF-Report“ erstellst du jederzeit eine übersichtliche Dokumentation aller verliehenen Gegenstände und offenen Kautionen für deine Unterlagen.": "Use the PDF report to document lent items and outstanding deposits.",
    "Über 30 Tage verliehen": "Lent for over 30 days",
    "Keine Stamm-Gegenstände im Inventar hinterlegt.": "No inventory items recorded yet.",
    "Keine verliehenen Gegenstände erfasst.": "No lent items recorded.",
    "Ideal zur Sicherung von Werkzeug & Geräten →": "Ideal for securing tools and equipment →",
    "Für die geordnete Aufbewahrung im Schuppen →": "For organised storage in your shed →"
  },
  "car": {
    "Erfasse Fahrzeugausgaben, führe dein Tankbuch und behalte Wartung und Reifen im Blick.": "Record vehicle expenses and fuel costs, and track maintenance and tyres.",
    "Einträge (gefiltert)": "Entries (filtered)",
    "Noch keine Fahrzeuge erfasst.": "No vehicles recorded yet.",
    "Keine Einträge erfasst.": "No entries recorded."
  },
  "meters": {
    "Erfasse jetzt deine aktuellen Zählerstände für genaue Tageskosten und Prognosen.": "Record your current meter readings to estimate daily costs and forecasts.",
    "Notiere die Ziffern vor dem Komma. Bei HT/NT-Zählern beide Register getrennt erfassen.": "Enter the digits before the decimal separator. For dual-rate meters, record both registers separately.",
    "Die großen Ziffern zeigen volle m³, die roten Zeiger Liter.": "The large digits show whole cubic metres; the red dials show litres.",
    "Gaszählerstand in m³ eintragen. Für die Kostenschätzung verwendet Toolya den hinterlegten Umrechnungsfaktor in kWh/m³.": "Enter gas readings in m³. Toolya uses your saved kWh/m³ conversion factor to estimate costs.",
    "Stromzähler aktiv": "Electricity meter active",
    "Wasserzähler aktiv": "Water meter active",
    "Gaszähler aktiv": "Gas meter active",
    "Noch keine Zählerstände erfasst.": "No meter readings recorded yet.",
    "Fernseher und Konsolen im Standby verbrauchen unnötig Strom. Master-Slave-Leisten schalten automatisch ab.": "TVs and consoles use electricity in standby. Smart power strips can switch them off automatically.",
    "Spüre Wärmeverluste an Fenstern und Wänden auf, um gezielt abzudichten.": "Find heat loss around windows and walls so you can seal gaps.",
    "Für die Kostenprognose bitte Tarifpreis und bei Gas auch den Umrechnungsfaktor hinterlegen.": "To forecast costs, enter your tariff price and, for gas, the conversion factor."
  }
});
function applyToolParagraphCopy(document,tool,language){
 const dictionary=toolParagraphCopy[tool];
 if(!dictionary)return;
 for(const el of document.querySelectorAll('#main-content p,.ty-tool-hero-copy p,#frostBanner p,#guideSection p')){
  if(el.children.length||el.isContentEditable||el.closest('[contenteditable="true"]'))continue;
  const source=originals.get(el)?.get('text')??el.textContent;
  const key=source.trim();
  const translated=dictionary[key];
  if(translated!==undefined)updateElement(el,source.replace(key,translated),null,language);
 }
}
/* Small labels in the tool-owned layout that are not covered by form labels
   or paragraph descriptions. Source exact, leaf-only and reversible. */
/* Source-verified static leaf labels across five tools. */
const extendedSmallCopy=Object.freeze({
  "parking": {
    "Standort / Parkhaus": "Location / parking garage",
    "Parkebene / Sektor": "Parking level / section",
    "Gebühr in €": "Fee in €",
    "Parkplatzfoto auswählen": "Choose parking photo",
    "Parkhistorie nach Zeitraum filtern": "Filter parking history by date",
    "KFZ Smartphone-Halterungen": "Car phone mounts"
  },
  "meters": {
    "Verbrauch erfassen, Kosten auswerten und Ablesetermine im Blick behalten": "Record consumption, review costs and track meter-reading dates",
    "📖 Ausklappbare Anleitung: Richtig ablesen & Energie sparen": "📖 Expandable guide: Read meters correctly and save energy",
    "Erfasste Ablesungen": "Recorded readings",
    "Verlauf nach Zählertyp filtern": "Filter history by meter type",
    "Der Wechsel auf hochwertige LEDs spart bis zu 85 % Beleuchtungsstrom.": "Switching to quality LEDs can save up to 85% of lighting electricity.",
    "Smarte Thermostate senken die Heizkosten im Schnitt um 10 bis 15 %.": "Smart thermostats can reduce heating costs by around 10–15%.",
    "🔄 Zählerwechsel Start": "🔄 Meter replacement start",
    "Zählerstände": "Meter readings",
    "Reduziere deine Jahres-Nachzahlung effektiv mit diesen praxiserprobten Spar-Tipps und passenden Amazon-Empfehlungen:": "Reduce your annual utility bill adjustment with these practical saving tips and related Amazon recommendations:"
  },
  "loans": {
    "Verliehene Dinge": "Lent items",
    "Aktiv": "Active",
    "Verloren/Defekt": "Lost / damaged",
    "Zurück": "Returned",
    "Offene Kaution": "Outstanding deposit",
    "Telefon (für WhatsApp)": "Phone (for WhatsApp)",
    "Kategorie des Gegenstands": "Item category",
    "Seriennummer / ISBN / Barcode": "Serial number / ISBN / barcode",
    "GPS-Tracker URL / AirTag Link (optional)": "GPS tracker URL / AirTag link (optional)",
    "Oder neuen Namen direkt eingeben...": "Or enter a new name directly…",
    "Notiz (optional)": "Note (optional)",
    "Foto des verliehenen Gegenstands auswählen": "Choose a photo of the lent item",
    "Verleih nach Person filtern": "Filter lending records by person",
    "Bluetooth & GPS Tracker (AirTags)": "Bluetooth and GPS trackers (AirTags)",
    "Werkzeugkoffer & Boxen": "Tool cases and boxes",
    "Scannen, um Details aufzurufen.": "Scan to view details."
  },
  "car": {
    "Registrierte Fahrzeuge": "Registered vehicles",
    "Gesamtkosten (gefiltert)": "Total costs (filtered)",
    "Fahrzeugname": "Vehicle name",
    "Kennzeichen": "Registration plate",
    "KM-Stand": "Mileage",
    "Notfall- / Pannen-Tel.": "Emergency / breakdown phone",
    "Fahrzeug für den Eintrag": "Vehicle for this record",
    "Art des Eintrags": "Record type",
    "Datum des Eintrags": "Record date",
    "Fahrzeug für den Reifensatz": "Vehicle for tyre set",
    "Reifentyp": "Tyre type",
    "Lagerort": "Storage location",
    "Historie nach Fahrzeug filtern": "Filter history by vehicle",
    "⛽ Kraftstoff- & Tank-Statistik (Aktueller Monat)": "⛽ Fuel statistics (current month)",
    "Autokosten": "Vehicle costs",
    "Bezeichnung": "Description",
    "Kosten in €": "Cost in €",
    "Profil (mm)": "Tread (mm)",
    "Liter": "Litres",
    "DOT / Jahr": "DOT / year",
    "Profil mm": "Tread mm",
    "Hilfe & Anleitung anzeigen": "Show help and guide",
    "📖 Kurzanleitung – So funktioniert's:": "📖 Quick guide – How it works:",
    "1. Fahrzeug & Papiere": "1. Vehicle and documents",
    "2. Wartung & Tanken": "2. Maintenance and refuelling",
    "3. Wartung und Tankkosten": "3. Maintenance and fuel costs",
    "4. Reifen & Backup": "4. Tyres and backup",
    "Hilfe & Anleitung ausblenden": "Hide help and guide",
    "Versicherung & Pol.-Nr.": "Insurance & policy no."
  },
  "pet-health": {
    "Impfungen, Tierarztbesuche, Medikamente und Gesundheitsdaten für Hund und Katze": "Vaccinations, vet visits, medication and health records for cats and dogs",
    "Registrierte Haustiere": "Registered pets",
    "Gesundheits-Einträge": "Health records",
    "Name des Haustiers": "Pet name",
    "Tierart / Rasse": "Species / breed",
    "Chip-Nummer": "Microchip number",
    "Allergien / Unverträglichkeiten": "Allergies / intolerances",
    "Straße, PLZ &amp; Ort der Praxis": "Practice street, postal code and city",
    "Haustier für den Eintrag": "Pet for this record",
    "Gewicht in kg (optional)": "Weight in kg (optional)",
    "Medikament / Vorrat": "Medication / stock",
    "Stück / Packung": "Pieces / packs",
    "Keine Medikamente in der Apotheke hinterlegt.": "No medications recorded.",
    "Noch keine Haustiere erfasst.": "No pets recorded yet.",
    "Verlauf nach Haustier filtern": "Filter history by pet",
    "Keine Termine erfasst.": "No appointments recorded.",
    "Tiergesundheit": "Pet health",
    "Gesamtkosten": "Total costs",
    "🏥 Tierarzt & Praxis-Verzeichnis:": "🏥 Vet and practice directory:",
    "Telefon / Notfall-Nr.": "Phone / emergency number",
    "Bezeichnung": "Description",
    "Kosten in € (optional)": "Cost in € (optional)",
    "Hilfe & Anleitung anzeigen": "Show help and guide",
    "📖 Kurzanleitung – So funktioniert's:": "📖 Quick guide – How it works:",
    "1. Haustier & Praxis": "1. Pet and vet practice",
    "2. Gewicht & Trends": "2. Weight and trends",
    "3. Apotheke & Vorräte": "3. Medicine and stock",
    "4. Kalender & Export": "4. Calendar and export",
    "Hilfe & Anleitung ausblenden": "Hide help and guide",
    "🛡️ TASSO / Register": "🛡️ TASSO / registry",
    "Futtermarke & Sorte": "Food brand & variety",
    "Praxisname & Tierarzt": "Practice name & veterinarian"
  },
  "moving": {
    "Erfasste Kisten": "Recorded boxes",
    "Standorte": "Locations",
    "Gesamtwert Inventar": "Total inventory value",
    "Standort Name": "Location name",
    "Kisten-Name": "Box name",
    "Wert in € (optional)": "Value in € (optional)",
    "Inhalt / Beschreibung": "Contents / description",
    "Garantie- oder Ablaufdatum": "Warranty or expiry date",
    "Foto der Kiste auswählen": "Choose box photo",
    "3. QR-Code drucken": "3. Print QR code",
    "4. Scanne & Finde": "4. Scan and find"
  },
  "plants": {
    "Bestand": "Inventory",
    "Heutiger Bedarf": "Today's needs",
    "Zisternen-Stand": "Water tank level",
    "Ernte-Ertrag": "Harvest yield",
    "Leitfaden": "Guide",
    "Art / Sorte": "Species / variety",
    "Standort / Beet": "Location / garden bed",
    "Artikel": "Item",
    "Menge": "Quantity",
    "Neues Saatgut gesucht?": "Looking for new seeds?",
    "Sorte": "Variety",
    "Erntejahr": "Harvest year",
    "Gewinnbilanz": "Profit overview",
    "Restbestand": "Remaining stock",
    "Wichtige Anmerkungen & Pflegehinweise...": "Important notes and care instructions…"
  },
  "baking": {
    "In 3 Schritten zum passenden Backrezept": "Find your baking recipe in three steps",
    "Mein Rezept": "My recipe",
    "Meine Zutaten": "My ingredients",
    "Teigmenge nicht ändern": "Keep batter quantity",
    "Meinen Ofenfaktor nutzen": "Use my oven adjustment",
    "Mit Rand": "With rim",
    "Springformen": "Springform pans",
    "Ofenthermometer": "Oven thermometer",
    "Backpapier": "Baking paper",
    "Faktor": "Factor",
    "Backzeit (ca.)": "Baking time (approx.)",
    "Temperatur": "Temperature",
    "Kosten": "Costs",
    "So voll wird die Form:": "Expected pan fill level:",
    "Lagerungstipp:": "Storage tip:",
    "1. Rezept & Basis": "1. Recipe and basics",
    "2. Form vergleichen": "2. Compare pans",
    "4. Kochmodus": "4. Cooking mode",
    "Multi-Timer aktiv": "Multi-timer active",
    "1 EL Chiasamen + 3 EL Wasser ODER 2 EL Apfelmark.": "1 tbsp chia seeds + 3 tbsp water OR 2 tbsp applesauce.",
    "1 TL Natron + 1 TL Zitronensaft oder Essig.": "1 tsp baking soda + 1 tsp lemon juice or vinegar.",
    "250ml Milch + 1 EL Zitronensaft (5 Min. ruhen lassen).": "250 ml milk + 1 tbsp lemon juice (rest for 5 minutes).",
    "Finde passende Silikonformen, Teigschaber oder Spritzbeutel direkt online.": "Find suitable silicone pans, spatulas or piping bags online.",
    "Ca. 180g Glasur": "Approx. 180 g icing",
    "Konto wird geprüft …": "Checking account…"
  },
  "budget": {
    "Ausgaben erfassen, Budget planen, Belege scannen und Garantien verwalten": "Track expenses, plan budgets, scan receipts and manage warranties",
    "Ausgabe": "Expense",
    "Einnahme": "Income",
    "Fixkosten/Abos": "Fixed costs / subscriptions",
    "OCR-Scanner": "Receipt text scanner",
    "Monats-Einnahmen": "Monthly income",
    "Monats-Saldo": "Monthly balance",
    "Fixkosten-Quote": "Fixed-cost ratio",
    "Garantiewert aktiv": "Active warranty value",
    "Hausrat-Zeitwert": "Current household item value",
    "Steuer-Gesamtwert": "Total tax-relevant value",
    "Monatsverlauf (Cashflow)": "Monthly cash flow",
    "🔄 Wiederkehrende Fixkosten / Abo": "🔄 Recurring fixed costs / subscription",
    "💼 Steuerrelevant": "💼 Tax relevant",
    "⚡ Thermopapier-Filter (Helligkeit/Kontrast anpassen):": "⚡ Thermal paper filter (adjust brightness/contrast):",
    "🔄 Fixkosten": "🔄 Fixed costs",
    "💼 Steuer": "💼 Tax",
    "Garantie abgelaufen": "Warranty expired",
    "Lade Budgets...": "Loading budgets…",
    "Belegfoto auswählen": "Choose receipt photo"
  },
  "housemates": {
    "Monats-Einnahmen": "Monthly income",
    "Monats-Saldo": "Monthly balance",
    "Offene WG-Schulden": "Outstanding household debts",
    "Fixkosten-Quote": "Fixed-cost ratio",
    "Inventar Restwert": "Remaining inventory value",
    "Aktive Sticky Notes": "Active sticky notes",
    "WLAN-Passwort:": "Wi-Fi password:",
    "Vermieter:": "Landlord:",
    "Hausmeister / Notdienst:": "Caretaker / emergency service:",
    "🔄 Wiederkehrende Fixkosten": "🔄 Recurring fixed costs",
    "💼 Steuerrelevant": "💼 Tax relevant",
    "Berechne Ausgleich...": "Calculating settlement…",
    "Berechnet den fairen Zeitwert & Auszahlungsanspruch bei Auszug.": "Calculates fair current value and compensation when moving out.",
    "Inkl. Amazon-Link & Kassen-Sync": "Includes Amazon link and receipt sync",
    "Putz- & Reinigungsmittel": "Cleaning supplies",
    "📌 Oben anpinnen (Wichtige Notiz)": "📌 Pin to top (important note)",
    "📇 Smartphone-Kontakte importieren:": "📇 Import phone contacts:",
    "Lade...": "Loading…",
    "Lade Budgets...": "Loading budgets…",
    "Belegfoto auswählen": "Choose receipt photo",
    "Spendier dem Entwickler einen Kaffee": "Buy the developer a coffee"
  }
});
const toolSmallCopy=Object.freeze({
  "moving": {
    "Standort der Kiste": "Box location",
    "Kennzeichnung der Kiste": "Box label",
    "🔍 Suchen (Kiste, Artikel, Barcode)...": "🔍 Search (box, item, barcode)…",
    "Standort anlegen": "Add location",
    "2. Kiste & Artikel": "2. Boxes and items"
  },
  "housemates": {
    "WG-Ausgaben aufteilen, Putzplan, Kalender und gemeinsame Aufgaben organisieren": "Split household expenses, organize cleaning, calendars and shared tasks",
    "Monats-Ausgaben": "Monthly expenses",
    "Müllabfuhr:": "Waste collection:",
    "Ausgaben nach Kategorie": "Expenses by category",
    "Cashflow (Einnahmen vs. Ausgaben)": "Cash flow (income vs. expenses)",
    "Nach Kategorie filtern": "Filter by category",
    "z. B. Hafermilch, Spülmittel, Tabs": "e.g. oat milk, dish soap, tablets"
  },
  "plants": {
    "Bald fällig": "Due soon",
    "Überfällig": "Overdue",
    "Pflanzen nach Standort filtern": "Filter plants by location"
  },
  "baking": {
    "Butter 2 Std. vorher aus dem Kühlschrank nehmen.": "Take butter out of the fridge two hours ahead.",
    "Springform fetten und mit Mehl/Semmelbröseln ausstreuen.": "Grease the cake pan and dust with flour or breadcrumbs.",
    "Ofen rechtzeitig auf Ziel-Temperatur vorheizen.": "Preheat the oven to the target temperature in good time.",
    "Alle Zutaten abwiegen und bereitstellen.": "Weigh out and prepare all ingredients.",
    "Nährwerte (geschätzt):": "Nutrition (estimated):",
    "💡 Fehlendes Zubehör?": "💡 Need baking equipment?",
    "3. Cloud-Konto": "3. Cloud account"
  }
});
function applyToolSmallCopy(document,tool,language){
 const dictionary={...(toolSmallCopy[tool]||{}),...(extendedSmallCopy[tool]||{})};if(!Object.keys(dictionary).length)return;
 for(const el of document.querySelectorAll('#main-content span,#main-content strong,#main-content li,#main-content p,#settingsModal strong,#settingsModal span,.b3-tool-title p')){
  if(el.children.length||el.isContentEditable||el.closest('[contenteditable="true"]'))continue;
  const original=originals.get(el)?.get('text')??el.textContent;
  const source=original.trim(),translation=dictionary[source];
  if(translation!==undefined)updateElement(el,original.replace(source,translation),null,language);
 }
}
/* Source-exact accessibility copy on application-owned controls. Unlike
   text node copy, this intentionally changes attributes only; form values,
   URL destinations and any user-generated names are never touched. */
const toolAccessibilityCopy=Object.freeze({
  "moving": [
    [
      "aria-label",
      "Symbol des Standorts",
      "Location icon"
    ],
    [
      "aria-label",
      "Kisten-Name (z.B. Karton #3)",
      "Box name (e.g. Box #3)"
    ],
    [
      "aria-label",
      "Inhalt / Beschreibung (z.B. Lichterketten)",
      "Contents / description (e.g. string lights)"
    ],
    [
      "title",
      "Garantie / Ablaufdatum",
      "Warranty / expiry date"
    ],
    [
      "aria-label",
      "Inventar nach Kennzeichnung filtern",
      "Filter inventory by label"
    ],
    [
      "aria-label",
      "Inventar sortieren",
      "Sort inventory"
    ],
    [
      "aria-label",
      "Bildvorschau",
      "Image preview"
    ],
    [
      "alt",
      "Vergrößertes Foto der Umzugskiste",
      "Enlarged photo of the moving box"
    ]
  ],
  "housemates": [
    [
      "aria-label",
      "Diagramm: WG-Ausgaben nach Kategorie",
      "Chart: household expenses by category"
    ],
    [
      "aria-label",
      "Diagramm: WG-Einnahmen und Ausgaben im Vergleich",
      "Chart: household income versus expenses"
    ],
    [
      "aria-label",
      "Buchungen nach Typ filtern",
      "Filter transactions by type"
    ]
  ],
  "plants": [
    [
      "aria-label",
      "Name (z.B. Tomate Harzfeuer)",
      "Plant name (e.g. Harzfeuer tomato)"
    ],
    [
      "aria-label",
      "Art / Sorte (z.B. Tomate)",
      "Species / variety (e.g. tomato)"
    ],
    [
      "aria-label",
      "Standort / Beet (z.B. Gewächshaus)",
      "Location / bed (e.g. greenhouse)"
    ],
    [
      "aria-label",
      "Wichtige Anmerkungen & Pflegehinweise...",
      "Important notes and care instructions…"
    ]
  ],
  "baking": [
    [
      "aria-label",
      "Backform-Werkzeuge",
      "Baking pan tools"
    ],
    [
      "aria-label",
      "Name des Rezepts (z.B. Omas Apfelkuchen)",
      "Recipe name (e.g. grandma's apple cake)"
    ],
    [
      "aria-label",
      "Zutaten des Rezepts",
      "Recipe ingredients"
    ]
  ]
});
function applyToolAccessibilityCopy(document,tool,language){
 const pairs=toolAccessibilityCopy[tool];if(!pairs)return;
 for(const element of document.querySelectorAll('#main-content [aria-label],#main-content [title],#settingsModal [aria-label],#settingsModal [title],.b3-backform-main [aria-label],.b3-backform-main [title],.b3-backform-tabs [aria-label],#imageModal[aria-label],#imageModal [alt]')){
  if(element.isContentEditable||element.closest('[contenteditable="true"]'))continue;
  for(const [attribute,source,translation] of pairs){
   const original=originals.get(element)?.get(attribute)??element.getAttribute(attribute);
   if(original===source)updateElement(element,translation,attribute,language);
  }
 }
}
/* Preserve nested Lucide icons and onclick handlers while translating the
   direct text nodes of two verified, fixed Backstudio controls. */
const bakingMixedTextOriginals=new WeakMap();
function applyBakingMixedTextCopy(document,language){
 for(const [selector,source,target] of [
  ['h2','2. Deine Zutaten','2. Your ingredients'],
  ['button[onclick="calculateRecipe()"]','Mengen ausrechnen','Calculate quantities']
 ]){
  for(const element of document.querySelectorAll(selector)){
   for(const node of element.childNodes){
    if(node.nodeType!==3)continue;
    const original=bakingMixedTextOriginals.get(node)??node.textContent;
    if(original.trim()!==source)continue;
    if(!bakingMixedTextOriginals.has(node))bakingMixedTextOriginals.set(node,original);
    node.textContent=language==='en'?original.replace(source,target):original;
   }
  }
 }
}

/* Expanded application surface: source-exact strings only.
   Never modify user-provided text, cloud records, option value attributes,
   links, aria-controls, handlers or calculation inputs. */
const extraFormCopy=Object.freeze({
 "budget": {
  "🎉 Freizeit, Gastronomie & Urlaub": "🎉 Leisure, dining and holidays",
  "🐾 Haustiere": "🐾 Pets",
  "Haushaltsbuch mit Kassenbon-Scanner": "Household budget and receipt scanner",
  "📘 Kombinierte Gebrauchsanleitung": "📘 Combined user guide",
  "1. Buchungen & Finanzen": "1. Transactions and finances",
  "2. Budgets & Sparziele": "2. Budgets and savings goals",
  "3. Kassenbons, OCR & Galerie": "3. Receipts, OCR and gallery",
  "4. Kaufbelege, Fristen und Export": "4. Receipts, deadlines and exports",
  "📊 Visuelle Finanz-Analyse": "📊 Visual financial analysis",
  "🎯 Monatsbudgets im Blick": "🎯 Monthly budgets at a glance",
  "⚙️ Budgets anpassen": "⚙️ Adjust budgets",
  "🐷 Sparziele im Blick": "🐷 Savings goals at a glance",
  "+ Neues Sparziel": "+ New savings goal",
  "✍️ Einnahme oder Ausgabe erfassen": "✍️ Record income or expense",
  "Titel / Artikel / Zweck *:": "Title / item / purpose *:",
  "Händler / Partner / Quelle:": "Merchant / partner / source:",
  "Kaufdatum *:": "Purchase date *:",
  "Betrag (€) *:": "Amount (€) *:",
  "Kategorie:": "Category:",
  "Zahlungsart:": "Payment method:",
  "Garantie (Monate):": "Warranty (months):",
  "Rückgabe (Tage):": "Return period (days):",
  "Nutzung (Jahre):": "Useful life (years):",
  "Seriennummer / S/N:": "Serial number:",
  "Lagerort Karton / Zubehör:": "Storage location / accessories:",
  "📷 Belegfoto, Mehrseiten-Scan & Thermopapier-Filter": "📷 Receipt photo, multiple pages and thermal paper filter",
  "🔍 Text automatisch erkennen (OCR)": "🔍 Recognise text (OCR)",
  "🗑️ Alle Belegbilder entfernen": "🗑️ Remove all receipt images",
  "Notiz / Bemerkung:": "Notes / comments:",
  "Buchung / Kassenbon speichern": "Save transaction / receipt",
  "📋 Buchungshistorie & Kassenbons": "📋 Transaction history and receipts",
  "Alle Typen": "All types",
  "🔻 Nur Ausgaben": "🔻 Expenses only",
  "🔺 Nur Einnahmen": "🔺 Income only",
  "🔄 Nur Fixkosten/Abos": "🔄 Fixed costs / subscriptions only",
  "🛡️ Nur mit Aktiver Garantie": "🛡️ Active warranty only",
  "Alle Kategorien": "All categories",
  "⚙️ Monats-Budgets festlegen": "⚙️ Set monthly budgets",
  "🐷 Neues Sparziel anlegen": "🐷 Add savings goal",
  "Bezeichnung des Zieles *:": "Goal name *:",
  "Zielbetrag (€) *:": "Target amount (€) *:",
  "Bereits gespart (€):": "Already saved (€):",
  "Anlegen": "Create",
  "🖼️ Dokumenten-Galerie": "🖼️ Document gallery",
  "🏷️ Geräte-Sticker drucken": "🏷️ Print device stickers",
  "🖨️ Sticker Drucken": "🖨️ Print stickers"
 },
 "car": {
  "Autokosten-Rechner": "Vehicle cost tracker",
  "🚨 Dringende Fristen & Warnungen": "🚨 Urgent deadlines and warnings",
  "🚗 Fahrzeug anlegen und Unterlagen ablegen": "🚗 Add vehicle and documents",
  "Fahrzeugfoto:": "Vehicle photo:",
  "Fahrzeugschein (Scan):": "Vehicle registration (scan):",
  "Fahrzeug speichern": "Save vehicle",
  "🛠️ Autokosten und Belege erfassen": "🛠️ Record vehicle costs and receipts",
  "-- Fahrzeug wählen --": "-- Select vehicle --",
  "🔍 TÜV / Hauptuntersuchung": "🔍 Vehicle inspection",
  "⚙️ Inspektion & Service": "⚙️ Inspection and servicing",
  "🛡️ Versicherung (Fixkosten)": "🛡️ Insurance (fixed cost)",
  "🏛️ Kfz-Steuer (Fixkosten)": "🏛️ Vehicle tax (fixed cost)",
  "🛞 Reifenwechsel": "🛞 Tyre change",
  "📏 Reifentiefe-Check": "📏 Tyre tread check",
  "🛢️ Ölwechsel": "🛢️ Oil change",
  "🔧 Reparatur": "🔧 Repair",
  "⛽ Tanken / Kraftstoff": "⛽ Refuelling / fuel",
  "Beleg / Rechnung (optional):": "Receipt / invoice (optional):",
  "Eintrag speichern": "Save entry",
  "🚙 Meine Fahrzeuge & Bordmappe": "🚙 My vehicles and documents",
  "🛞 Reifensätze verwalten": "🛞 Manage tyre sets",
  "☀️ Sommerreifen": "☀️ Summer tyres",
  "❄️ Winterreifen": "❄️ Winter tyres",
  "🌤️ Ganzjahresreifen": "🌤️ All-season tyres",
  "Reifensatz speichern": "Save tyre set",
  "📋 Verlauf, Ausgaben und Termine": "📋 History, expenses and appointments",
  "Alle Fahrzeuge anzeigen": "Show all vehicles",
  "Eintrag bearbeiten": "Edit entry",
  "Bezeichnung:": "Description:",
  "Kosten (€):": "Cost (€):",
  "Profiltiefe (mm):": "Tread depth (mm):"
 },
 "loans": {
  "Verliehene Gegenstände verwalten": "Manage lent items",
  "📖 Hilfe & Anleitungen": "📖 Help and guides",
  "Wie verwalte ich Leihgaben und Kontakte?": "How do I manage loans and contacts?",
  "Wie nutze ich Kalender-Erinnerungen & ICS?": "How do I use calendar reminders and ICS?",
  "Wie erstelle ich einen PDF-Report?": "How do I create a PDF report?",
  "👤 Kontakt anlegen": "👤 Add contact",
  "Kontakt speichern": "Save contact",
  "🛠️ Stamm-Gegenstand anlegen": "🛠️ Add inventory item",
  "🔨 Werkzeug": "🔨 Tools",
  "💻 Elektronik & IT": "💻 Electronics and IT",
  "📚 Bücher & Medien": "📚 Books and media",
  "⚽ Sport & Freizeit": "⚽ Sport and leisure",
  "📦 Sonstiges": "📦 Other",
  "In Stamm-Inventar speichern": "Save to inventory",
  "➕ Verleih-Vorgang erfassen": "➕ Record a loan",
  "Gegenstand aus Inventar wählen:": "Choose inventory item:",
  "-- Gegenstand wählen --": "-- Select item --",
  "Ausleiher wählen:": "Choose borrower:",
  "-- Kontakt wählen --": "-- Select contact --",
  "Ausleihdatum:": "Lending date:",
  "Geplante Rückgabe:": "Planned return:",
  "Kaution / Wert in €:": "Deposit / value in €:",
  "Verleih speichern": "Save loan",
  "🛠️ Stamm-Inventar & Gegenstände (Mit Seriennummer & GPS)": "🛠️ Inventory and items (serial number and GPS)",
  "📋 Verleih-Zentrale & Historie": "📋 Loan overview and history",
  "Alle Kategorien": "All categories",
  "Alle Personen": "All people",
  "🛒 Nützliches Zubehör & GPS-Tracker auf Amazon": "🛒 Useful accessories and GPS trackers on Amazon",
  "Verleih-Eintrag bearbeiten": "Edit loan record",
  "Gegenstand:": "Item:",
  "Ausleiher:": "Borrower:",
  "Kaution / Wert (€):": "Deposit / value (€):",
  "Notiz:": "Note:",
  "Freundliche Erinnerung": "Friendly reminder",
  "Dringende Rückgabe": "Urgent return",
  "📌 Status: Aktiv": "📌 Status: active",
  "✅ Zurückgegeben": "✅ Returned",
  "⚠️ Verloren / Defekt": "⚠️ Lost / damaged"
 },
 "meters": {
  "Zählerstände erfassen: Strom, Gas & Wasser": "Record electricity, gas and water readings",
  "Ablese-Erinnerung (Über 30 Tage vergangen!)": "Reading reminder (over 30 days since last reading!)",
  "📅 Kalender": "📅 Calendar",
  "Später": "Later",
  "⚡ Strom (HT / NT)": "⚡ Electricity (day / night)",
  "💧 Wasser": "💧 Water",
  "♨️ Gas": "♨️ Gas",
  "⚙️ Tarife, HT/NT, Abschläge & Gas-Brennwert": "⚙️ Tariffs, day/night rates, payments and gas calorific value",
  "Tarife speichern": "Save tariffs",
  "HT-Preis (€ / kWh):": "Day rate (€ / kWh):",
  "NT-Preis (€ / kWh):": "Night rate (€ / kWh):",
  "Monatlicher Abschlag (€):": "Monthly payment (€):",
  "Arbeitspreis (€ / m³):": "Unit price (€ / m³):",
  "Arbeitspreis (€ / kWh):": "Unit price (€ / kWh):",
  "Brennwertfaktor (kWh/m³):": "Calorific value (kWh/m³):",
  "✍️ Neuen Zählerstand erfassen": "✍️ Record a new meter reading",
  "Zähler-Typ:": "Meter type:",
  "⚡ Strom (HT / Einzeltarif)": "⚡ Electricity (day / single tariff)",
  "🌙 Strom (NT / Nachttarif)": "🌙 Electricity (night tariff)",
  "💧 Kaltwasser (m³)": "💧 Cold water (m³)",
  "🔥 Warmwasser (m³)": "🔥 Hot water (m³)",
  "♨️ Gas (m³)": "♨️ Gas (m³)",
  "Zählername / Nummer:": "Meter name / number:",
  "Standort / Bereich:": "Location / area:",
  "🏠 Hauptwohnung / Keller": "🏠 Main apartment / basement",
  "🚗 Garage / Carport": "🚗 Garage / carport",
  "🌱 Garten / Außenbereich": "🌱 Garden / outdoor area",
  "🔑 Einliegerwohnung / Vermietung": "🔑 Separate apartment / rental",
  "🌡️ Wärmepumpe / Heizung": "🌡️ Heat pump / heating",
  "Ablesedatum:": "Reading date:",
  "Zählerstand:": "Meter reading:",
  "Zählerfoto-Nachweis:": "Meter photo evidence:",
  "Notiz / Bemerkung:": "Note / comment:",
  "🔄 Neuer Zähler / Zählerwechsel (tatsächlichen Startstand eintragen)": "🔄 New meter / replacement (record actual starting reading)",
  "Zählerstand speichern": "Save reading",
  "📊 Ablesungen pro Monat": "📊 Readings by month",
  "📈 Jahres-Prognose, Tageskosten & Vorjahr": "📈 Annual forecast, daily costs and previous year",
  "📋 Zählerstände & Verlauf": "📋 Meter readings and history",
  "Alle Zähler anzeigen": "Show all meters",
  "⚡ Strom (HT)": "⚡ Electricity (day)",
  "🌙 Strom (NT)": "🌙 Electricity (night)",
  "💧 Kaltwasser": "💧 Cold water",
  "🔥 Warmwasser": "🔥 Hot water",
  "💡 Clevere Energiespar-Tipps & Top-Gadgets": "💡 Energy-saving tips and useful equipment",
  "1. Standby-Verbrauch eliminieren": "1. Eliminate standby consumption",
  "2. LED-Beleuchtung konsequent umstellen": "2. Switch to LED lighting",
  "3. Heizkörperthermostate smart steuern": "3. Control radiator thermostats",
  "4. Infrarot-Thermometer für Kältebrücken": "4. Use infrared thermometers to find cold spots"
 },
 "parking": {
  "Parkplatz-Merker": "Parking spot saver",
  "📖 Hilfe & Anleitungen": "📖 Help and guides",
  "Wie übernehme ich Parkgebühren mit Toolya Connect?": "How do I transfer parking fees via Toolya Connect?",
  "Wie funktioniert der Parkscheiben-Modus?": "How does parking-disc mode work?",
  "Wie nutze ich den GPS-Standort & die Navigation?": "How do I use GPS location and navigation?",
  "Wie nutze ich den PDF-Report?": "How do I use the PDF report?",
  "Nicht gespeichert": "Not saved",
  "⏱️ Parkzeit im Blick behalten": "⏱️ Keep track of parking time",
  "30 Min": "30 min",
  "1 Std": "1 hr",
  "2 Std": "2 hrs",
  "🔵 Parkscheibe": "🔵 Parking disc",
  "Timer stoppen / zurücksetzen": "Stop / reset timer",
  "📝 Parkplatz speichern": "📝 Save parking space",
  "⭐ Bahnhof": "⭐ Station",
  "⭐ Arbeit": "⭐ Work",
  "⭐ Supermarkt": "⭐ Supermarket",
  "Parkplatz speichern": "Save parking space",
  "📋 Gespeicherte Parkplätze und Gebühren": "📋 Saved parking spots and fees",
  "Gesamte Historie anzeigen": "Show full history",
  "Aktueller Monat": "Current month",
  "Aktuelles Jahr": "Current year",
  "🛒 Nützliches PKW- & Park-Zubehör auf Amazon": "🛒 Useful driving and parking equipment on Amazon"
 },
 "pet-health": {
  "Tiergesundheit – Gesundheitstagebuch für Haustiere": "Pet health – health diary",
  "🚨 Anstehende Impf-Abläufe & Fristen": "🚨 Upcoming boosters and deadlines",
  "🐕 1. Haustier-Profil & Tierarzt-Praxis": "🐕 1. Pet profile and vet practice",
  "Bei TASSO / Findefix registriert": "Registered with TASSO / Findefix",
  "Profilbild:": "Profile photo:",
  "Foto des EU-Heimtierausweises:": "EU pet passport photo:",
  "Haustier speichern": "Save pet",
  "💉 2. Gesundheits-Eintrag & Tagebuch": "💉 2. Health record and diary",
  "-- Haustier wählen --": "-- Select pet --",
  "💉 Impfung": "💉 Vaccination",
  "🪱 Entwurmung / Parasiten": "🪱 Deworming / parasites",
  "💊 Medikament / Behandlung": "💊 Medication / treatment",
  "⚖️ Gewicht": "⚖️ Weight",
  "🏥 Tierarztbesuch / Rechnung": "🏥 Vet visit / invoice",
  "📓 Tagebuch / Notiz": "📓 Diary / note",
  "📝 Sonstiges": "📝 Other",
  "Impfung gültig bis / Nächste Auffrischung:": "Vaccination valid until / next booster:",
  "Beleg / Rechnung (Foto optional):": "Receipt / invoice (photo optional):",
  "Eintrag speichern": "Save record",
  "💊 Haustier-Apotheke & Medikamenten-Vorrat": "💊 Pet pharmacy and medication supply",
  "Hinzufügen": "Add",
  "🐾 Meine Haustiere": "🐾 My pets",
  "📋 Kalender & Kosten": "📋 Calendar and costs",
  "Alle Haustiere anzeigen": "Show all pets",
  "Schließen": "Close"
 }
});
const extraFormCommon=Object.freeze({
 "Erneut versuchen": "Try again",
 "⚙️ Einstellungen und Konto": "⚙️ Settings and account",
 "⚙️ Einstellungen & Konto": "⚙️ Settings and account",
 "⚙️ Einstellungen & Cloud-Konto": "⚙️ Settings and cloud account",
 "☁️ Mein Konto": "☁️ My account",
 "☁️ Konto": "☁️ Account",
 "☁️ Cloud-Konto": "☁️ Cloud account",
 "E-Mail-Adresse": "Email address",
 "Passwort": "Password",
 "Anmelden": "Sign in",
 "Registrieren": "Register",
 "Abmelden": "Sign out",
 "Schließen": "Close",
 "Abbrechen": "Cancel",
 "Speichern": "Save",
 "✕ Schließen": "✕ Close",
 "✕ Abbrechen": "✕ Cancel",
 "👤 Registrieren": "👤 Register",
 "🔑 Anmelden": "🔑 Sign in",
 "🚪 Abmelden": "🚪 Sign out",
 "💾 Daten sichern und wiederherstellen": "💾 Back up and restore data",
 "💾 Datensicherung (Backup & Wiederherstellung)": "💾 Backup and restore",
 "📥 Sicherung": "📥 Backup",
 "Datum:": "Date:",
 "Notiz:": "Note:",
 "Bezeichnung:": "Description:",
 "Kategorie:": "Category:",
 "Löschen": "Delete",
 "Bearbeiten": "Edit"
});
function applyAdditionalToolCopy(document,tool,language){
 const dictionary=extraFormCopy[tool];if(!dictionary)return;
 const selectors='#main-content label,#main-content button,#main-content option,#main-content h1,#main-content h2,#main-content h3,#main-content h4,#main-content summary,#settingsModal label,#settingsModal button,#settingsModal h2,#settingsModal h3,#helpModal h2,#helpModal h3,#helpModal summary';
 for(const element of document.querySelectorAll(selectors)){
  if(element.children.length||element.isContentEditable||element.closest('[contenteditable="true"]'))continue;
  const original=originals.get(element)?.get('text')??element.textContent;
  const key=original.trim();
  const en=dictionary[key]??extraFormCommon[key];
  if(en!==undefined)updateElement(element,original.replace(key,en),null,language);
 }
 for(const element of document.querySelectorAll('#main-content input,#main-content textarea,#settingsModal input')){
  for(const attribute of ['placeholder','aria-label','title']){
   const old=originals.get(element)?.get(attribute)??element.getAttribute(attribute);
   if(!old)continue;
   const en=dictionary[old]??extraFormCommon[old];
   if(en!==undefined)updateElement(element,en,attribute,language);
  }
 }
}
const templateCopyAttributes=[['data-tool-en',null],['data-tool-en-aria-label','aria-label'],['data-tool-en-title','title'],['data-tool-en-placeholder','placeholder'],['data-tool-en-alt','alt']];

function applyTemplateCopy(document,language){
 for(const [marker,attribute] of templateCopyAttributes){
  for(const element of document.querySelectorAll('['+marker+']')){
   if(element.isContentEditable||element.closest('[contenteditable]')||(!attribute&&element.children.length))continue;
   const translation=element.getAttribute(marker);
   const current=attribute?element.getAttribute(attribute):element.textContent;
   const source=originals.get(element)?.get(attribute||'text')??current;
   if(current!==source&&current!==translation)continue;
   if(current!==(language==='en'?translation:source))updateElement(element,translation,attribute,language);
  }
 }
}

/* Preserve inline emphasis in the budget guide: translate only known authored
   text nodes, never replace HTML, links, controls or user-generated content. */
const budgetGuideFragments=Object.freeze({
 'Wähle ':'Choose ',
 'Ausgabe':'Expense',
 'Einnahme':'Income',
 ' oder erstelle wiederkehrende ':' or create recurring ',
 'Fixkosten/Abos':'Fixed costs/subscriptions',
 '. Gib Betrag, Datum, Kategorie und Zahlungsart ein. Alle Monats-Salden und Fixkosten-Quoten werden live berechnet.':'. Enter the amount, date, category and payment method. Monthly balances and recurring-cost ratios update automatically.',
 'Scanne Belege mit dem ':'Scan receipts with the ',
 'OCR-Scanner':'OCR scanner',
 ', lade mehrere Dokumentenfotos hoch oder schärfe verblasste Thermobons über den Helligkeits-/Kontrastfilter nach.':', upload multiple document photos or improve faded thermal receipts with the brightness and contrast controls.'
});
const budgetGuideOriginals=new WeakMap();
function applyBudgetGuideFragments(document,language){
 const guide=document.querySelector('#guideSection');
 if(!guide)return;
 const paragraphs=guide.querySelectorAll('p');
 for(const index of [0,2]){
  const paragraph=paragraphs[index];
  if(!paragraph)continue;
  const walker=document.createTreeWalker(paragraph,4);
  while(walker.nextNode()){
   const node=walker.currentNode;
   if(!budgetGuideOriginals.has(node))budgetGuideOriginals.set(node,node.nodeValue);
   const original=budgetGuideOriginals.get(node);
   if(Object.hasOwn(budgetGuideFragments,original))
    node.nodeValue=language==='en'?budgetGuideFragments[original]:original;
  }
 }
}

export /* Browser tab titles are application-owned UI, not persisted records.
   Only replace exact known titles to avoid overwriting runtime/custom titles. */
const toolPageTitles=Object.freeze({
 moving:['Umzugskisten und Inventarliste | Toolya','Moving boxes and inventory | Toolya'],
 housemates:['WG-Organisator mit Haushaltsbuch | Toolya','Roommate organiser and household budget | Toolya'],
 plants:['Pflanzenpflege-App mit Gießplan | Toolya','Plant care and watering planner | Toolya'],
 baking:['Backform-Umrechner & Rezeptrechner | Toolya','Cake pan and recipe calculator | Toolya'],
 budget:['Haushaltsbuch mit Kassenbon-Scanner | Toolya','Household budget and receipt scanner | Toolya'],
 car:['Autokosten-Rechner | Toolya','Car expense calculator | Toolya'],
 loans:['Verliehene Gegenstände verwalten | Toolya','Track lent items | Toolya'],
 'pet-health':['Tiergesundheit – Gesundheitstagebuch für Haustiere | Toolya','Pet health journal | Toolya'],
 parking:['Parkplatz-Merker | Toolya','Parking spot tracker | Toolya'],
 meters:['Zählerstände erfassen: Strom, Gas & Wasser | Toolya','Meter readings: electricity, gas and water | Toolya']
});
function applyToolPageTitle(document,tool,language){
 const titles=toolPageTitles[tool];
 if(!titles || (language!=='en' && language!=='de'))return;
 if(document.title===titles[0] || document.title===titles[1]) document.title=titles[language==='en'?1:0];
}

export function applyToolInterfaceLocale(document,tool,language){
 applyToolPageTitle(document,tool,language);
 for(const [selector,translation,attribute,attributeTranslation] of [...common,...(toolTranslations[tool]||[]),...(extendedFormTranslations[tool]||[])]){
  const translated=attribute?attributeTranslation:translation;
  for(const element of document.querySelectorAll(selector)){
   updateElement(element,translated,attribute,language);
  }
 }
 applyStaticFormCopy(document,tool,language);
 applyAdditionalToolCopy(document,tool,language);
 applyKnownB3Accessibility(document,language);
 applyB3NavigationCopy(document,tool,language);
 applyB3EditorCopy(document,tool,language);
 applyToolHelpBodyCopy(document,tool,language);
 applyToolAlertCopy(document,tool,language);
 applyToolParagraphCopy(document,tool,language);
 if(tool==='budget')applyBudgetGuideFragments(document,language);
 applyToolSmallCopy(document,tool,language);
 applyToolAccessibilityCopy(document,tool,language);
 applyTemplateCopy(document,language);
 if(tool==='baking'){
  applyBackstudioCopy(document,language);
  applyBakingMixedTextCopy(document,language);
 }
}

/* Only application-owned, source-exact browser-dialog copy. Dynamic user values,
   email addresses, backend errors and machine-readable exports are untouched. */
const dialogCopy = Object.freeze({
 moving: {
  "Dieser Standort enthält Kisten aus einem aktiven Umzug. Bitte den Umzug erst abschließen.": "This location contains boxes assigned to an active move. Finish the move first.",
  "Diese Kiste ist einem aktiven Umzug zugeordnet. Bitte den Umzug erst abschließen.": "This box is assigned to an active move. Finish the move first.",
  'Dieses Backup enthält keine Umzugsprojekte. Die bestehenden Umzugsplanungen würden verloren gehen. Trotzdem fortfahren?':'This backup contains no moving projects. Restoring it would remove your existing moving plans. Continue?',
  'Vor dem Import bitte eine aktuelle Sicherung herunterladen und überprüfen.':'Before importing, download and check a current backup.',
  'Hast du die aktuelle Sicherung erfolgreich heruntergeladen?':'Did you successfully download the current backup?',
  'Layout konnte nicht gespeichert werden.':'Could not save the dashboard layout.',
  'Angemeldet. Dein Konto ist einsatzbereit.':'Signed in. Your account is ready.',
  'Anfrage verarbeitet. Falls eine Bestätigung erforderlich ist, prüfe dein E-Mail-Postfach und bestätige die Adresse. Melde dich danach an.':'Request processed. If confirmation is required, check your inbox and verify your email address, then sign in.',
  "Backup zu groß (maximal 20 MB).": "Backup too large (maximum 20 MB).",
  "Ungültiges Backup-Format.": "Invalid backup format.",
  "Backup importieren? Vorhandene Daten werden ersetzt.": "Import backup? Existing data will be replaced.",
  "Fehler beim Lesen der Datei.": "Could not read the file.",
  "Backup erfolgreich importiert!": "Backup imported successfully!",
  "Backup-Datei konnte nicht gelesen werden.": "The backup file could not be read.",
  "Der QR-Scanner konnte nicht geladen werden. Bitte versuche es erneut.": "The QR scanner could not be loaded. Please try again.",
  "Kamera-Zugriff fehlgeschlagen oder nicht unterstützt.": "Camera access failed or is not supported.",
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
  "Private WG-Kopie erstellt.\nDer alte WG-Link bleibt bestehen.\nBitte teile ab jetzt nur den neuen Link mit freigegebenen Mitgliedern.": "Private household copy created.\nThe old household link stays active.\nFrom now on, share only the new link with approved members.",
  "Die WG wurde inzwischen an anderer Stelle geändert. Sichere deine Änderungen auf diesem Gerät, bevor du die Seite neu lädst.": "The household was changed elsewhere. Back up your changes on this device before reloading.",
  "WG-Änderungen online gespeichert.": "Household changes saved online.",
  "Bitte zuerst in den Einstellungen anmelden.": "Sign in through settings first.",
  "Mitgliederzugriff entfernt.": "Member access revoked.",
  "Mitgliederzugriff erteilt. Der WG-Link kann jetzt geteilt werden.": "Member access granted. You can now share the household link.",
  "Die WG-Änderungen sind auf diesem Gerät gespeichert. Die Online-Sicherung ist noch nicht bestätigt. Prüfe deine Verbindung und nutze die manuelle Synchronisation.": "Household changes are saved on this device. The online backup is not confirmed yet. Check your connection and sync manually.",
  "Deine WG-Änderungen sind auf diesem Gerät gespeichert. Die Online-Sicherung ist noch nicht bestätigt. Prüfe deine Verbindung und nutze die manuelle Synchronisation.": "Your household changes are saved on this device. The online backup is not confirmed yet. Check your connection and sync manually.",
  "WLAN-Passwort (wird nicht gespeichert):": "Wi-Fi password (not saved):",
  "WLAN-Name (SSID):": "Wi-Fi network name (SSID):",
  "Private WG-Kopie erstellt.\\nDer alte WG-Link bleibt bestehen.\\nBitte teile ab jetzt nur den neuen Link mit freigegebenen Mitgliedern.": "Private household copy created.\\nThe old household link remains active.\\nFrom now on, only share the new link with authorized members.",
  'Layout konnte nicht gespeichert werden.':'Could not save the dashboard layout.',
  "Hinweis: Diese ältere WG verwendet einen ungeschützten Link-Speicher. Wer die WG-ID kennt, kann die Daten möglicherweise lesen oder verändern. Für neue WGs steht geschützter Kontospeicher zur Verfügung.": "Notice: This older household uses unprotected link-based storage. Anyone who knows the household ID may be able to read or change the data. Protected account storage is available for new households.",
  "🔗 WG-Link kopiert! Teile ihn nur mit berechtigten Personen.": "🔗 Household link copied! Share it only with authorized people.",
  "WG-Link manuell kopieren:": "Copy household link manually:",
  "Zutaten übernommen!": "Ingredients added!",
  "Es muss mindestens ein Mitglied in der WG verbleiben!": "At least one household member must remain.",
  "Import abgebrochen oder von diesem Browser auf dem Gerät eingeschränkt.": "Import cancelled or restricted by this browser on this device.",
  "ℹ️ Der direkte Handy-Kontakte-Zugriff wird von deinem aktuellen Browser/Gerät nicht direkt unterstützt (wird meist auf mobilen Android/iOS Chrome- oder Web-Browsern unterstützt). Du kannst Kontakte aber ganz bequem manuell über das Formular eintragen.": "ℹ️ Direct access to phone contacts is not supported by this browser or device. You can add contacts manually using the form.",
  "Ungültige Benutzer-ID. Das Mitglied muss sich zuerst registrieren.": "Invalid user ID. The member must register first.",
  "Der Eigentümer ist bereits berechtigt.": "The owner already has access.",
  "Keine WG-ID aktiv.": "No active household ID.",
  "Speicherkonflikt: Die WG wurde andernorts geändert. Lokale Änderungen bleiben erhalten; bitte vor dem Neuladen sichern.": "Save conflict: The household was changed elsewhere. Local changes are kept; back them up before reloading.",
  "Deine Änderungen sind auf diesem Gerät gespeichert. Die Online-Sicherung steht noch aus.": "Your changes are saved on this device. Online backup is still pending.",
  "Cloud-Daten neu laden? Nicht synchronisierte lokale Änderungen können verloren gehen.": "Reload cloud data? Unsynced local changes may be lost.",
  "Deine WG-Daten wurden neu geladen.": "Your household data was reloaded.",
  "Die WG-Daten konnten gerade nicht neu geladen werden. Prüfe deine Verbindung und versuche es erneut.": "Household data could not be reloaded. Check your connection and try again.",
  "Keine gültige WG-ID vorhanden.": "No valid household ID available.",
  "WG-Cloud nicht erreichbar. Lokale Daten dieser WG werden angezeigt; Änderungen können derzeit nicht zuverlässig synchronisiert werden.": "Household cloud unavailable. Local household data is shown; changes cannot currently be synced reliably.",
  "Bitte mindestens einen Titel angeben!": "Enter at least a title.",
  "Bitte Titel und Datum angeben!": "Enter a title and date.",
  "Bitte Pflichtfelder ausfüllen!": "Fill in the required fields.",
  "Bitte Belegfoto auswählen!": "Select a receipt photo.",
  "Bitte mindestens Titel, Datum und Betrag angeben!": "Enter at least a title, date and amount.",
  "Der automatische Schuldenausgleich ist vorübergehend deaktiviert, damit keine Buchungen gelöscht werden. Bitte die vorgeschlagenen Überweisungen manuell durchführen und die Buchungen zur Dokumentation aufbewahren.": "Automatic debt settlement is temporarily disabled to prevent transactions from being deleted. Make the suggested transfers manually and keep the records for documentation.",
  "Bitte Titel und Zielbetrag angeben!": "Enter a title and target amount.",
  "Bitte zuerst ein WG-Mitglied anlegen.": "Add a household member first.",
  "Bitte Aufgabe angeben!": "Enter a task.",
  "Bitte Bezeichnung eingeben!": "Enter a name or description.",
  "Bitte Name und gültige Kosten angeben!": "Enter a name and valid cost.",
  "Bitte mindestens einen Vornamen angeben!": "Enter at least a first name.",
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
  "Das Foto konnte nicht gelesen werden.": "Could not read the photo.",
  "Pflanzenfoto konnte nicht verarbeitet werden. Nichts gespeichert.": "The plant photo could not be processed. Nothing was saved.",
  "Es konnte keine eindeutige Pflanzen-ID erzeugt werden.": "Could not generate a unique plant ID.",
  "Layout konnte nicht gespeichert werden. Bitte Browser-Speicher prüfen.": "Could not save the layout. Check your browser storage.",
  'Angemeldet. Dein Konto ist einsatzbereit.':'Signed in. Your account is ready.',
  'Anfrage verarbeitet. Falls eine Bestätigung erforderlich ist, prüfe dein E-Mail-Postfach und bestätige die Adresse. Melde dich danach an.':'Request processed. If confirmation is required, check your inbox and verify your email address, then sign in.',
  "Bitte Name und gültiges Gießdatum angeben!": "Enter a name and valid watering date.",
  "Bitte ein Gießintervall zwischen 1 und 3650 Tagen eingeben.": "Enter a watering interval between 1 and 3650 days.",
  "Bitte ein gültiges Vermehrungsdatum eingeben.": "Enter a valid propagation date.",
  "Das Foto konnte nicht verarbeitet werden. Bitte ein anderes Bild auswählen.": "The photo could not be processed. Select a different image.",
  "Das Foto konnte nicht geöffnet werden. Bitte ein gültiges Bild auswählen.": "The photo could not be opened. Select a valid image.",
  "Es konnte keine gültige Pflanzen-ID erzeugt werden.": "A valid plant ID could not be generated.",
  "Pflanze nicht gefunden. Es wurde nichts gelöscht.": "Plant not found. Nothing was deleted.",
  "⚠️ Pflanze wirklich löschen?": "⚠️ Delete this plant?",
  "Ungültige Pflanzen-ID. Die Änderungen wurden nicht gespeichert.": "Invalid plant ID. Changes were not saved.",
  "Pflanze nicht gefunden. Die Änderungen wurden nicht gespeichert.": "Plant not found. Changes were not saved.",
  "Bitte einen Pflanzennamen eingeben.": "Enter a plant name.",
  "Bitte ein gültiges Gießdatum eingeben.": "Enter a valid watering date.",
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
  "Layout konnte nicht gespeichert werden.": "Could not save the dashboard layout.",
  'Angemeldet. Dein Konto ist einsatzbereit.':'Signed in. Your account is ready.',
  'Anfrage verarbeitet. Falls eine Bestätigung erforderlich ist, prüfe dein E-Mail-Postfach und bestätige die Adresse. Melde dich danach an.':'Request processed. If confirmation is required, check your inbox and verify your email address, then sign in.',
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
/* Shared authentication and file-operation error prefixes are translated without
   modifying the trailing server diagnostic, user-entered text or identifiers. */
/* Validated app-owned browser dialogs in six additional tools; details from
   server responses and free-form user content pass through unchanged. */
const additionalDialogCopy=Object.freeze({
 "budget": {
  "Eine Buchung mit gleichem Datum, Titel, Betrag und Typ existiert bereits.\n\nTrotzdem erneut speichern?": "A transaction with the same date, title, amount and type already exists.\n\nSave another copy anyway?",
  "Bitte E-Mail und Passwort eingeben.": "Enter your email address and password.",
  "Bitte bestätigen, dass die Cloud-Sicherung tatsächlich heruntergeladen und sicher gespeichert wurde.": "Confirm that the cloud backup has been downloaded and stored safely.",
  "Vorhandene Gerätedaten in dein Toolya-Konto übernehmen? Cloud-Daten werden niemals überschrieben. Auf gemeinsam genutzten Geräten bitte zuerst die Zugehörigkeit der Daten prüfen.": "Import existing device data into your Toolya account? Cloud data will never be overwritten. On shared devices, first check who owns the data.",
  "Es gibt sowohl Cloud-Daten als auch Gerätedaten. Die Cloud bleibt maßgeblich; lokale Daten werden nicht zusammengeführt oder gelöscht. Lokale Daten jetzt sichern und ausschließlich die Cloud-Daten verwenden?": "Both cloud and device data exist. Cloud data remains authoritative; local data will not be merged or deleted. Back up device data now and use cloud data only?",
  "Sicherung wurde zum Download angeboten. Bitte erst nach erfolgreichem Speichern bestätigen.": "The backup download was offered. Confirm only after it has been saved successfully.",
  "Registrierung erfolgreich.": "Registration successful.",
  "Registrierung erfolgreich!": "Registration successful!",
  "Erfolgreich angemeldet!": "Signed in successfully!",
  "Abgemeldet.": "Signed out.",
  "Backup zu groß (maximal 20 MB).": "Backup too large (maximum 20 MB).",
  "Ungültiges Backup-Format.": "Invalid backup format.",
  "Backup erfolgreich importiert!": "Backup imported successfully!",
  "Backup-Datei konnte nicht gelesen werden.": "The backup file could not be read.",
  "Cloud- und Gerätedaten vorhanden. Cloud-Bestand behalten und lokale Daten separat sichern?": "Cloud and device data both exist. Keep cloud data and back up local data separately?",
  "Bitte bestätigen, dass die Sicherung heruntergeladen wurde.": "Confirm that the backup was downloaded.",
  "Bild konnte nicht verarbeitet werden. Nichts gespeichert.": "The image could not be processed. Nothing was saved.",
  "Der QR-Code konnte nicht geladen werden. Bitte versuche es erneut.": "The QR code could not be loaded. Try again.",
  "Gespeichert": "Saved",
  "Bitte nur JPG-, PNG-, GIF- oder WebP-Bilder auswählen. Bereits vorhandene Belegbilder bleiben erhalten.": "Select JPG, PNG, GIF or WebP images only. Existing receipt images will be kept.",
  "Die ausgewählten Belegbilder sind zusammen zu groß (maximal 4 MB). Bitte kleinere Fotos auswählen. Bereits vorhandene Belegbilder bleiben erhalten.": "The selected receipt images are too large together (maximum 4 MB). Choose smaller photos. Existing receipt images will be kept.",
  "Der Browser konnte den Bildleser nicht starten. Bitte die Bildauswahl erneut versuchen.": "The browser could not start the image reader. Select the images again.",
  "Ein Belegbild hat ein ungültiges Format. Bitte die Bildauswahl erneut versuchen.": "A receipt image has an invalid format. Choose the images again.",
  "Das erste Belegbild konnte nicht verarbeitet werden. Bitte erneut auswählen.": "The first receipt image could not be processed. Select it again.",
  "Das erste Belegbild konnte nicht geöffnet werden. Bitte erneut auswählen.": "The first receipt image could not be opened. Select it again.",
  "Ein Belegbild konnte nicht gelesen werden. Bitte die Bildauswahl erneut versuchen.": "A receipt image could not be read. Choose the images again.",
  "Ein Belegbild konnte nicht geöffnet werden. Bitte die Bildauswahl erneut versuchen.": "A receipt image could not be opened. Choose the images again.",
  "Die Bildanpassung ist fehlgeschlagen. Bitte das Belegfoto erneut auswählen.": "Image adjustment failed. Select the receipt photo again.",
  "Bitte wähle zuerst ein Belegfoto aus!": "Select a receipt photo first.",
  "Mindestens ein Belegbild konnte nicht geladen werden. Bitte Bilder erneut auswählen oder entfernen.": "At least one receipt image could not be loaded. Select or remove the images again.",
  "Die Belegbilder werden noch geladen. Bitte kurz warten und erneut speichern.": "The receipt images are still loading. Try saving again.",
  "Bitte Titel, gültiges Kaufdatum und einen positiven Betrag angeben!": "Enter a title, valid purchase date and positive amount.",
  "Bitte gültige Garantie-, Rückgabe- und Lebensdauerwerte angeben.": "Enter valid warranty, return period and useful-life values.",
  "Diese Buchung ist nicht mehr vorhanden. Die Änderungen wurden nicht gespeichert.": "This transaction no longer exists. Your changes were not saved.",
  "Eine Buchung mit gleichem Datum, Titel, Betrag und Typ existiert bereits.\\n\\nTrotzdem erneut speichern?": "A transaction with the same date, title, amount and type already exists.\\n\\nSave another anyway?",
  "⚠️ Diese Buchung wirklich löschen?": "⚠️ Delete this transaction?",
  "Bitte gültigen Titel, positiven Zielbetrag und Startbetrag ab 0 € eingeben!": "Enter a valid title, a positive target amount and a starting amount of at least €0.",
  "Sparziel löschen?": "Delete this savings goal?",
  "Für diesen Beleg fehlt ein gültiges Kaufdatum oder eine Garantiedauer.": "This receipt lacks a valid purchase date or warranty duration.",
  "Keine Buchungen für den CSV-Export vorhanden.": "No transactions available for CSV export.",
  "Keine steuerrelevanten Buchungen gefunden!": "No tax-relevant transactions found.",
  "Backup in Toolya Cloud gespeichert.": "Backup saved in Toolya Cloud."
 },
 "car": {
  "Bitte E-Mail und Passwort eingeben.": "Enter your email address and password.",
  "Bitte bestätigen, dass die Cloud-Sicherung tatsächlich heruntergeladen und sicher gespeichert wurde.": "Confirm that the cloud backup has been downloaded and stored safely.",
  "Vorhandene Gerätedaten in dein Toolya-Konto übernehmen? Cloud-Daten werden niemals überschrieben. Auf gemeinsam genutzten Geräten bitte zuerst die Zugehörigkeit der Daten prüfen.": "Import existing device data into your Toolya account? Cloud data will never be overwritten. On shared devices, first check who owns the data.",
  "Es gibt sowohl Cloud-Daten als auch Gerätedaten. Die Cloud bleibt maßgeblich; lokale Daten werden nicht zusammengeführt oder gelöscht. Lokale Daten jetzt sichern und ausschließlich die Cloud-Daten verwenden?": "Both cloud and device data exist. Cloud data remains authoritative; local data will not be merged or deleted. Back up device data now and use cloud data only?",
  "Sicherung wurde zum Download angeboten. Bitte erst nach erfolgreichem Speichern bestätigen.": "The backup download was offered. Confirm only after it has been saved successfully.",
  "Registrierung erfolgreich.": "Registration successful.",
  "Registrierung erfolgreich!": "Registration successful!",
  "Erfolgreich angemeldet!": "Signed in successfully!",
  "Abgemeldet.": "Signed out.",
  "Backup zu groß (maximal 20 MB).": "Backup too large (maximum 20 MB).",
  "Ungültiges Backup-Format.": "Invalid backup format.",
  "Backup erfolgreich importiert!": "Backup imported successfully!",
  "Backup-Datei konnte nicht gelesen werden.": "The backup file could not be read.",
  "Cloud- und Gerätedaten vorhanden. Cloud-Bestand behalten und lokale Daten separat sichern?": "Cloud and device data both exist. Keep cloud data and back up local data separately?",
  "Bitte bestätigen, dass die Sicherung heruntergeladen wurde.": "Confirm that the backup was downloaded.",
  "Bild konnte nicht verarbeitet werden. Nichts gespeichert.": "The image could not be processed. Nothing was saved.",
  "Der QR-Code konnte nicht geladen werden. Bitte versuche es erneut.": "The QR code could not be loaded. Try again.",
  "Gespeichert": "Saved",
  "Bitte einen Fahrzeugnamen eingeben!": "Enter a vehicle name.",
  "Aktuellen Kilometerstand aktualisieren:": "Update current odometer reading:",
  "Bild konnte nicht verarbeitet werden.": "The image could not be processed.",
  "⚠️ Möchtest du dieses Fahrzeug und alle zugehörigen Einträge wirklich unwiderruflich löschen?": "⚠️ Permanently delete this vehicle and all associated entries?",
  "Bitte ein Fahrzeug wählen!": "Select a vehicle.",
  "Bitte Fahrzeug, Datum und Bezeichnung angeben!": "Enter a vehicle, date and description.",
  "Eintrag nicht bestätigt. Bitte den Cloud-Datenstand prüfen, bevor du es erneut versuchst.": "Entry not confirmed. Check the cloud data before trying again.",
  "Beleg konnte nicht verarbeitet werden. Bitte eine andere Bilddatei wählen oder ohne Beleg speichern.": "The receipt could not be processed. Choose a different image or save without a receipt.",
  "Beleg konnte nicht verarbeitet werden. Bitte erneut versuchen.": "The receipt could not be processed. Try again.",
  "Bitte Bezeichnung und Datum eingeben!": "Enter a description and date.",
  "⚠️ Diesen Eintrag wirklich löschen?": "⚠️ Delete this entry?",
  "Ungültige Reifendaten im Backup.": "Invalid tyre data in the backup."
 },
 "loans": {
  "Bitte E-Mail und Passwort eingeben.": "Enter your email address and password.",
  "Bitte bestätigen, dass die Cloud-Sicherung tatsächlich heruntergeladen und sicher gespeichert wurde.": "Confirm that the cloud backup has been downloaded and stored safely.",
  "Vorhandene Gerätedaten in dein Toolya-Konto übernehmen? Cloud-Daten werden niemals überschrieben. Auf gemeinsam genutzten Geräten bitte zuerst die Zugehörigkeit der Daten prüfen.": "Import existing device data into your Toolya account? Cloud data will never be overwritten. On shared devices, first check who owns the data.",
  "Es gibt sowohl Cloud-Daten als auch Gerätedaten. Die Cloud bleibt maßgeblich; lokale Daten werden nicht zusammengeführt oder gelöscht. Lokale Daten jetzt sichern und ausschließlich die Cloud-Daten verwenden?": "Both cloud and device data exist. Cloud data remains authoritative; local data will not be merged or deleted. Back up device data now and use cloud data only?",
  "Sicherung wurde zum Download angeboten. Bitte erst nach erfolgreichem Speichern bestätigen.": "The backup download was offered. Confirm only after it has been saved successfully.",
  "Registrierung erfolgreich.": "Registration successful.",
  "Registrierung erfolgreich!": "Registration successful!",
  "Erfolgreich angemeldet!": "Signed in successfully!",
  "Abgemeldet.": "Signed out.",
  "Backup zu groß (maximal 20 MB).": "Backup too large (maximum 20 MB).",
  "Ungültiges Backup-Format.": "Invalid backup format.",
  "Backup erfolgreich importiert!": "Backup imported successfully!",
  "Backup-Datei konnte nicht gelesen werden.": "The backup file could not be read.",
  "Cloud- und Gerätedaten vorhanden. Cloud-Bestand behalten und lokale Daten separat sichern?": "Cloud and device data both exist. Keep cloud data and back up local data separately?",
  "Bitte bestätigen, dass die Sicherung heruntergeladen wurde.": "Confirm that the backup was downloaded.",
  "Bild konnte nicht verarbeitet werden. Nichts gespeichert.": "The image could not be processed. Nothing was saved.",
  "Der QR-Code konnte nicht geladen werden. Bitte versuche es erneut.": "The QR code could not be loaded. Try again.",
  "Gespeichert": "Saved",
  "Bestehende Verleihdaten in dein Toolya-Konto übernehmen? Vorhandene Cloud-Daten werden nicht überschrieben.": "Import existing lending data into your Toolya account? Existing cloud data will not be overwritten.",
  "Bitte einen Namen eingeben!": "Enter a name.",
  "Bitte eine Bezeichnung für den Gegenstand angeben!": "Enter a description of the item.",
  "Diesen Stamm-Gegenstand wirklich löschen?": "Delete this inventory item?",
  "Bitte Namen des Gegenstands eingeben:": "Enter the item's name:",
  "Bitte Person und Ausleihdatum angeben!": "Enter a borrower and loan date.",
  "⚠️ Diesen Eintrag wirklich löschen?": "⚠️ Delete this entry?",
  "Bitte Gegenstand, Person und Ausleihdatum angeben!": "Enter an item, borrower and loan date.",
  "Ungültiges Rückgabedatum.": "Invalid return date."
 },
 "meters": {
  "Bitte E-Mail und Passwort eingeben.": "Enter your email address and password.",
  "Bitte bestätigen, dass die Cloud-Sicherung tatsächlich heruntergeladen und sicher gespeichert wurde.": "Confirm that the cloud backup has been downloaded and stored safely.",
  "Vorhandene Gerätedaten in dein Toolya-Konto übernehmen? Cloud-Daten werden niemals überschrieben. Auf gemeinsam genutzten Geräten bitte zuerst die Zugehörigkeit der Daten prüfen.": "Import existing device data into your Toolya account? Cloud data will never be overwritten. On shared devices, first check who owns the data.",
  "Es gibt sowohl Cloud-Daten als auch Gerätedaten. Die Cloud bleibt maßgeblich; lokale Daten werden nicht zusammengeführt oder gelöscht. Lokale Daten jetzt sichern und ausschließlich die Cloud-Daten verwenden?": "Both cloud and device data exist. Cloud data remains authoritative; local data will not be merged or deleted. Back up device data now and use cloud data only?",
  "Sicherung wurde zum Download angeboten. Bitte erst nach erfolgreichem Speichern bestätigen.": "The backup download was offered. Confirm only after it has been saved successfully.",
  "Registrierung erfolgreich.": "Registration successful.",
  "Registrierung erfolgreich!": "Registration successful!",
  "Erfolgreich angemeldet!": "Signed in successfully!",
  "Abgemeldet.": "Signed out.",
  "Backup zu groß (maximal 20 MB).": "Backup too large (maximum 20 MB).",
  "Ungültiges Backup-Format.": "Invalid backup format.",
  "Backup erfolgreich importiert!": "Backup imported successfully!",
  "Backup-Datei konnte nicht gelesen werden.": "The backup file could not be read.",
  "Cloud- und Gerätedaten vorhanden. Cloud-Bestand behalten und lokale Daten separat sichern?": "Cloud and device data both exist. Keep cloud data and back up local data separately?",
  "Bitte bestätigen, dass die Sicherung heruntergeladen wurde.": "Confirm that the backup was downloaded.",
  "Bild konnte nicht verarbeitet werden. Nichts gespeichert.": "The image could not be processed. Nothing was saved.",
  "Der QR-Code konnte nicht geladen werden. Bitte versuche es erneut.": "The QR code could not be loaded. Try again.",
  "Gespeichert": "Saved",
  "Bestehende Zählerstände nach Sicherung in Toolya Cloud übernehmen?": "After backing up, import existing meter readings into Toolya Cloud?",
  "Bitte gültige, nichtnegative Tarife und einen positiven Gasfaktor eingeben.": "Enter valid non-negative tariffs and a positive gas factor.",
  "Bitte gültiges Ablesedatum und Zählerstand eingeben!": "Enter a valid reading date and meter value.",
  "⚠️ Achtung: Der Verbrauch seit der letzten Ablesung ist ungewöhnlich hoch (+50% über Schnitt)! Trotzdem speichern?": "⚠️ Consumption since the last reading is unusually high (50% above average). Save anyway?",
  "Zählerfoto konnte nicht verarbeitet werden. Nichts gespeichert.": "Meter photo could not be processed. Nothing was saved.",
  "Das Zählerfoto konnte nicht verarbeitet werden. Bitte ein anderes Bild auswählen.": "The meter photo could not be processed. Choose another image.",
  "Das Zählerfoto konnte nicht geöffnet werden.": "The meter photo could not be opened.",
  "Das Zählerfoto konnte nicht gelesen werden.": "The meter photo could not be read.",
  "⚠️ Diesen Zählerstand wirklich löschen?": "⚠️ Delete this meter reading?",
  "Keine Zählerstände zum Teilen vorhanden.": "No meter readings available to share.",
  "Zwischenablage nicht verfügbar. Text manuell kopieren:": "Clipboard unavailable. Copy the text manually:",
  "📋 Zählerstände in die Zwischenablage kopiert! Du kannst sie jetzt direkt in WhatsApp oder E-Mail einfügen.": "📋 Meter readings copied to the clipboard. You can paste them into WhatsApp or email.",
  "Backup importieren? Vorhandene Zählerstände und Tarife werden ersetzt.": "Import backup? Existing meter readings and tariffs will be replaced.",
  "Fehler beim Importieren der Datei.": "Error importing the file."
 },
 "parking": {
  "Bitte E-Mail und Passwort eingeben.": "Enter your email address and password.",
  "Bitte bestätigen, dass die Cloud-Sicherung tatsächlich heruntergeladen und sicher gespeichert wurde.": "Confirm that the cloud backup has been downloaded and stored safely.",
  "Vorhandene Gerätedaten in dein Toolya-Konto übernehmen? Cloud-Daten werden niemals überschrieben. Auf gemeinsam genutzten Geräten bitte zuerst die Zugehörigkeit der Daten prüfen.": "Import existing device data into your Toolya account? Cloud data will never be overwritten. On shared devices, first check who owns the data.",
  "Es gibt sowohl Cloud-Daten als auch Gerätedaten. Die Cloud bleibt maßgeblich; lokale Daten werden nicht zusammengeführt oder gelöscht. Lokale Daten jetzt sichern und ausschließlich die Cloud-Daten verwenden?": "Both cloud and device data exist. Cloud data remains authoritative; local data will not be merged or deleted. Back up device data now and use cloud data only?",
  "Sicherung wurde zum Download angeboten. Bitte erst nach erfolgreichem Speichern bestätigen.": "The backup download was offered. Confirm only after it has been saved successfully.",
  "Registrierung erfolgreich.": "Registration successful.",
  "Registrierung erfolgreich!": "Registration successful!",
  "Erfolgreich angemeldet!": "Signed in successfully!",
  "Abgemeldet.": "Signed out.",
  "Backup zu groß (maximal 20 MB).": "Backup too large (maximum 20 MB).",
  "Ungültiges Backup-Format.": "Invalid backup format.",
  "Backup erfolgreich importiert!": "Backup imported successfully!",
  "Backup-Datei konnte nicht gelesen werden.": "The backup file could not be read.",
  "Cloud- und Gerätedaten vorhanden. Cloud-Bestand behalten und lokale Daten separat sichern?": "Cloud and device data both exist. Keep cloud data and back up local data separately?",
  "Bitte bestätigen, dass die Sicherung heruntergeladen wurde.": "Confirm that the backup was downloaded.",
  "Bild konnte nicht verarbeitet werden. Nichts gespeichert.": "The image could not be processed. Nothing was saved.",
  "Der QR-Code konnte nicht geladen werden. Bitte versuche es erneut.": "The QR code could not be loaded. Try again.",
  "Gespeichert": "Saved",
  "Lokale Parkplatzdaten nach Sicherung in die Cloud übernehmen?": "After backing up, import local parking data into the cloud?",
  "Browser-Benachrichtigungen erlaubt. Lass diese Seite für den Timer geöffnet.": "Browser notifications allowed. Keep this page open for the timer.",
  "Dein Browser unterstützt keine Benachrichtigungen.": "Your browser does not support notifications.",
  "Parkscheibe gestellt auf nächste halbe Stunde + 2 Stunden Parkzeit!": "Parking disc set to the next half-hour plus two hours of parking time.",
  "Speichern nicht bestätigt. Cloud-Datenstand prüfen.": "Save not confirmed. Check the cloud data.",
  "Möchtest du diesen Eintrag wirklich löschen?": "Delete this entry?"
 },
 "pet-health": {
  "Bitte E-Mail und Passwort eingeben.": "Enter your email address and password.",
  "Bitte bestätigen, dass die Cloud-Sicherung tatsächlich heruntergeladen und sicher gespeichert wurde.": "Confirm that the cloud backup has been downloaded and stored safely.",
  "Vorhandene Gerätedaten in dein Toolya-Konto übernehmen? Cloud-Daten werden niemals überschrieben. Auf gemeinsam genutzten Geräten bitte zuerst die Zugehörigkeit der Daten prüfen.": "Import existing device data into your Toolya account? Cloud data will never be overwritten. On shared devices, first check who owns the data.",
  "Es gibt sowohl Cloud-Daten als auch Gerätedaten. Die Cloud bleibt maßgeblich; lokale Daten werden nicht zusammengeführt oder gelöscht. Lokale Daten jetzt sichern und ausschließlich die Cloud-Daten verwenden?": "Both cloud and device data exist. Cloud data remains authoritative; local data will not be merged or deleted. Back up device data now and use cloud data only?",
  "Sicherung wurde zum Download angeboten. Bitte erst nach erfolgreichem Speichern bestätigen.": "The backup download was offered. Confirm only after it has been saved successfully.",
  "Registrierung erfolgreich.": "Registration successful.",
  "Registrierung erfolgreich!": "Registration successful!",
  "Erfolgreich angemeldet!": "Signed in successfully!",
  "Abgemeldet.": "Signed out.",
  "Backup zu groß (maximal 20 MB).": "Backup too large (maximum 20 MB).",
  "Ungültiges Backup-Format.": "Invalid backup format.",
  "Backup erfolgreich importiert!": "Backup imported successfully!",
  "Backup-Datei konnte nicht gelesen werden.": "The backup file could not be read.",
  "Cloud- und Gerätedaten vorhanden. Cloud-Bestand behalten und lokale Daten separat sichern?": "Cloud and device data both exist. Keep cloud data and back up local data separately?",
  "Bitte bestätigen, dass die Sicherung heruntergeladen wurde.": "Confirm that the backup was downloaded.",
  "Bild konnte nicht verarbeitet werden. Nichts gespeichert.": "The image could not be processed. Nothing was saved.",
  "Der QR-Code konnte nicht geladen werden. Bitte versuche es erneut.": "The QR code could not be loaded. Try again.",
  "Gespeichert": "Saved",
  "Lokale Haustierdaten nach Sicherung in die Cloud übernehmen?": "After backing up, import local pet records into the cloud?",
  "Bitte einen Namen für das Haustier eingeben!": "Enter a name for the pet.",
  "⚠️ Möchtest du dieses Haustier und alle zugehörigen Einträge wirklich löschen?": "⚠️ Delete this pet and all associated entries?",
  "Bitte Medikamenten-Namen angeben!": "Enter a medication name.",
  "Bitte Haustier, Datum und Bezeichnung angeben!": "Enter a pet, date and description.",
  "Eintrag oder Beleg konnte nicht gespeichert werden. Cloud-Datenstand prüfen.": "Entry or receipt could not be saved. Check the cloud data.",
  "⚠️ Diesen Eintrag wirklich löschen?": "⚠️ Delete this entry?",
  "Backup importieren? Vorhandene Daten werden ersetzt.": "Import backup? Existing data will be replaced.",
  "Fehler beim Lesen der Datei.": "Error reading the file."
 }
});
const sharedDialogPrefixes = Object.freeze({
 'Anmeldung fehlgeschlagen: ':'Sign-in failed: ',
 'Registrierung fehlgeschlagen: ':'Registration failed: ',
 'Abmeldung fehlgeschlagen: ':'Sign-out failed: ',
 'Passwort zurücksetzen fehlgeschlagen: ':'Password reset failed: ',
 'Passwort-Reset fehlgeschlagen: ':'Password reset failed: ',
 'Speichern fehlgeschlagen: ':'Save failed: ',
 'Export fehlgeschlagen: ':'Export failed: ',
 'Import fehlgeschlagen: ':'Import failed: ',
 'Netzwerkfehler: ':'Network error: ',
 'Cloud-Import fehlgeschlagen: ':'Cloud import failed: '
});
const dialogPrefixes = Object.freeze({
 moving: { 'Abmeldung fehlgeschlagen: ':'Sign-out failed: ', 'Anmeldung fehlgeschlagen: ':'Sign-in failed: ', 'Registrierung fehlgeschlagen: ':'Registration failed: ' },
 plants: { 'Abmeldung fehlgeschlagen: ':'Sign-out failed: ', 'Anmeldung fehlgeschlagen: ':'Sign-in failed: ', 'Registrierung fehlgeschlagen: ':'Registration failed: ' },
 baking: { 'Abmeldung fehlgeschlagen: ':'Sign-out failed: ', 'Anmeldung fehlgeschlagen: ':'Sign-in failed: ', 'Registrierung fehlgeschlagen: ':'Registration failed: ' },
 housemates: {
  'Registrierung fehlgeschlagen: ':'Registration failed: ',
  'Abmeldung fehlgeschlagen: ':'Sign-out failed: ',
  'Migration fehlgeschlagen: ':'Migration failed: ',
  'Mitgliederverwaltung: ': 'Member management: '
 }
});
/* Source-exact native dialog additions; no stored data changes. */
const extendedDialogAdditions = Object.freeze({
  "car": {
    "Aktuellen Kilometerstand aktualisieren:": "Update current mileage:",
    "Bitte bestätigen, dass die Cloud-Sicherung tatsächlich heruntergeladen und sicher gespeichert wurde.": "Confirm the cloud backup was downloaded and saved securely.",
    "Backup erfolgreich importiert!": "Backup imported successfully!"
  },
  "budget": {
    "Bitte bestätigen, dass die Cloud-Sicherung tatsächlich heruntergeladen und sicher gespeichert wurde.": "Confirm the cloud backup was downloaded and saved securely.",
    "Der QR-Code konnte nicht geladen werden. Bitte versuche es erneut.": "The QR code could not be loaded. Please try again."
  },
  "moving": {
    "Standort umbenennen:": "Rename location:",
    "Dieser Standort enthält Kisten aus einem aktiven Umzug. Bitte den Umzug erst abschließen.": "This location contains boxes from an active move. Finish the move first.",
    "Diese Kiste ist einem aktiven Umzug zugeordnet. Bitte den Umzug erst abschließen.": "This box belongs to an active move. Finish the move first.",
    "Dieses Backup enthält keine Umzugsprojekte. Die bestehenden Umzugsplanungen würden verloren gehen. Trotzdem fortfahren?": "This backup contains no moving projects. Existing move plans would be lost. Continue anyway?",
    "Vor dem Import bitte eine aktuelle Sicherung herunterladen und überprüfen.": "Before importing, download and verify a current backup.",
    "Hast du die aktuelle Sicherung erfolgreich heruntergeladen?": "Did you download the current backup successfully?",
    "Der QR-Scanner konnte nicht geladen werden. Bitte versuche es erneut.": "The QR scanner could not be loaded. Please try again.",
    "Kamera-Zugriff fehlgeschlagen oder nicht unterstützt.": "Camera access failed or is unsupported."
  },
  "plants": {
    "Der QR-Code konnte nicht geladen werden. Bitte versuche es erneut.": "The QR code could not be loaded. Please try again.",
    "Gespeichert": "Saved.",
    "Nicht gefunden.": "Not found.",
    "Pflanzenfoto konnte nicht verarbeitet werden. Nichts gespeichert.": "Plant photo could not be processed. Nothing was saved.",
    "Das Foto konnte nicht gelesen werden.": "The photo could not be read.",
    "Es konnte keine eindeutige Pflanzen-ID erzeugt werden.": "A unique plant ID could not be generated.",
    "⚠️ Pflanze wirklich löschen?": "⚠️ Delete this plant?",
    "Ungültige Pflanzen-ID. Die Änderungen wurden nicht gespeichert.": "Invalid plant ID. Changes were not saved.",
    "Pflanze nicht gefunden. Die Änderungen wurden nicht gespeichert.": "Plant not found. Changes were not saved.",
    "Bitte einen Pflanzennamen eingeben.": "Enter a plant name.",
    "Bitte ein gültiges Gießdatum eingeben.": "Enter a valid watering date."
  },
  "housemates": {
    "Der QR-Code konnte nicht geladen werden. Bitte versuche es erneut.": "The QR code could not be loaded. Please try again.",
    "Mitgliederzugriff entfernt.": "Member access removed.",
    "Mitgliederzugriff erteilt. Der WG-Link kann jetzt geteilt werden.": "Member access granted. The household link can now be shared.",
    "🔗 WG-Link kopiert! Teile ihn nur mit berechtigten Personen.": "🔗 Household link copied! Share only with authorised people.",
    "WG-Link manuell kopieren:": "Copy household link manually:",
    "Der automatische Schuldenausgleich ist vorübergehend deaktiviert, damit keine Buchungen gelöscht werden. Bitte die vorgeschlagenen Überweisungen manuell durchführen und die Buchungen zur Dokumentation aufbewahren.": "Automatic debt settlement is temporarily disabled to prevent deleting transactions. Make suggested transfers manually and keep transaction records."
  },
  "baking": {
    "Timer abgelaufen!": "Timer finished!"
  },
  "loans": {
    "Gespeichert": "Saved"
  },
  "meters": {
    "Gespeichert": "Saved",
    "Backup erfolgreich importiert!": "Backup imported successfully!"
  },
  "pet-health": {
    "Lokale Haustierdaten nach Sicherung in die Cloud übernehmen?": "Import local pet records into the cloud after backing them up?"
  }
});
/* Source-exact dialog coverage for the shared tool locale wrapper. */
const auditedDialogAdditions = Object.freeze({
  "parking": {
    "Lokale Parkplatzdaten nach Sicherung in die Cloud übernehmen?": "Import local parking data into the cloud after backing them up?",
    "Cloud- und Gerätedaten vorhanden. Cloud-Bestand behalten und lokale Daten separat sichern?": "Cloud and device data exist. Keep cloud data and back up local data separately?",
    "Bitte bestätigen, dass die Sicherung heruntergeladen wurde.": "Please confirm that the backup was downloaded.",
    "Browser-Benachrichtigungen erlaubt. Lass diese Seite für den Timer geöffnet.": "Browser notifications enabled. Keep this page open for the timer.",
    "Dein Browser unterstützt keine Benachrichtigungen.": "Your browser does not support notifications.",
    "Parkscheibe gestellt auf nächste halbe Stunde + 2 Stunden Parkzeit!": "Parking disc set to the next half-hour plus two hours of parking.",
    "Speichern nicht bestätigt. Cloud-Datenstand prüfen.": "Save not confirmed. Check the cloud data.",
    "Möchtest du diesen Eintrag wirklich löschen?": "Are you sure you want to delete this entry?"
  },
  "loans": {
    "Bestehende Verleihdaten in dein Toolya-Konto übernehmen? Vorhandene Cloud-Daten werden nicht überschrieben.": "Import existing lending records into your Toolya account? Existing cloud data will not be overwritten.",
    "Cloud- und Gerätedaten vorhanden. Cloud-Bestand behalten und lokale Daten separat sichern?": "Cloud and device data exist. Keep cloud data and back up local data separately?",
    "Bitte bestätigen, dass die Sicherung heruntergeladen wurde.": "Please confirm that the backup was downloaded.",
    "Bitte einen Namen eingeben!": "Please enter a name!",
    "Bitte eine Bezeichnung für den Gegenstand angeben!": "Please enter an item description!",
    "Diesen Stamm-Gegenstand wirklich löschen?": "Delete this saved item?",
    "Bitte Namen des Gegenstands eingeben:": "Enter the item name:",
    "Bitte Person und Ausleihdatum angeben!": "Please enter the person and lending date!",
    "⚠️ Diesen Eintrag wirklich löschen?": "⚠️ Delete this entry?",
    "Bitte Gegenstand, Person und Ausleihdatum angeben!": "Please enter the item, person and lending date!",
    "Der QR-Code konnte nicht geladen werden. Bitte versuche es erneut.": "The QR code could not be loaded. Please try again.",
    "Bild konnte nicht verarbeitet werden. Nichts gespeichert.": "Image could not be processed. Nothing was saved."
  },
  "meters": {
    "Bestehende Zählerstände nach Sicherung in Toolya Cloud übernehmen?": "Import existing meter readings into Toolya Cloud after backing them up?",
    "Cloud- und Gerätedaten vorhanden. Cloud-Bestand behalten und lokale Daten separat sichern?": "Cloud and device data exist. Keep cloud data and back up local data separately?",
    "Bitte bestätigen, dass die Sicherung heruntergeladen wurde.": "Please confirm that the backup was downloaded.",
    "Bitte gültige, nichtnegative Tarife und einen positiven Gasfaktor eingeben.": "Enter valid non-negative tariffs and a positive gas conversion factor.",
    "Bitte gültiges Ablesedatum und Zählerstand eingeben!": "Enter a valid reading date and meter reading!",
    "⚠️ Achtung: Der Verbrauch seit der letzten Ablesung ist ungewöhnlich hoch (+50% über Schnitt)! Trotzdem speichern?": "⚠️ Consumption since the last reading is unusually high (over 50% above average). Save anyway?",
    "Zählerfoto konnte nicht verarbeitet werden. Nichts gespeichert.": "The meter photo could not be processed. Nothing was saved.",
    "Das Zählerfoto konnte nicht verarbeitet werden. Bitte ein anderes Bild auswählen.": "The meter photo could not be processed. Choose another image.",
    "Das Zählerfoto konnte nicht geöffnet werden.": "The meter photo could not be opened.",
    "Das Zählerfoto konnte nicht gelesen werden.": "The meter photo could not be read.",
    "⚠️ Diesen Zählerstand wirklich löschen?": "⚠️ Delete this meter reading?",
    "Keine Zählerstände zum Teilen vorhanden.": "No meter readings available to share.",
    "Zwischenablage nicht verfügbar. Text manuell kopieren:": "Clipboard unavailable. Copy the text manually:",
    "📋 Zählerstände in die Zwischenablage kopiert! Du kannst sie jetzt direkt in WhatsApp oder E-Mail einfügen.": "📋 Meter readings copied to the clipboard! You can now paste them into WhatsApp or email.",
    "Backup importieren? Vorhandene Zählerstände und Tarife werden ersetzt.": "Import backup? Existing meter readings and tariffs will be replaced.",
    "Fehler beim Importieren der Datei.": "Error importing the file.",
    "Backup-Datei konnte nicht gelesen werden.": "The backup file could not be read."
  },
  "car": {
    "Bitte einen Fahrzeugnamen eingeben!": "Please enter a vehicle name!",
    "⚠️ Möchtest du dieses Fahrzeug und alle zugehörigen Einträge wirklich unwiderruflich löschen?": "⚠️ Permanently delete this vehicle and all its records?",
    "Bitte ein Fahrzeug wählen!": "Please select a vehicle!",
    "Bitte Fahrzeug, Datum und Bezeichnung angeben!": "Please enter a vehicle, date and description!",
    "Eintrag nicht bestätigt. Bitte den Cloud-Datenstand prüfen, bevor du es erneut versuchst.": "Entry not confirmed. Check cloud data before trying again.",
    "Beleg konnte nicht verarbeitet werden. Bitte eine andere Bilddatei wählen oder ohne Beleg speichern.": "Receipt could not be processed. Choose another image or save without a receipt.",
    "Beleg konnte nicht verarbeitet werden. Bitte erneut versuchen.": "Receipt could not be processed. Please try again.",
    "Bitte Bezeichnung und Datum eingeben!": "Please enter a description and date!",
    "⚠️ Diesen Eintrag wirklich löschen?": "⚠️ Delete this entry?",
    "Backup zu groß (maximal 20 MB).": "Backup too large (maximum 20 MB).",
    "Ungültiges Backup-Format.": "Invalid backup format.",
    "Ungültige Reifendaten im Backup.": "Invalid tyre data in backup.",
    "Bild konnte nicht verarbeitet werden.": "Image could not be processed.",
    "Backup-Datei konnte nicht gelesen werden.": "The backup file could not be read."
  },
  "moving": {
    "Vorhandene Gerätedaten in dein Toolya-Konto übernehmen? Cloud-Daten werden nicht überschrieben.": "Import existing device data into your Toolya account? Cloud data will not be overwritten.",
    "Cloud- und Gerätedaten vorhanden. Cloud-Daten behalten und Gerätedaten separat sichern?": "Cloud and device data exist. Keep cloud data and back up device data separately?",
    "Bitte bestätigen, dass die Sicherung tatsächlich heruntergeladen wurde.": "Please confirm that the backup was downloaded.",
    "Bitte Standort eingeben!": "Please enter a location!",
    "⚠️ Möchtest du diesen Standort und ALLE Kisten darin wirklich löschen?": "⚠️ Delete this location and ALL boxes inside it?",
    "Bitte Standort und Kisten-Name angeben!": "Please enter a location and box name!",
    "Bitte Artikel-Name eingeben!": "Please enter an item name!",
    "⚠️ Möchtest du diese Kiste wirklich löschen?": "⚠️ Delete this box?",
    "Der QR-Code konnte nicht geladen werden. Bitte versuche es erneut.": "The QR code could not be loaded. Please try again.",
    "Keine Kisten vorhanden.": "No boxes available.",
    "Bild konnte nicht gelesen werden. Nichts gespeichert.": "Image could not be read. Nothing was saved."
  },
  "plants": {
    "Bitte ein gültiges Fassungsvermögen größer als 0 eingeben.": "Enter a valid capacity greater than zero.",
    "Regentonne / Zisterne vollständig aufgefüllt!": "Rain barrel / cistern filled completely!",
    "Bitte ein gültiges Saatgutjahr eingeben.": "Enter a valid seed year.",
    "Mehrere Pflanzen gefunden. Bitte die eindeutige Pflanzen-ID eingeben.": "Multiple plants found. Enter the unique plant ID.",
    "Ungültige Pflanzen-ID.": "Invalid plant ID.",
    "Bitte eine gültige Erntemenge in ganzen Gramm eingeben.": "Enter a valid harvest amount in whole grams.",
    "Die gesamte Erntemenge überschreitet den unterstützten Zahlenbereich.": "The total harvest exceeds the supported numeric range.",
    "Lokale Pflanzendaten nach Sicherung in die Cloud übernehmen?": "Import local plant data into the cloud after backing them up?",
    "Cloud- und Gerätedaten vorhanden. Cloud-Bestand behalten und lokale Daten separat sichern?": "Cloud and device data exist. Keep cloud data and back up local data separately?",
    "Bitte bestätigen, dass die Sicherung heruntergeladen wurde.": "Please confirm that the backup was downloaded.",
    "Bitte Name und gültiges Gießdatum angeben!": "Enter a name and a valid watering date!",
    "Bitte ein Gießintervall zwischen 1 und 3650 Tagen eingeben.": "Enter a watering interval between 1 and 3650 days.",
    "Bitte ein gültiges Vermehrungsdatum eingeben.": "Enter a valid propagation date.",
    "Das Foto konnte nicht verarbeitet werden. Bitte ein anderes Bild auswählen.": "The photo could not be processed. Choose another image.",
    "Das Foto konnte nicht geöffnet werden. Bitte ein gültiges Bild auswählen.": "The photo could not be opened. Choose a valid image.",
    "Es konnte keine gültige Pflanzen-ID erzeugt werden.": "A valid plant ID could not be generated.",
    "Pflanze nicht gefunden. Es wurde nichts gelöscht.": "Plant not found. Nothing was deleted."
  },
  "budget": {
    "Bitte nur JPG-, PNG-, GIF- oder WebP-Bilder auswählen. Bereits vorhandene Belegbilder bleiben erhalten.": "Choose only JPG, PNG, GIF or WebP images. Existing receipt images will be kept.",
    "Die ausgewählten Belegbilder sind zusammen zu groß (maximal 4 MB). Bitte kleinere Fotos auswählen. Bereits vorhandene Belegbilder bleiben erhalten.": "The selected receipt images exceed 4 MB in total. Choose smaller photos. Existing receipt images will be kept.",
    "Der Browser konnte den Bildleser nicht starten. Bitte die Bildauswahl erneut versuchen.": "The browser could not start the image reader. Select the images again.",
    "Ein Belegbild hat ein ungültiges Format. Bitte die Bildauswahl erneut versuchen.": "A receipt image has an invalid format. Select the images again.",
    "Das erste Belegbild konnte nicht verarbeitet werden. Bitte erneut auswählen.": "The first receipt image could not be processed. Select it again.",
    "Das erste Belegbild konnte nicht geöffnet werden. Bitte erneut auswählen.": "The first receipt image could not be opened. Select it again.",
    "Ein Belegbild konnte nicht gelesen werden. Bitte die Bildauswahl erneut versuchen.": "A receipt image could not be read. Select the images again.",
    "Ein Belegbild konnte nicht geöffnet werden. Bitte die Bildauswahl erneut versuchen.": "A receipt image could not be opened. Select the images again.",
    "Die Bildanpassung ist fehlgeschlagen. Bitte das Belegfoto erneut auswählen.": "Image adjustment failed. Select the receipt photo again.",
    "Bitte wähle zuerst ein Belegfoto aus!": "Select a receipt photo first.",
    "Mindestens ein Belegbild konnte nicht geladen werden. Bitte Bilder erneut auswählen oder entfernen.": "At least one receipt image could not be loaded. Select the images again or remove them.",
    "Die Belegbilder werden noch geladen. Bitte kurz warten und erneut speichern.": "Receipt images are still loading. Wait briefly and save again.",
    "Bitte Titel, gültiges Kaufdatum und einen positiven Betrag angeben!": "Enter a title, valid purchase date and positive amount!",
    "Bitte gültige Garantie-, Rückgabe- und Lebensdauerwerte angeben.": "Enter valid warranty, return-period and useful-life values.",
    "Diese Buchung ist nicht mehr vorhanden. Die Änderungen wurden nicht gespeichert.": "This transaction no longer exists. Changes were not saved.",
    "⚠️ Diese Buchung wirklich löschen?": "⚠️ Delete this transaction?",
    "Bitte gültigen Titel, positiven Zielbetrag und Startbetrag ab 0 € eingeben!": "Enter a valid title, positive target amount and starting amount of at least €0!",
    "Sparziel löschen?": "Delete savings goal?",
    "Für diesen Beleg fehlt ein gültiges Kaufdatum oder eine Garantiedauer.": "This receipt is missing a valid purchase date or warranty duration.",
    "Keine Buchungen für den CSV-Export vorhanden.": "No transactions available for CSV export.",
    "Keine steuerrelevanten Buchungen gefunden!": "No tax-relevant transactions found!",
    "Backup in Toolya Cloud gespeichert.": "Backup saved to Toolya Cloud.",
    "Backup-Datei konnte nicht gelesen werden.": "The backup file could not be read."
  },
  "housemates": {
    "Ungültige WG-ID im Link.": "Invalid household ID in the link.",
    "Bitte E-Mail und Passwort eingeben.": "Enter your email and password.",
    "Abmeldung angehalten: Deine Änderungen sind noch nicht online gesichert. Bitte speichere sie, bevor du dich abmeldest.": "Sign-out paused: your changes have not been backed up online. Save them before signing out.",
    "Migration ist nur für eine ältere WG verfügbar.": "Migration is available only for a legacy household.",
    "Die Cloud-Daten der alten WG wurden gelesen. Jetzt eine private Kopie für dein Konto erstellen?": "The legacy household's cloud data were loaded. Create a private copy for your account now?",
    "Private WG-Kopie erstellt.\nDer alte WG-Link bleibt bestehen.\nBitte teile ab jetzt nur den neuen Link mit freigegebenen Mitgliedern.": "Private household copy created.\nThe old household link remains active.\nFrom now on, share only the new link with approved members.",
    "Mitgliederverwaltung ist nur für geschützte WGs verfügbar.": "Member management is available only for protected households.",
    "Deine Benutzer-ID zum Freigeben durch den WG-Eigentümer:": "Your user ID for approval by the household owner:",
    "Speicherkonflikt: Die WG wurde andernorts geändert. Lokale Änderungen bleiben erhalten; bitte vor dem Neuladen sichern.": "Save conflict: the household was changed elsewhere. Local changes are retained; back them up before reloading.",
    "Deine Änderungen sind auf diesem Gerät gespeichert. Die Online-Sicherung steht noch aus.": "Your changes are saved on this device. Online backup is still pending.",
    "Cloud-Daten neu laden? Nicht synchronisierte lokale Änderungen können verloren gehen.": "Reload cloud data? Unsynced local changes may be lost.",
    "Deine WG-Daten wurden neu geladen.": "Your household data were reloaded.",
    "Die WG-Daten konnten gerade nicht neu geladen werden. Prüfe deine Verbindung und versuche es erneut.": "Household data could not be reloaded. Check your connection and try again.",
    "Keine gültige WG-ID vorhanden.": "No valid household ID available.",
    "WG-Cloud nicht erreichbar. Lokale Daten dieser WG werden angezeigt; Änderungen können derzeit nicht zuverlässig synchronisiert werden.": "Household cloud unavailable. Local data are shown; changes cannot currently be synced reliably.",
    "Bitte mindestens einen Titel angeben!": "Please enter at least a title!",
    "Bitte Titel und Datum angeben!": "Please enter a title and date!",
    "Bitte Pflichtfelder ausfüllen!": "Please complete the required fields!",
    "Bitte Belegfoto auswählen!": "Please select a receipt photo!",
    "Bitte mindestens Titel, Datum und Betrag angeben!": "Please enter at least a title, date and amount!",
    "Bitte Titel und Zielbetrag angeben!": "Please enter a title and target amount!",
    "Keine WG-ID aktiv.": "No household ID is active.",
    "Bitte zuerst ein WG-Mitglied anlegen.": "Please add a household member first.",
    "Bitte Aufgabe angeben!": "Please enter a task!",
    "Bitte Bezeichnung eingeben!": "Please enter a description!",
    "Zutaten übernommen!": "Ingredients added!",
    "Bitte Name und gültige Kosten angeben!": "Please enter a name and valid costs!"
  },
  "baking": {
    "Lokale Rezepte nach Sicherung in die Cloud übernehmen?": "Import local recipes into the cloud after backing them up?",
    "Cloud- und Gerätedaten vorhanden. Cloud-Bestand behalten und lokale Daten separat sichern?": "Cloud and device data exist. Keep cloud data and back up local data separately?",
    "Bitte bestätigen, dass die Sicherung heruntergeladen wurde.": "Please confirm that the backup was downloaded."
  }
});
// Exact app-owned validation errors, shared by native dialog wrappers.
const validationCopy=Object.freeze({
"Import ersetzt vorhandene Cloud-Daten. Zuerst eine Sicherung herunterladen?": "Import replaces existing cloud data. Download a backup first?",
"Sicherung kontrolliert? Vorhandene Cloud-Daten jetzt wirklich ersetzen?": "Have you checked the backup? Replace existing cloud data now?",
"Sicherung enthält keine gültigen Daten.": "Backup contains no valid data.",
"Sicherung kann nicht als JSON erstellt werden.": "Backup could not be created as JSON.",
"Cloud-Daten nicht bereit.": "Cloud data is not ready.",
"Sicherheitsprüfungen fehlen.": "Safety checks are missing.",
"Importdaten sind kein gültiges JSON.": "Import data is not valid JSON.",
"Cloud-Sicherung nicht bestätigt. Import abgebrochen.": "Cloud backup not confirmed. Import cancelled.",
"Cloud-Sitzung oder Datenstand hat sich geändert.": "The cloud session or data revision has changed.",
  "Konto während des Ladens gewechselt.": "The account changed while loading.",
  "Anmeldung nicht mehr gültig.": "Sign-in is no longer valid.",
  "Anmeldung nicht gültig.": "Sign-in is invalid.",
  "Cloud nicht bereit. Bitte anmelden oder neu laden.": "Cloud not ready. Sign in or reload.",
  "Cloud nicht bereit.": "Cloud not ready.",
  "Konto während des Cloud-Ladens gewechselt.": "The account changed while loading cloud data.",
  "Canvas nicht verfügbar": "Canvas unavailable"
});
const toolValidationCopy=Object.freeze({
  "housemates": {
    "Ungültige alte WG-Daten.": "Invalid legacy household data.",
    "Alte WG hat ein ungültiges Datenformat.": "The legacy household has an invalid data format.",
    "WG-Zugriff konnte nicht geprüft werden.": "Household access could not be verified.",
    "WG wurde während des Speicherns gewechselt. Speichern abgebrochen.": "The household changed while saving. Save cancelled.",
    "Speichern nach einem Konflikt angehalten. Bitte Daten sichern und die WG kontrolliert neu laden.": "Saving paused after a conflict. Back up your data and carefully reload the household.",
    "WG muss vor dem Speichern neu geladen werden.": "Reload the household before saving.",
    "Ungültiger WG-Versionsstand. Bitte WG neu laden.": "Invalid household revision. Reload the household.",
    "Speicherkonflikt: Die WG wurde zwischenzeitlich geändert. Bitte Änderungen sichern und neu laden.": "Save conflict: The household has changed in the meantime. Back up your changes and reload.",
    "Cloud-Daten konnten nicht geladen werden": "Cloud data could not be loaded",
    "Ungültiges WG-Datenformat": "Invalid household data format",
    "Ungespeicherte WG-Änderungen: Cloud-Laden abgebrochen.": "Unsaved household changes: Cloud loading cancelled.",
    "Ungültige WG-Daten": "Invalid household data",
    "WG wurde während des Ladens lokal geändert. Cloud-Daten nicht übernommen.": "The household changed locally while loading. Cloud data was not applied.",
    "Ungültige WG-Cloud-Daten": "Invalid household cloud data",
    "WG wurde vor dem Speichern gewechselt.": "The household changed before saving."
  },
  "budget": {
    "Ungültige Bildabmessungen": "Invalid image dimensions",
    "Belegfoto konnte nicht gültig gespeichert werden": "The receipt photo could not be saved correctly",
    "Diese Backup-Version wird nicht unterstützt. Bitte eine kompatible Version verwenden.": "This backup version is unsupported. Use a compatible version."
  },
  "car": {
    "Bild ist nicht lesbar": "Image cannot be read"
  },
  "parking": {
    "Foto nicht lesbar": "Photo cannot be read"
  },
  "meters": {
    "Ungültiger Tarifwert": "Invalid tariff value",
    "Ungültiger Gasfaktor": "Invalid gas conversion factor",
    "Ungültiges Zählerstände-Backup": "Invalid meter readings backup"
  }
});
function validationText(tool,message){
 const table=Object.hasOwn(toolValidationCopy,tool)?toolValidationCopy[tool]:{};
 return Object.hasOwn(table,message)?table[message]:Object.hasOwn(validationCopy,message)?validationCopy[message]:message;
}
export function translateToolDialog(tool, language, message) {
 if(language!=='en' || typeof message!=='string') return message;
 const exact=Object.hasOwn(dialogCopy,tool) && Object.hasOwn(dialogCopy[tool],message) ? dialogCopy[tool][message] : undefined;
 if(exact!==undefined) return exact;
 const additional=Object.hasOwn(additionalDialogCopy,tool)&&Object.hasOwn(additionalDialogCopy[tool],message)
  ? additionalDialogCopy[tool][message] : undefined;
 if(additional!==undefined)return additional;
 const audited=Object.hasOwn(auditedDialogAdditions,tool) && Object.hasOwn(auditedDialogAdditions[tool],message) ? auditedDialogAdditions[tool][message] : undefined;
 if(audited!==undefined)return audited;
 const extended=Object.hasOwn(extendedDialogAdditions,tool) && Object.hasOwn(extendedDialogAdditions[tool],message)
  ? extendedDialogAdditions[tool][message] : undefined;
 if(extended!==undefined) return extended;
 const confirmation=connectConfirmation(message,language);
 if(confirmation!==message)return confirmation;
 const validation=validationText(tool,message);
 if(validation!==message)return validation;
 if(tool==='budget')for(const [de,en] of [['Ungültiger Backup-Bereich: ','Invalid backup section: '],['Ungültige Einträge im Backup-Bereich: ','Invalid entries in backup section: ']])if(message.startsWith(de))return en+message.slice(de.length);
 
 for(const [prefix,translated] of Object.entries({...sharedDialogPrefixes,...(dialogPrefixes[tool]||{})}))
  if(message.startsWith(prefix)) {
   const detail=message.slice(prefix.length);
   return translated+(Object.hasOwn(dialogCopy,tool) && Object.hasOwn(dialogCopy[tool],detail) ? dialogCopy[tool][detail] : validationText(tool,detail));
  }
 return message;
}

/* Runtime text is deliberately restricted to trusted, known status fields.
   Translate only exact application-owned messages or a fixed prefix. Never
   translate account identifiers, free-form descriptions or calculated values. */
const toolRuntimeStatus=Object.freeze({
 housemates:{
  'Erstelle Cloud-Speicher im Hintergrund...':'Creating private cloud storage…',
  '🔍 Scanne Kassenbon...':'🔍 Scanning receipt…',
  '✅ OCR Erfolgreich!':'✅ Text recognition successful!',
  '❌ Texterkennung fehlgeschlagen.':'❌ Text recognition failed.'
 },
 budget:{
  "💚 NEU IM HAUSHALTSBUCH": "💚 NEW IN HOUSEHOLD BUDGET",
  "Clever sparen": "Smart saving",
  "Dein Geld im Blick. Ohne Rechnen.": "Keep track of your money. No calculations needed.",
  "Clever-sparen-Bereiche": "Smart saving sections",
  "🏠 Überblick": "🏠 Overview",
  "🛒 Einkaufen": "🛒 Shopping",
  "📅 Planen": "📅 Planning",
  "🔎 Prüfen": "🔎 Review",
  "Bitte anmelden": "Please sign in",
  "Deine Zahlen erscheinen erst nach dem Laden deines Kontos.": "Your figures appear after your account has loaded.",
  "Diese Woche noch": "Remaining this week",
  "Wochenbudget festlegen": "Set weekly budget",
  "Nach bekannten Ausgaben": "After known expenses",
  "Nächster Einkauf": "Next shopping trip",
  "Aus deinen Preisen": "Based on your prices",
  "Einkaufsliste anlegen": "Create shopping list",
  "Im Vergleich": "In comparison",
  "Mehr (+) oder weniger (−)": "More (+) or less (−)",
  "Noch zu wenig Buchungen": "Not enough transactions yet",
  "Jahreskosten": "Annual expenses",
  "Monatlich zurücklegen": "Set aside monthly",
  "Jahreskosten eintragen": "Enter annual expenses",
  "Was kann ich diese Woche ausgeben?": "What can I spend this week?",
  "So steht es um dein Wochenbudget.": "Here is how your weekly budget is doing.",
  "Lege zuerst dein Wochenbudget fest.": "Set your weekly budget first.",
  "Genutzter Anteil deines Wochenbudgets": "Share of weekly budget used",
  "Die Angaben sind nur ein Richtwert.": "These figures are a guide only.",
  "Dein Spartipp": "Your saving tip",
  "Tipps aus deinen Ausgaben.": "Tips based on your spending.",
  "Mit zwei Monaten an Ausgaben kann Toolya dir erste Spartipps zeigen.": "With two months of expenses, Toolya can offer your first saving tips.",
  "Deine Ausgaben sind im Vergleich zum Vormonat nicht gestiegen.": "Your spending has not increased compared with the previous month.",
  "Ausgaben vergleichen": "Compare spending",
  "Preise merken": "Remember prices",
  "Essen berechnen": "Calculate meal costs",
  "Buchungen prüfen": "Review transactions",
  "Entfernen": "Remove",
  "Deine Preise": "Your prices",
  "Preise aus deinen gespeicherten Kassenbons.": "Prices from your saved receipts.",
  "Noch keine Einzelpreise. Scanne einen Kassenbon und prüfe seine Artikel.": "No individual prices yet. Scan a receipt and review its items.",
  "Artikel suchen": "Find items",
  "Zum Beispiel Butter": "For example, butter",
  "Kein Artikel gefunden.": "No item found.",
  "Geschäft nicht angegeben": "Shop not specified",
  "Dein nächster Einkauf": "Your next shopping trip",
  "So viel kostet die Einkaufsliste ungefähr.": "Estimated cost of your shopping list.",
  "Anzahl": "Quantity",
  "z. B. Milch 1 l": "e.g. milk 1 L",
  "Eigener Preis (optional)": "Your own price (optional)",
  "+ Zur Liste": "+ Add to list",
  "Deine Liste ist noch leer.": "Your list is still empty.",
  "Preis noch unbekannt": "Price not known yet",
  "Geschätzte Preise aus deinen Kassenbons.": "Estimated prices from your receipts.",
  "Was kostet unser Essen?": "How much does our meal cost?",
  "Wähle deine Zutaten aus der Preisliste.": "Choose your ingredients from the price list.",
  "Gericht": "Dish",
  "z. B. Nudeln mit Soße": "e.g. pasta with sauce",
  "Für wie viele Personen?": "For how many people?",
  "Zutat": "Ingredient",
  "z. B. Nudeln 500g": "e.g. pasta 500 g",
  "Wie oft brauchst du es?": "How many do you need?",
  "+ Zutat": "+ Ingredient",
  "Maximal 40 Zutaten pro Gericht.": "Maximum 40 ingredients per dish.",
  "Gericht speichern": "Save dish",
  "Noch kein Gericht gespeichert.": "No dish saved yet.",
  "Alle Preise bekannt": "All prices known",
  "Dein Geld bis Sonntag": "Your money until Sunday",
  "So viel bleibt von deinem Wochenbudget übrig.": "This is what remains of your weekly budget.",
  "Mein Wochenbudget (€)": "My weekly budget (€)",
  "z. B. 180": "e.g. 180",
  "Richtwert aus deinen Buchungen, kein Kontostand.": "An estimate based on your transactions, not your bank balance.",
  "Kann ich mir das leisten?": "Can I afford this?",
  "Prüfe eine Anschaffung mit deinen vorhandenen Zahlen.": "Check a purchase against your existing figures.",
  "Was möchtest du ausgeben? (€)": "How much do you want to spend? (€)",
  "z. B. 75": "e.g. 75",
  "Betrag eingeben, um deinen Spielraum zu sehen.": "Enter an amount to see how much room you have.",
  "Fürs Jahr vorsorgen": "Plan for the year",
  "Weihnachten, Versicherungen und andere Jahreskosten.": "Christmas, insurance and other annual expenses.",
  "Wofür?": "What for?",
  "z. B. Weihnachten": "e.g. Christmas",
  "Betrag (€)": "Amount (€)",
  "In welchem Monat?": "Which month?",
  "Am wievielten?": "Which day of the month?",
  "Eintragen": "Add",
  "Noch keine Jahreskosten eingetragen.": "No annual expenses entered yet.",
  "So viel könntest du jeden Monat zurücklegen.": "This is how much you could set aside each month.",
  "Kalender": "Calendar",
  "Was ist teurer geworden?": "What has become more expensive?",
  "So haben sich deine Ausgaben verändert.": "Here is how your spending has changed.",
  "Noch keine Buchungen aus dem Vormonat zum Vergleichen.": "No transactions from the previous month to compare yet.",
  "Deine Spartipps": "Your saving tips",
  "Aktuell keine größeren Kostensteigerungen erkennbar. Mit mehr Buchungen werden die Tipps genauer.": "No major cost increases detected at the moment. Tips become more accurate with more transactions.",
  "Kassenbon prüfen": "Review receipt",
  "Doppelte Beträge und auffällige Kassenbons zum Nachprüfen.": "Duplicate amounts and unusual receipts to review.",
  "Keine auffälligen Buchungen gefunden.": "No unusual transactions found.",
  "Buchungen ansehen": "View transactions",
  "Reparieren oder neu kaufen?": "Repair or replace?",
  "Nutze deine gespeicherten Gerätebelege.": "Use your saved appliance receipts.",
  "Noch keine Gerätebelege vorhanden.": "No appliance receipts yet.",
  "Mein Gerät": "My appliance",
  "Was würde die Reparatur kosten? (€)": "How much would the repair cost? (€)",
  "Was kostet ein neues Gerät? (€)": "How much would a new appliance cost? (€)",
  "Wähle dein Gerät und trage die Preise ein.": "Select your appliance and enter the prices.",
  "Reparieren ist nach diesen Preisen günstiger.": "Based on these prices, repairing is cheaper.",
  "Ein neues Gerät ist nach diesen Preisen nicht teurer als die Reparatur.": "Based on these prices, a new appliance costs no more than the repair.",
  "Reparaturkosten notieren": "Record repair costs",
  "Welche Lebensmittel sind teurer?": "Which groceries have become more expensive?",
  "Vergleich mit deinen vorherigen Preisen.": "Comparison with your previous prices.",
  "Artikel auf deinem Kassenbon": "Items on your receipt",
  "Prüfe die erkannten Preise. Nur bestätigte Artikel werden mit dem Beleg gespeichert.": "Review the recognised prices. Only confirmed items are saved with the receipt.",
  "+ Artikel eintragen": "+ Add item",
  "Noch keine Artikel. Scanne einen Kassenbon oder trage Artikel selbst ein.": "No items yet. Scan a receipt or enter items yourself.",
  "Preis gesamt (€)": "Total price (€)",
  "Artikel entfernen": "Remove item",
  "Mögliche Doppelbuchung": "Possible duplicate transaction",
  "Ungewöhnlich hoher Betrag": "Unusually high amount",
  "Stück": "pcs",
  "Buchung": "Transaction",
  "Einkauf": "Purchase",
  "QR-Code konnte nicht erstellt werden.": "Could not create the QR code.",
  "Bitte erst im Haushaltsbuch anmelden.": "Sign in to the household budget first.",
  "Speichern nicht bestätigt. Bitte neu anmelden.": "Saving was not confirmed. Please sign in again.",
  "Konnte nicht gespeichert werden. Bitte noch einmal versuchen.": "Could not save. Please try again.",
  "Bitte Artikel und Anzahl prüfen.": "Check the item and quantity.",
  "Bitte Zutat und Anzahl eingeben.": "Enter an ingredient and quantity.",
  "Bitte Gericht, Personen und Zutaten prüfen.": "Check the dish, number of people and ingredients.",
  "Bitte einen Betrag über 0 € eingeben.": "Enter an amount greater than €0.",
  "Bitte einen gültigen Preis eingeben.": "Enter a valid price.",
  "Bitte alle Angaben prüfen.": "Check all details.",
  "Bitte die Reparaturkosten eingeben.": "Enter the repair cost.",
  "Keine Einzelpreise erkannt. Du kannst Artikel selbst eintragen.": "No individual prices recognised. You can enter items yourself.",
  "Gespeichert.": "Saved.",
  '🔍 Scanne Kassenbon... Bitte warten.':'🔍 Scanning receipt… Please wait.',
  'ℹ️ Angaben erkannt. Bereits ausgefüllte Felder wurden nicht überschrieben.':'ℹ️ Details recognised. Existing fields were not overwritten.',
  '⚠️ Kein eindeutiger Gesamtbetrag oder gültiges Datum erkannt. Bitte manuell eintragen.':'⚠️ No clear total or valid date recognised. Enter the details manually.',
  '❌ Texterkennung fehlgeschlagen.':'❌ Text recognition failed.',
  '💾 Änderungen speichern':'💾 Save changes',
  '✍️ Einnahme oder Ausgabe erfassen':'✍️ Record income or expense',
  'Keine Ausgaben in diesem Monat.':'No expenses this month.'
 },
 parking:{
  'Kein aktiver Parkschein-Timer':'No active parking timer',
  '⏰ ABGELAUFEN!':'⏰ TIME EXPIRED!',
  'Bitte Parkzeit verlängern oder zum Auto gehen!':'Extend parking time or return to your car!',
  'Parkzeit läuft...':'Parking timer running…',
  'Gespeichert ✓':'Saved ✓',
  'Nicht gespeichert':'Not saved'
 }
});
const toolRuntimeReverse=Object.freeze(Object.fromEntries(Object.entries(toolRuntimeStatus).map(([name,labels])=>[name,Object.fromEntries(Object.entries(labels).map(([de,en])=>[en,de]))])));
const toolRuntimePrefixes=Object.freeze({budget:[['✏️ Buchung bearbeiten: ','✏️ Edit transaction: ']]});
export function translateToolRuntimeStatus(tool,language,message){
 if(typeof message!=='string'||(language!=='en'&&language!=='de'))return message;
 const catalogue=language==='en'?toolRuntimeStatus:toolRuntimeReverse;
 const table=Object.hasOwn(catalogue,tool)?catalogue[tool]:undefined;
 if(table&&Object.hasOwn(table,message))return table[message];
 const prefixes=Object.hasOwn(toolRuntimePrefixes,tool)?toolRuntimePrefixes[tool]:[];
 for(const [de,en]of prefixes){
  const source=language==='en'?de:en,target=language==='en'?en:de;
  if(message.startsWith(source))return target+message.slice(source.length);
 }
 return message;
}

/* Localize only known, app-authored status strings. Never translate email
   addresses, user names, server diagnostics or cloud object fields. */
const accountStatusCopy=Object.freeze({
 'Nicht angemeldet':'Not signed in',
 'Konto wird geprüft …':'Checking your account…',
 'Lade...':'Loading…',
 'Konto wird geprüft ...':'Checking your account...',
 'Status: Verbunden':'Status: Connected',
 'Status: Verbunden & Angemeldet':'Status: Connected and signed in',
 'Status: Verbindung oder Sitzung nicht überprüfbar':'Status: Unable to verify connection or session',
 'Benutzer':'User'
});
const accountStatusReverse=Object.freeze(Object.fromEntries(Object.entries(accountStatusCopy).map(([de,en])=>[en,de])));
export function translateAccountStatus(language,message){
 if(typeof message!=='string')return message;
 const target=language==='en'?accountStatusCopy:accountStatusReverse;
 if(Object.hasOwn(target,message))return target[message];
 const pairs=language==='en'
  ?[['✅ Angemeldet – ','✅ Signed in – ']]
  :[['✅ Signed in – ','✅ Angemeldet – ']];
 for(const [from,to] of pairs)if(message.startsWith(from))return to+message.slice(from.length);
 return message;
}

/** Read-only source catalogues for the gradual i18next migration.
 * Keep legacy runtime translators in place until view-by-view cutover.
 * Selector-based entries are not source-text dictionaries and must not be
 * translated by blindly replacing arbitrary DOM text.
 */
export const I18N_LEGACY_TOOL_CATALOGUES=Object.freeze({
 selectors:toolTranslations,
 dialogs:dialogCopy,
 additionalDialogs:additionalDialogCopy,
 dialogPrefixes,
 sharedDialogPrefixes,
 runtimeStatus:toolRuntimeStatus,
 runtimePrefixes:toolRuntimePrefixes,
 accountStatus:accountStatusCopy
});
