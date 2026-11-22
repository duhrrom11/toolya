const codes = 'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' ');
const paths = new Set([
  '/', '/index.html', '/en/', '/en/index.html', '/dashboard/', '/dashboard/index.html',
  ...['baking', 'budget', 'car', 'estate', 'gamification', 'housemates', 'loans', 'meters', 'moving', 'parking', 'pet-health', 'plants', 'wishes']
    .flatMap(tool => ['/tools/' + tool + '/', '/tools/' + tool + '/index.html']),
  '/tools/wishes/public.html',
]);

export const english = new URLSearchParams(location.search).get('lang') === 'en' ||
  (!new URLSearchParams(location.search).has('lang') && location.pathname.startsWith('/en/'));
export const t = (de, en) => english ? en : de;
export function translate(copy) {
  document.documentElement.lang = t('de', 'en');
  document.querySelectorAll('[data-copy]').forEach(node => {
    const value = copy[node.dataset.copy];
    if (value) node.textContent = t(...value);
  });
}

export function safeReturn(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return null;
  try {
    const target = new URL(value, location.origin);
    return target.origin === location.origin && paths.has(target.pathname) ? target : null;
  } catch {
    return null;
  }
}

export function installCountries(parent = document) {
  const names = new Intl.DisplayNames([t('de', 'en')], { type: 'region' });
  const options = codes.map(code => [code, names.of(code)]).sort((a, b) => a[1].localeCompare(b[1], t('de', 'en')));
  parent.querySelectorAll('[data-country]').forEach(select => {
    select.replaceChildren(new Option(t('Keine Angabe', 'Prefer not to say'), ''),
      ...options.map(([code, label]) => new Option(label, code)));
  });
}

export function profileValues(form) {
  const fields = new FormData(form);
  const first = fields.get('first').trim();
  const last = fields.get('last').trim();
  const country = fields.get('country');
  const avatar = fields.get('avatar').trim();
  if (!first || !last || [first, last].some(name => Array.from(name).length > 80 || /[\p{Cc}\p{Cf}]/u.test(name))) {
    throw new Error(t('Bitte prüfe Vor- und Nachname.', 'Please check your first and last name.'));
  }
  if (country && !codes.includes(country)) throw new Error(t('Bitte wähle ein Land aus der Liste.', 'Please choose a country from the list.'));
  if (avatar) {
    let url;
    try { url = new URL(avatar); } catch { /* report below */ }
    if (!url || url.protocol !== 'https:' || !url.hostname.includes('.') || url.username || url.password || avatar.length > 1000 || /[\s\\]/u.test(avatar)) {
      throw new Error(t('Bitte verwende einen vollständigen HTTPS-Link.', 'Please use a full HTTPS link.'));
    }
  }
  return { first, last, country: country || null, avatar: avatar || null };
}

export function authClient() {
  return window.supabase?.createClient(
    'https://yheogmeaosuigyaxkwth.supabase.co',
    'sb_publishable_PK20oOPzG3AB-bd95Ji9Tg_C-MIUgyv'
  );
}
