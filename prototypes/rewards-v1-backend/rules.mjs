// Offline-only Rewards V1 badge/summary calculation. Not an authorization boundary.
// The ONLY authoritative award source must be a verified, protected server ledger.
export const COMPETENCIES = Object.freeze(['organisation','finanzen','fuersorge','planung','vorsorge']);
export const FIRST_BOX_EVENT = Object.freeze({
  eventType:'moving.first_box_saved.v1',
  toolId:'umzugskisten-inventar',
  competency:'organisation', xp:20, kp:10
});
export const BADGES = Object.freeze([
  {id:'first_success',title:'Erster Schritt'},
  {id:'three_tools',title:'Neugierig'},
  {id:'five_tools',title:'Vielseitig'},
  {id:'organization_30',title:'Strukturiert'},
  {id:'finance_30',title:'Mit Überblick'},
  {id:'care_20',title:'Achtsam'},
  {id:'planning_20',title:'Durchdacht'},
  {id:'prepared_20',title:'Vorbereitet'},
  {id:'three_days',title:'Beständig'}
]);
const cappedInteger = v => Number.isSafeInteger(v) && v >= 0 && v <= 20;
const validDate = s => typeof s==='string' && /^\d{4}-\d\d-\d\dT/.test(s) && !Number.isNaN(Date.parse(s));
/**
 * Pure projection for deterministic isolated unit tests.
 * ledger MUST be server-side, already verified event records.
 * Do not pass client-created data into this function for awarding points.
 */
export function summarizeVerifiedLedger(ledger) {
  if (!Array.isArray(ledger)) throw new TypeError('Ledger must be an array');
  const seen = new Set(), tools = new Set(), days = new Set();
  const kp = Object.fromEntries(COMPETENCIES.map(name=>[name,0]));
  let xp = 0;
  for (const event of ledger) {
    if (!event || typeof event.eventType!=='string' || typeof event.toolId!=='string' ||
        !COMPETENCIES.includes(event.competency) || !cappedInteger(event.xp) ||
        !cappedInteger(event.kp) || !validDate(event.awardedAt) ||
        typeof event.eventKey!=='string' || !event.eventKey.trim())
      throw new TypeError('Invalid verified event');
    if (seen.has(event.eventKey)) throw new Error('Duplicate event key in verified ledger');
    seen.add(event.eventKey);
    xp += event.xp;
    kp[event.competency] += event.kp;
    // Only audited first-success types should count toward tool diversity;
    // never arbitrary saved state or repeat events.
    if (event.eventType.endsWith('.first_success.v1') || event.eventType==='moving.first_box_saved.v1')
      tools.add(event.toolId);
    days.add(new Date(event.awardedAt).toISOString().slice(0,10)); // UTC day, documented.
  }
  const badges = [];
  const mark=(condition,id)=>{if(condition)badges.push(id)};
  mark(ledger.length>0,'first_success');
  mark(tools.size>=3,'three_tools');
  mark(tools.size>=5,'five_tools');
  mark(kp.organisation>=30,'organization_30');
  mark(kp.finanzen>=30,'finance_30');
  mark(kp.fuersorge>=20,'care_20');
  mark(kp.planung>=20,'planning_20');
  mark(kp.vorsorge>=20,'prepared_20');
  mark(days.size>=3,'three_days');
  return Object.freeze({xp,kp:Object.freeze(kp),badges:Object.freeze(badges),confirmedEvents:ledger.length,distinctTools:tools.size});
}
