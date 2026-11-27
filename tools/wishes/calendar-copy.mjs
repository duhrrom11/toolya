// Calendar dates are stored as YYYY-MM-DD. Format presentation only, in UTC,
// so a date-only value never moves to the previous day in another timezone.
export function calendarDateLabel(value,locale){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return value;
 const date=new Date(value+'T00:00:00Z');
 if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==value)return value;
 return new Intl.DateTimeFormat(locale==='en-GB'||locale==='en'?'en-GB':'de-DE',{timeZone:'UTC',day:'2-digit',month:'2-digit',year:'numeric'}).format(date);
}
