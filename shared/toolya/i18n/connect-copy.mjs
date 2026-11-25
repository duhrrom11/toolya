// Only explicitly bound application copy; no record or form mutations.
const copy=Object.freeze({
  "Diese Ausgabe auch ins Haushaltsbuch übernehmen": "Also add this expense to the household budget",
  "Optional · nach dem Speichern mit Bestätigung. Belege werden nicht übertragen; Zahlungsart im Haushaltsbuch prüfen.": "Optional · after saving, with confirmation. Receipts are not transferred; check the payment method in the household budget.",
  "Optional · nur tatsächliche Kosten über 0 €. Ohne Fotos/Belege. Zahlungsart im Haushaltsbuch prüfen.": "Optional · actual expenses over €0 only. No photos or receipts. Check the payment method in the household budget.",
  "Übernahme erneut versuchen": "Retry transfer",
  "Cloud-Datenstand nicht verfügbar. Bitte neu laden.": "Cloud data unavailable. Please reload.",
  "Nur positive Ausgaben mit gültigem Centbetrag können übernommen werden.": "Only positive expenses with a valid amount in cents can be transferred.",
  "Nur positive Ausgaben mit höchstens zwei Nachkommastellen können übernommen werden.": "Only positive expenses with at most two decimal places can be transferred.",
  "Ausgabe gespeichert; Übernahme ins Haushaltsbuch abgebrochen.": "Expense saved; transfer to household budget cancelled.",
  "Ausgabe gespeichert; Übernahme nicht ausgeführt.": "Expense saved; transfer not performed.",
  "Übertragung wird von Toolya Cloud geprüft …": "Toolya Cloud is checking the transfer…",
  "Toolya Cloud prüft die Übertragung …": "Toolya Cloud is checking the transfer…",
  "Bereits übertragen – keine Doppelbuchung erstellt.": "Already transferred – no duplicate transaction created.",
  "Bereits übernommen – keine Doppelbuchung erstellt.": "Already imported – no duplicate transaction created.",
  "Übertragung in Toolya Cloud bestätigt. Zahlungsart im Haushaltsbuch prüfen.": "Transfer confirmed in Toolya Cloud. Check the payment method in the household budget.",
  "Im Haushaltsbuch bestätigt. Dort bitte die Zahlungsart prüfen.": "Confirmed in the household budget. Check the payment method there.",
  "Ausgabe gespeichert, aber keine bestätigte Übertragung. Cloud-Datenstand beider Tools prüfen, bevor du erneut überträgst.": "Expense saved, but transfer not confirmed. Check cloud data in both tools before retrying.",
  "Ausgabe gespeichert, Übertragung nicht bestätigt. Cloud-Datenstand vor erneutem Versuch prüfen.": "Expense saved, transfer not confirmed. Check cloud data before retrying."
});
export function connectText(value,lang){return lang==='en'&&Object.hasOwn(copy,value)?copy[value]:value}
export function createConnectCopy(root){
 const nodes=new Map();const doc=root.ownerDocument;
 const locale=()=>doc.defaultView?.__toolyaUILocale==='en'?'en':'de';
 const refresh=()=>{for(const [node,source] of nodes){const text=connectText(source,locale());if(node.textContent!==text)node.textContent=text}};
 doc.addEventListener('toolya:locale-change',refresh);
 return {set(node,source){nodes.set(node,source);refresh()},dispose(){doc.removeEventListener('toolya:locale-change',refresh);nodes.clear()}};
}
export function connectConfirmation(message,lang){
 if(lang!=='en'||typeof message!=='string')return message;
 const variants=[['Ausgabe auch ins Haushaltsbuch übertragen?','Also transfer this expense to the household budget?','Belege werden nicht übertragen. Zahlungsart anschließend prüfen.','Receipts are not transferred. Check the payment method afterwards.'],['Ausgabe ins Haushaltsbuch übernehmen?','Transfer this expense to the household budget?','Ohne Foto/Beleg. Zahlungsart danach prüfen.','No photo or receipt is transferred. Check the payment method afterwards.']];
 for(const [de,en,endDE,endEN] of variants){const start=de+'\n\n',end='\n\n'+endDE;if(message.startsWith(start)&&message.endsWith(end))return en+'\n\n'+message.slice(start.length,-end.length)+'\n\n'+endEN}
 return message;
}
