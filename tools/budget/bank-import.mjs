import {parseCents,legacyCents,decimalCents,parseBankDate,parseCSV} from './budget-domain.mjs';
const norm=v=>String(v??'').trim().normalize('NFC').toLowerCase();
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
const equal=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
const income=r=>r.entryType==='einnahme'||r.category==='Einnahme';
const sourceKey=(source,id)=>JSON.stringify([norm(source),String(id).trim()]);
export async function decodeBankFile(file,encoding='utf-8'){
  if(file.size>5*1024*1024)throw Error('file-size');
  const bytes=await file.arrayBuffer();
  if(!['utf-8','windows-1252','utf-16le','utf-16be'].includes(encoding))throw Error('encoding');
  return new TextDecoder(encoding,{fatal:true}).decode(bytes);
}
export function bankPreview(text,config,entries=[]){
  const rows=parseCSV(text,config.delimiter);
  const headers=rows.shift()||[];
  if(!headers.length||rows.length>5000)throw Error('row-limit');
  const col=k=>Number.isInteger(config[k])&&config[k]>=0&&config[k]<headers.length;
  if(!col('date')||!col('title')||!(config.mode==='split'?col('debit')&&col('credit')&&config.debit!==config.credit:col('amount')))throw Error('mapping');
  if(!norm(config.source))throw Error('source');
  const known=new Set(entries.filter(r=>r?.bankImport?.transactionId).map(r=>sourceKey(r.bankImport.source,r.bankImport.transactionId)));
  const seen=new Set();
  const similar=(date,title,cents)=>entries.some(r=>{
    try{return r.date===date&&norm(r.title)===norm(title)&&income(r)===(cents>0)&&legacyCents(r.price)===Math.abs(cents);}catch{return false;}
  });
  const result=[];
  for(const [index,row] of rows.entries()){
    if(row.every(v=>!v.trim()))continue;
    try{
      if(row.length!==headers.length)throw Error('columns');
      const date=parseBankDate(row[config.date],config.dateFormat);
      const title=row[config.title].trim();
      if(!title||title.length>1000)throw Error('title');
      let cents;
      if(config.mode==='split'){
        const read=i=>row[i].trim()?parseCents(row[i],config.locale):0;
        const debit=read(config.debit),credit=read(config.credit);
        if(debit&&credit)throw Error('both-sides');
        cents=credit?Math.abs(credit):-Math.abs(debit);
      }else cents=parseCents(row[config.amount],config.locale)*(config.reverseSign?-1:1);
      if(!cents||legacyCents(Number(decimalCents(Math.abs(cents))))!==Math.abs(cents))throw Error('amount');
      const transactionId=col('transactionId')?row[config.transactionId].trim():'';
      const key=transactionId?sourceKey(config.source,transactionId):null;
      const duplicate=key&&(known.has(key)||seen.has(key));
      const fingerprint=JSON.stringify([date,norm(title),cents]);
      const warning=!duplicate&&(similar(date,title,cents)||seen.has(fingerprint));
      if(key)seen.add(key);seen.add(fingerprint);
      result.push({index:index+2,date,title,cents,transactionId,source:config.source.trim(),status:duplicate?'duplicate':warning?'review':'ready'});
    }catch{result.push({index:index+2,status:'invalid'});}
  }
  return result;
}
export function applyBankImport(entries,rows,batchId,now=Date.now()){
  if(!Array.isArray(entries)||!Array.isArray(rows)||!batchId)throw Error('invalid-import');
  if(entries.some(r=>r?.bankImport?.batchId===batchId))return {entries,added:0};
  const next=entries.slice();
  const known=new Set(entries.filter(r=>r?.bankImport?.transactionId).map(r=>sourceKey(r.bankImport.source,r.bankImport.transactionId)));
  const ids=new Set(entries.map(r=>r?.id));let id=now,added=0;
  for(const row of rows){
    if(!['ready','review'].includes(row.status))throw Error('invalid-row');
    if(!Number.isSafeInteger(row.cents)||!row.cents||!norm(row.source)||!norm(row.title))throw Error('invalid-row');
    parseBankDate(row.date,'ISO');
    const key=row.transactionId?sourceKey(row.source,row.transactionId):null;
    if(key&&known.has(key))continue;
    while(ids.has(id))id++;
    const price=Number(decimalCents(Math.abs(row.cents)));
    if(legacyCents(price)!==Math.abs(row.cents))throw Error('amount');
    const booking={id,date:row.date,title:row.title,store:'',price,category:row.cents>0?'Einnahme':'Sonstiges',paymentMethod:'Überweisung',warrantyMonths:0,returnDays:0,lifespan:5,sn:'',location:'',isFixkosten:false,isTax:false,note:'',entryType:row.cents>0?'einnahme':'ausgabe',photos:[],lineItems:[]};
    // Baseline includes every initial field, so any later addition or change protects the booking.
    booking.bankImport={batchId,source:row.source,transactionId:row.transactionId||'',baseline:JSON.stringify(canonical(booking))};
    next.push(booking);ids.add(id++);if(key)known.add(key);added++;
  }
  next.sort((a,b)=>String(b?.date||'').localeCompare(String(a?.date||'')));
  return {entries:next,added};
}
export function undoBankImport(entries,batchId){
  const removable=[],protectedIds=[];
  for(const r of entries){
    if(r?.bankImport?.batchId!==batchId)continue;
    const {bankImport,...booking}=r;
    let unchanged=false;
    try{unchanged=equal(booking,JSON.parse(bankImport.baseline));}catch{}
    // Protect inbound links, including later additions from related features.
    const linked=entries.some(other=>other!==r&&other&&['refundOf','transferId','linkedEntryId','bookingId','originalBookingId'].some(k=>other[k]===r.id));
    (unchanged&&!linked?removable:protectedIds).push(r.id);
  }
  const ids=new Set(removable);
  return {entries:entries.filter(r=>!ids.has(r?.id)),removable,protectedIds};
}
