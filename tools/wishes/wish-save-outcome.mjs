// Pure presentation logic: never writes to Supabase or localStorage.
export function wishSaveOutcome({editing=false,extrasSaved,assignmentError=false}={}){
 if(typeof extrasSaved!=='boolean')throw new TypeError('extrasSaved muss boolean sein');
 if(editing){
  return {type:extrasSaved?'success':'warning',message:extrasSaved?'Wunsch aktualisiert.':'Wunsch aktualisiert, aber Zusatzdaten konnten auf diesem Gerät nicht gespeichert werden. Bitte nur die Zusatzdaten erneut bearbeiten; den Wunsch nicht erneut anlegen.'};
 }
 const message=[assignmentError?'Wunsch gespeichert, aber die Listenzuordnung ist fehlgeschlagen. Bitte in der Listenverwaltung erneut zuordnen.':'Wunsch gespeichert',...(!extrasSaved?['Zusatzdaten konnten auf diesem Gerät nicht gespeichert werden. Bitte den bestehenden Wunsch bearbeiten, nicht erneut anlegen.']:[])].join(' ');
 return {type:assignmentError||!extrasSaved?'warning':'success',message};
}
