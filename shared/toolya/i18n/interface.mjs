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
  ['#locName','','aria-label','Location name']
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
  ['button[onclick="savePlant()"]','Save plant']
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
  '📤 Wiederherstellen':'📤 Restore','📖 Hilfe & Anleitung anzeigen':'📖 View help and guide'
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
  'Fertig & Schließen':'Done and close','📶 WLAN-Passwort:':'📶 Wi-Fi password:'
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
  '💧 Gießen':'💧 Water','Ausblenden':'Dismiss','Achtung: Frostgefahr!':'Warning: frost risk!'
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
  'Start':'Start','Pause':'Pause','Nächste Phase':'Next phase','Löschen':'Delete'
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
  '↗ Entdecke mehr Toolya':'↗ Explore more Toolya'
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
function applyB3NavigationCopy(document,tool,language){
 const translations=b3NavigationCopy[tool];
 if(!translations)return;
 const nav=document.querySelector('.b3-nav');
 const sourceNavLabel={moving:'Umzugskisten & Inventarliste Navigation',housemates:'WG-Organisator Navigation',plants:'Pflanzenpflege Navigation'}[tool];
 if(nav && sourceNavLabel && (nav.getAttribute('aria-label')===sourceNavLabel || originals.get(nav)?.has('aria-label'))){
  const accessibleLabel={moving:'Moving boxes navigation',housemates:'Roommate organizer navigation',plants:'Plant care navigation'}[tool];
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
function applyB3EditorCopy(document,tool,language){
 const names=b3EditorPanels[tool];
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
  }
});
function applyToolParagraphCopy(document,tool,language){
 const dictionary=toolParagraphCopy[tool];
 if(!dictionary)return;
 for(const el of document.querySelectorAll('#main-content p,.ty-tool-hero-copy p,#frostBanner p')){
  if(el.children.length||el.isContentEditable||el.closest('[contenteditable="true"]'))continue;
  const source=originals.get(el)?.get('text')??el.textContent;
  const key=source.trim();
  const translated=dictionary[key];
  if(translated!==undefined)updateElement(el,source.replace(key,translated),null,language);
 }
}
/* Small labels in the tool-owned layout that are not covered by form labels
   or paragraph descriptions. Source exact, leaf-only and reversible. */
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
 const dictionary=toolSmallCopy[tool];if(!dictionary)return;
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
      "title",
      "QR-Code & Deep-Link",
      "QR code and deep link"
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
export function applyToolInterfaceLocale(document,tool,language){
 for(const [selector,translation,attribute,attributeTranslation] of [...common,...(toolTranslations[tool]||[]),...(extendedFormTranslations[tool]||[])]){
  const translated=attribute?attributeTranslation:translation;
  for(const element of document.querySelectorAll(selector)){
   updateElement(element,translated,attribute,language);
  }
 }
 applyStaticFormCopy(document,tool,language);
 applyKnownB3Accessibility(document,language);
 applyB3NavigationCopy(document,tool,language);
 applyB3EditorCopy(document,tool,language);
 applyToolHelpBodyCopy(document,tool,language);
 applyToolAlertCopy(document,tool,language);
 applyToolParagraphCopy(document,tool,language);
 applyToolSmallCopy(document,tool,language);
 applyToolAccessibilityCopy(document,tool,language);
 if(tool==='baking')applyBackstudioCopy(document,language);
}

/* Only application-owned, source-exact browser-dialog copy. Dynamic user values,
   email addresses, backend errors and machine-readable exports are untouched. */
const dialogCopy = Object.freeze({
 moving: {
  'Layout konnte nicht gespeichert werden.':'Could not save the dashboard layout.',
  'Angemeldet. Dein Konto ist einsatzbereit.':'Signed in. Your account is ready.',
  'Anfrage verarbeitet. Falls eine Bestätigung erforderlich ist, prüfe dein E-Mail-Postfach und bestätige die Adresse. Melde dich danach an.':'Request processed. If confirmation is required, check your inbox and verify your email address, then sign in.',
  "Backup zu groß (maximal 20 MB).": "Backup too large (maximum 20 MB).",
  "Ungültiges Backup-Format.": "Invalid backup format.",
  "Backup importieren? Vorhandene Daten werden ersetzt.": "Import backup? Existing data will be replaced.",
  "Fehler beim Lesen der Datei.": "Could not read the file.",
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
  "WLAN-Passwort (wird nicht gespeichert):": "Wi-Fi password (not saved):",
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
const dialogPrefixes = Object.freeze({
 moving: { 'Abmeldung fehlgeschlagen: ':'Sign-out failed: ', 'Anmeldung fehlgeschlagen: ':'Sign-in failed: ', 'Registrierung fehlgeschlagen: ':'Registration failed: ' },
 plants: { 'Abmeldung fehlgeschlagen: ':'Sign-out failed: ', 'Anmeldung fehlgeschlagen: ':'Sign-in failed: ', 'Registrierung fehlgeschlagen: ':'Registration failed: ' },
 baking: { 'Abmeldung fehlgeschlagen: ':'Sign-out failed: ', 'Anmeldung fehlgeschlagen: ':'Sign-in failed: ', 'Registrierung fehlgeschlagen: ':'Registration failed: ' },
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
 if(target[message]!==undefined)return target[message];
 const pairs=language==='en'
  ?[['✅ Angemeldet – ','✅ Signed in – ']]
  :[['✅ Signed in – ','✅ Angemeldet – ']];
 for(const [from,to] of pairs)if(message.startsWith(from))return to+message.slice(from.length);
 return message;
}
