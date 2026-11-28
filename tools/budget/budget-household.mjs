import {legacyCents} from './budget-domain.mjs';
import {requireVerifiedUser} from '../../shared/toolya/cloud-auth-gate.mjs';
const uuid=v=>{if(typeof v!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v))throw Error('invalid id');return v;};
export function sharedBooking(householdId,authorId,booking){
 const title=String(booking.title||'').trim(),cents=legacyCents(booking.price);
 if(!Number.isSafeInteger(booking.id)||booking.id<0||!title||title.length>200||cents<=0||booking.transferId!=null||booking.refundOf!=null||booking.entryType==='einnahme'||booking.category==='Einnahme')throw Error('invalid expense');
 const d=new Date(booking.date+'T00:00:00Z');if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==booking.date)throw Error('invalid date');
 return {household_id:uuid(householdId),author_id:uuid(authorId),booking_id:booking.id,title,booking_date:booking.date,cents};
}
export function createHouseholdApi(client){
 const check=async expected=>{const u=await requireVerifiedUser(client);if(expected&&u.id!==expected)throw Error('account changed');return u.id;};
 const result=async(query,uid)=>{const r=await query;await check(uid);if(r.error)throw r.error;return r.data;};
 return {
 async identity(){return check();},
 async list(uid){await check(uid);const households=await result(client.from('budget_households').select('id,owner_id,title'),uid);const invites=await result(client.from('budget_household_invites').select('household_id,owner_id,invitee_id,accepted'),uid);const shares=await result(client.from('budget_household_shares').select('household_id,author_id,booking_id,title,booking_date,cents'),uid);return {households,invites,shares};},
 async create(uid,title){await check(uid);title=String(title).trim();if(!title||title.length>120)throw Error('title');return result(client.from('budget_households').insert({owner_id:uid,title}).select('id').single(),uid);},
 async invite(uid,household,invitee){await check(uid);return result(client.from('budget_household_invites').insert({household_id:uuid(household),owner_id:uid,invitee_id:uuid(invitee)}).select('household_id').single(),uid);},
 async accept(uid,household){await check(uid);return result(client.from('budget_household_invites').update({accepted:true}).eq('household_id',uuid(household)).eq('invitee_id',uid).select('household_id').single(),uid);},
 async revokeMember(uid,household,invitee){await check(uid);return result(client.from('budget_household_invites').delete().eq('household_id',uuid(household)).eq('invitee_id',uuid(invitee)).select('household_id').single(),uid);},
 async share(uid,household,booking){await check(uid);return result(client.from('budget_household_shares').insert(sharedBooking(household,uid,booking)).select('booking_id').single(),uid);},
 async revokeShare(uid,household,id){await check(uid);return result(client.from('budget_household_shares').delete().eq('household_id',uuid(household)).eq('author_id',uid).eq('booking_id',id).select('booking_id').single(),uid);}
 };
}
