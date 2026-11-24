/* Account and dashboard display catalogue; strictly presentation-only.
   Use source-exact keys so arbitrary user data and Supabase diagnostics stay intact. */
export const DASHBOARD_COPY=Object.freeze(Object.fromEntries([
 ["Cloud-Stand noch nicht geprüft.","Cloud state not checked yet."],
 ["Cloud-Stand prüfen","Check cloud state"],
 ["Cloud-Stand bewusst laden","Load cloud state deliberately"],
 ["Anderer Cloud-Datenstand erkannt. Deine Ansicht bleibt unverändert. Zum Laden ist eine ausdrückliche Bestätigung erforderlich.","A different cloud state was detected. Your view remains unchanged. Explicit confirmation is required before loading."],
 ["Cloud-Prüfung fehlgeschlagen. Bitte neu anmelden oder Seite neu laden.","Cloud check failed. Sign in again or reload the page."],
 ["Cloud-Datenstand hat sich geändert. Bitte erneut prüfen.","The cloud state has changed. Check it again."],
 ["Cloud-Datenstand während des Ladens verändert. Bitte Seite neu laden und erneut prüfen.","The cloud state changed during loading. Reload the page and check again."],
 ["Cloud-Datenstand nach Bestätigung geladen.","Cloud state loaded after confirmation."],
 ["Cloud-Laden fehlgeschlagen. Bitte Seite neu laden.","Cloud loading failed. Reload the page."],
 ["Cloud-Datenstand laden? Die bisherige Ansicht wird ersetzt. Nicht gespeicherte Eingaben gehen verloren. Es werden keine Cloud-Daten überschrieben.","Load the cloud state? Your current view will be replaced. Unsaved input will be lost. No cloud data will be overwritten."],
 ["E-Mail-Adresse oder Passwort stimmt nicht.","The email address or password is incorrect."],
 ["Zuletzt verwendet","Recently used"],
 ["Bitte bestätige zuerst deine E-Mail-Adresse.","Confirm your email address first."],
 ["Das Passwort ist zu schwach. Wähle ein längeres Passwort.","Your password is too weak. Choose a longer password."],
 ["Zu viele Anfragen. Bitte versuche es später erneut.","Too many requests. Try again later."],
 ["Abmeldung fehlgeschlagen. Bitte versuche es erneut.","Could not sign out. Please try again."],
 [
  "Direkt zum Inhalt",
  "Skip to main content"
 ],
 [
  "Toolya Startseite",
  "Toolya home"
 ],
 [
  "Hauptnavigation",
  "Main navigation"
 ],
 [
  "Alle Tools",
  "All tools"
 ],
 [
  "Mein Dashboard",
  "My dashboard"
 ],
 [
  "Konto wird geprüft …",
  "Checking your account…"
 ],
 [
  "Anmelden oder registrieren",
  "Sign in or register"
 ],
 [
  "Einstellungen öffnen",
  "Open settings"
 ],
 [
  "Einstellungen",
  "Settings"
 ],
 [
  "Kontostatus wird geprüft …",
  "Checking account status…"
 ],
 [
  "Deine vorhandenen Browserdaten bleiben erhalten.",
  "Your existing browser data remains available."
 ],
 [
  "Datenspeicherung",
  "Data storage"
 ],
 [
  "Lokale Einträge übernehmen",
  "Import device entries"
 ],
 [
  "Erneut verbinden",
  "Reconnect"
 ],
 [
  "Anleitung zum Toolya-Dashboard",
  "Toolya dashboard guide"
 ],
 [
  "Deine Übersicht",
  "Your overview"
 ],
 [
  "★ Favoriten",
  "★ Favourites"
 ],
 [
  "↗ Zuletzt genutzt",
  "↗ Recently opened"
 ],
 [
  "✓ Offene Aufgaben",
  "✓ Open tasks"
 ],
 [
  "◷ Anstehende Termine",
  "◷ Upcoming reminders"
 ],
 [
  "★ Deine Favoriten",
  "★ Your favourites"
 ],
 [
  "Tools entdecken",
  "Explore tools"
 ],
 [
  "↗ Zuletzt verwendet",
  "↗ Recently used"
 ],
 [
  "✓ Meine Aufgaben",
  "✓ My tasks"
 ],
 [
  "Lokal oder im angemeldeten Konto",
  "On this device or in your signed-in account"
 ],
 [
  "Neue Aufgabe",
  "New task"
 ],
 [
  "Was möchtest du erledigen?",
  "What do you want to do?"
 ],
 [
  "Hinzufügen",
  "Add"
 ],
 [
  "◷ Erinnerungen",
  "◷ Reminders"
 ],
 [
  "Noch keine Push-Nachrichten",
  "No push notifications yet"
 ],
 [
  "Fällige Termine erscheinen hier, sobald du dein Dashboard öffnest. Es werden noch keine automatischen Benachrichtigungen versendet.",
  "Due reminders appear here when you open your dashboard. Automatic notifications are not currently sent."
 ],
 [
  "Woran möchtest du denken?",
  "What would you like to remember?"
 ],
 [
  "z. B. Pflanzen gießen",
  "e.g. water the plants"
 ],
 [
  "Datum und Uhrzeit",
  "Date and time"
 ],
 [
  "Erinnerung speichern",
  "Save reminder"
 ],
 [
  "💧 Gießaufgaben planen · Toolya Connect",
  "💧 Plan watering tasks · Toolya Connect"
 ],
 [
  "Pflanzenpflege öffnen",
  "Open plant care"
 ],
 [
  "Anmeldung und Gießplan werden geprüft …",
  "Checking sign-in and watering plan…"
 ],
 [
  "Gießaufgabe für Pflanze",
  "Watering task for plant"
 ],
 [
  "Gewünschter Gießtag",
  "Planned watering date"
 ],
 [
  "Im Gießplan einplanen",
  "Schedule in watering plan"
 ],
 [
  "Fällige und überfällige Gießaufgaben erscheinen oben unter „Meine Aufgaben“. Im Dashboard erledigte Gießvorgänge werden unmittelbar im Pflanzen-Tool dokumentiert.",
  "Due and overdue watering tasks appear above under “My tasks”. Waterings completed from the dashboard are recorded in the plant-care tool."
 ],
 [
  "🛒 Gemeinsame Einkaufsliste",
  "🛒 Shared shopping list"
 ],
 [
  "Liste drucken",
  "Print list"
 ],
 [
  "Einkaufslisten werden geladen …",
  "Loading shopping lists…"
 ],
 [
  "Artikel zur gemeinsamen Einkaufsliste hinzufügen",
  "Add item to shared shopping list"
 ],
 [
  "Was möchtest du einkaufen?",
  "What would you like to buy?"
 ],
 [
  "Erledigte Artikel anzeigen",
  "Show completed items"
 ],
 [
  "Einkaufsartikel aus deinen berechtigten WG-Listen und aus dem Dashboard stehen hier zusammen. Ein bestätigter WG-Artikel wird auch im WG-Organisator als gekauft markiert. Wunschlisten bleiben eigenständig.",
  "Items from your authorised household shopping lists and dashboard appear here together. Marking a household item as bought also updates the roommate organiser. Wish lists remain separate."
 ],
 [
  "⚙️ Einstellungen",
  "⚙️ Settings"
 ],
 [
  "Einstellungen schließen",
  "Close settings"
 ],
 [
  "Toolya-Konto",
  "Toolya account"
 ],
 [
  "E-Mail-Adresse",
  "Email address"
 ],
 [
  "Passwort",
  "Password"
 ],
 [
  "Passwort vergessen?",
  "Forgot password?"
 ],
 [
  "👤 Registrieren",
  "👤 Register"
 ],
 [
  "🔑 Anmelden",
  "🔑 Sign in"
 ],
 [
  "Neues Passwort (mindestens 8 Zeichen)",
  "New password (at least 8 characters)"
 ],
 [
  "Passwort wiederholen",
  "Repeat password"
 ],
 [
  "Neues Passwort speichern",
  "Save new password"
 ],
 [
  "🚪 Abmelden",
  "🚪 Sign out"
 ],
 [
  "Datensicherung",
  "Backups"
 ],
 [
  "Deine Backups findest du in den Einstellungen der Startseite.",
  "Find your backups in the homepage settings."
 ],
 [
  "Backup und Wiederherstellung öffnen",
  "Open backup and restore"
 ],
 [
  "Schließen",
  "Close"
 ],
 [
  "Angemeldet",
  "Signed in"
 ],
 [
  "Status unklar",
  "Status unknown"
 ],
 [
  "Nicht angemeldet",
  "Not signed in"
 ],
 [
  "Angemeldet – Kontoeinstellungen öffnen",
  "Signed in – open account settings"
 ],
 [
  "✅ Angemeldet",
  "✅ Signed in"
 ],
 [
  "Anmeldestatus gerade nicht verfügbar",
  "Sign-in status is currently unavailable"
 ],
 [
  "Bitte eine gültige E-Mail-Adresse eingeben.",
  "Enter a valid email address."
 ],
 [
  "Das Passwort muss mindestens 6 Zeichen lang sein.",
  "The password must be at least 6 characters."
 ],
 [
  "Wird angemeldet …",
  "Signing in…"
 ],
 [
  "Anmeldung wird geprüft …",
  "Checking sign-in…"
 ],
 [
  "Keine bestätigte Anmeldung erhalten.",
  "Sign-in could not be confirmed."
 ],
 [
  "Erfolgreich angemeldet.",
  "Signed in successfully."
 ],
 [
  "Anmeldung momentan nicht erreichbar.",
  "Sign-in service is currently unreachable."
 ],
 [
  "Registrierung erfolgreich.",
  "Registration successful."
 ],
 [
  "Registrierung eingereicht. Bitte prüfe deine E-Mails zur Bestätigung.",
  "Registration submitted. Check your email for a confirmation message."
 ],
 [
  "Registrierung momentan nicht erreichbar.",
  "Registration is currently unavailable."
 ],
 [
  "Abgemeldet.",
  "Signed out."
 ],
 [
  "Bitte erneut versuchen.",
  "Try again."
 ],
 [
  "Bitte zuerst eine gültige E-Mail-Adresse eingeben.",
  "First enter a valid email address."
 ],
 [
  "Falls ein Konto für diese E-Mail-Adresse existiert, erhältst du einen Link zum Zurücksetzen des Passworts.",
  "If an account exists for this email address, you will receive a password reset link."
 ],
 [
  "Die Anfrage konnte gerade nicht verarbeitet werden. Bitte versuche es später erneut.",
  "The request could not be processed. Please try again later."
 ],
 [
  "Bitte öffne zuerst den Link aus deiner Passwort-E-Mail.",
  "First open the link in your password reset email."
 ],
 [
  "Bitte zwei identische Passwörter mit mindestens 8 Zeichen eingeben.",
  "Enter two matching passwords of at least 8 characters."
 ],
 [
  "Passwort geändert. Bitte erneut anmelden.",
  "Password changed. Please sign in again."
 ],
 [
  "Passwort konnte nicht geändert werden. Bitte fordere einen neuen Link an.",
  "The password could not be changed. Request a new reset link."
 ],
 [
  "Passwort geändert, aber Abmelden fehlgeschlagen. Bitte melde dich manuell ab.",
  "Password changed, but signing out failed. Please sign out manually."
 ],
 [
  "Passwort konnte nicht geändert werden. Bitte fordere gegebenenfalls einen neuen Link an.",
  "The password could not be changed. Request a new reset link if needed."
 ],
 [
  "Dein Passwort wurde geändert. Du kannst dich jetzt damit anmelden.",
  "Your password has been changed. You can now sign in with it."
 ],
 [
  "Neues Passwort festlegen",
  "Set a new password"
 ],
 [
  "Anmeldung momentan nicht verfügbar.",
  "Sign-in is currently unavailable."
 ],
 [
  "Tool öffnen",
  "Open tool"
 ],
 [
  "Du hast noch keine Favoriten. Markiere deine Lieblings-Tools auf der Startseite mit einem Stern.",
  "You have no favourites yet. Use the star on the homepage to mark your favourite tools."
 ],
 [
  "Noch keine letzten Tools gespeichert. Öffne ein Tool über die Startseite oder hier im Dashboard.",
  "No recently used tools yet. Open a tool from the homepage or your dashboard."
 ],
 [
  "Lokales Speichern nicht möglich. Bitte überprüfe deinen Browser-Speicher.",
  "Unable to save locally. Check your browser storage."
 ],
 [
  "Speichern fehlgeschlagen. Es wurden keine lokalen Daten gelöscht.",
  "Saving failed. No local data was deleted."
 ],
 [
  "Eintrag wurde nicht gefunden.",
  "The entry could not be found."
 ],
 [
  "Für die gemeinsame Einkaufsliste bitte anmelden.",
  "Sign in to use the shared shopping list."
 ],
 [
  "Alle Artikel bestätigt.",
  "All items completed."
 ],
 [
  "Noch keine Einkaufsartikel vorhanden.",
  "No shopping items yet."
 ],
 [
  "Quelle",
  "Source"
 ],
 [
  "Entfernen",
  "Remove"
 ],
 [
  "Die Cloud-Anmeldung ist nicht verfügbar.",
  "Cloud sign-in is unavailable."
 ],
 [
  "Einkaufslisten werden synchronisiert …",
  "Synchronising shopping lists…"
 ],
 [
  "Teilweise geladen – bitte die Quellen prüfen. · ",
  "Partially loaded – check the sources. · "
 ],
 [
  "Bitte später erneut laden.",
  "Try loading again later."
 ],
 [
  "Änderung in Toolya Cloud bestätigt.",
  "Change confirmed in Toolya Cloud."
 ],
 [
  "Speicherkonflikt.",
  "Save conflict."
 ],
 [
  "Artikel aus dem Dashboard entfernt.",
  "Item removed from the dashboard."
 ],
 [
  "Bitte neu laden.",
  "Please refresh."
 ],
 [
  "Artikel in Toolya Cloud gespeichert.",
  "Item saved in Toolya Cloud."
 ],
 [
  "Bitte erneut versuchen.",
  "Please try again."
 ],
 [
  "Noch keine Aufgaben angelegt.",
  "No tasks added yet."
 ],
 [
  "Gießplan · ",
  "Watering plan · "
 ],
 [
  " · überfällig",
  " · overdue"
 ],
 [
  "Gegossen",
  "Watered"
 ],
 [
  "WG-Putzplan",
  "Roommate cleaning rota"
 ],
 [
  "Zur WG",
  "Open household"
 ],
 [
  "Noch keine Erinnerungen angelegt.",
  "No reminders yet."
 ],
 [
  " · Fällig",
  " · Due"
 ],
 [
  "Zum Synchronisieren bitte mit deinem Toolya-Konto anmelden.",
  "Sign in to your Toolya account to synchronise."
 ],
 [
  "Gießvorgang im Pflanzen-Tool gespeichert.",
  "Watering saved in the plant-care tool."
 ],
 [
  "Bitte Gießplan neu laden.",
  "Reload the watering plan."
 ],
 [
  "Gießplan wird geladen …",
  "Loading watering plan…"
 ],
 [
  "Toolya-Konto nicht verfügbar.",
  "Toolya account unavailable."
 ],
 [
  "Noch kein Gießplan vorhanden. Lege zuerst eine Pflanze an.",
  "No watering plan yet. Add a plant first."
 ],
 [
  "Bitte später erneut öffnen.",
  "Try opening it again later."
 ],
 [
  "Gießaufgabe im Pflanzen-Tool eingeplant.",
  "Watering scheduled in the plant-care tool."
 ],
 [
  "Bitte erneut laden.",
  "Please reload."
 ],
 [
  "Einkaufslisten bis zur bestätigten Anmeldung gesperrt.",
  "Shopping lists are locked until sign-in is confirmed."
 ],
 [
  "Für Gießaufgaben bitte anmelden.",
  "Sign in to use watering tasks."
 ],
 [
  "Gießplan bis zur bestätigten Anmeldung gesperrt.",
  "Watering plan locked until sign-in is confirmed."
 ],
 [
  "☁ Aufgaben & Erinnerungen synchronisiert",
  "☁ Tasks and reminders synchronised"
 ],
 [
  "Nur auf diesem Gerät",
  "Only on this device"
 ],
 [
  "Cloud wird geladen …",
  "Loading cloud…"
 ],
 [
  "Cloud nicht erreichbar",
  "Cloud unavailable"
 ],
 [
  "Für die geräteübergreifende Speicherung bitte anmelden.",
  "Sign in to sync across devices."
 ],
 [
  "Übernahme abgeschlossen. Lokale Browser-Einträge wurden nicht gelöscht. Wiederholte Übernahmen erzeugen keine Duplikate.",
  "Import complete. Local browser entries were not deleted. Repeated imports do not create duplicates."
 ],
 [
  "Übernahme fehlgeschlagen. Browserdaten bleiben erhalten.",
  "Import failed. Browser data remains unchanged."
 ],
 [
  "Haushaltsbuch",
  "Household budget"
 ],
 [
  "Umzugskisten",
  "Moving boxes"
 ],
 [
  "Pflanzenpflege",
  "Plant care"
 ],
 [
  "WG-Organisator",
  "Roommate organiser"
 ],
 [
  "Digitaler Nachlass",
  "Digital estate"
 ],
 [
  "Autokosten",
  "Vehicle costs"
 ],
 [
  "Tiergesundheit",
  "Pet health"
 ],
 [
  "Parkplatz-Merker",
  "Parking saver"
 ],
 [
  "Verliehene Dinge",
  "Lent items"
 ],
 [
  "Zählerstände",
  "Meter readings"
 ],
 [
  "Backform-Rechner",
  "Cake pan calculator"
 ]
]));
const reverse=Object.freeze(Object.fromEntries(Object.entries(DASHBOARD_COPY).map(([de,en])=>[en,de])));
const prefixes=[
 ["Cloud-Datenstand ist unverändert (Revision ","Cloud state unchanged (revision "],
 [
  "Abmeldung fehlgeschlagen: ",
  "Sign-out failed: "
 ],
 [
  "Anmeldung fehlgeschlagen: ",
  "Sign-in failed: "
 ],
 [
  "Registrierung fehlgeschlagen: ",
  "Registration failed: "
 ],
 [
  "Einkaufslisten nicht vollständig verfügbar: ",
  "Shopping lists not fully available: "
 ],
 [
  "Änderung nicht bestätigt: ",
  "Change not confirmed: "
 ],
 [
  "Entfernen nicht bestätigt: ",
  "Removal not confirmed: "
 ],
 [
  "Artikel nicht gespeichert: ",
  "Item not saved: "
 ],
 [
  "Gießvorgang nicht bestätigt: ",
  "Watering not confirmed: "
 ],
 [
  "Gießplan nicht verfügbar: ",
  "Watering plan unavailable: "
 ],
 [
  "Planung nicht gespeichert: ",
  "Scheduling not saved: "
 ],
 [
  "Artikel entfernen: ",
  "Remove item: "
 ],
 [
  "Aufgabe entfernen: ",
  "Remove task: "
 ],
 [
  "Erinnerung entfernen: ",
  "Remove reminder: "
 ],
 [
  "Aufgabe ",
  "Task "
 ],
 [
  "Erinnerung ",
  "Reminder "
 ],
 [
  "WG-Aufgabe ",
  "Roommate task "
 ],
 [
  "Gießaufgaben aus Toolya Cloud · ",
  "Watering tasks from Toolya Cloud · "
 ],
 [
  "Noch kein Gießplan vorhanden. Lege zuerst eine Pflanze an.",
  "No watering plan yet. Add a plant first."
 ]
];
export function dashboardLocale(){
 const value=globalThis.__toolyaDashboardLocale;
 if(value==='en'||value==='de')return value;
 try{const url=new URL(globalThis.location?.href||'https://toolya.app/dashboard/');
   const requested=url.searchParams.get('lang');
   if(requested==='en'||requested==='de')return requested;
   return globalThis.localStorage?.getItem('toolya-locale-v1')==='en'?'en':'de';
 }catch{return 'de'}
}
export function dashboardText(value,lang=dashboardLocale()){
 if(typeof value!=='string')return value;
 const table=lang==='en'?DASHBOARD_COPY:reverse;
 if(Object.hasOwn(table,value))return table[value];
 const pairs=lang==='en'?prefixes:prefixes.map(([de,en])=>[en,de]);
 for(const [before,after] of pairs)if(value.startsWith(before))return after+value.slice(before.length);
 const match=/^(\d+) offene Artikel aus (\d+) Quellen\.$/.exec(value);
 if(lang==='en'&&match)return match[1]+' open items from '+match[2]+' sources.';
 const back=/^(\d+) open items from (\d+) sources\.$/.exec(value);
 if(lang==='de'&&back)return back[1]+' offene Artikel aus '+back[2]+' Quellen.';
 return value;
}
export function dashboardDateLocale(){return dashboardLocale()==='en'?'en-GB':'de-DE'}
