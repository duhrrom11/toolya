import {profileIdentity} from './profile-identity.mjs';
import {amazonListUrl} from './public-profile-model.mjs';
import {guardedWishlistWrite} from './wishlist-auth.mjs';
import {action, directoryUrl, editorUrl, element, httpsUrl, identityId, mascotUrl, translate as t, verifiedAccount} from './directory-links.mjs';

const profilesPanel = document.getElementById('wish-profiles');
const cardsPanel = document.getElementById('wish-cards');
const db = window.toolyaAccountClient;
let account, profiles = [], lists = [], drafts = [], view = 'overview', editing = null, pendingList;
let sequence = 0, busy = false, loadError = false;
const visibility = [
  ['private', 'Privat'],
  ['directory', 'Im Verzeichnis auffindbar'],
  ['link', 'Über den Link erreichbar']
];
const requestedAdd = new URLSearchParams(location.search).get('wishes') === 'add';

function link(label, href) {
  return element('a', t(label), {href});
}

function field(form, name, label, value, options = {}) {
  const wrapper = element('label', t(label));
  const input = element('input', '', {name, type: options.type || 'text', maxlength: options.max || 80});
  input.required = !!options.required;
  input.value = value ?? '';
  wrapper.append(input);
  form.append(wrapper);
  return input;
}

function select(form, name, label, options, value) {
  const field = element('label', t(label));
  const input = element('select', '', {name});
  for (const [key, text] of options) input.append(element('option', text, {value: key}));
  input.value = value || options[0]?.[0] || '';
  input.required = true;
  field.append(input);
  form.append(field);
  return input;
}

function checkbox(form, name, label, checked) {
  const labelNode = element('label');
  const input = element('input', '', {type: 'checkbox', name});
  input.checked = !!checked;
  labelNode.append(input, ' ' + t(label));
  form.append(labelNode);
}

function status(root, message) {
  root.querySelector('[role=status]').textContent = t(message);
}

function open(next, record = null) {
  editing = record;
  view = next;
  render();
  (profilesPanel.querySelector('h3[tabindex]') || profilesPanel.querySelector('h2'))?.focus();
}

function beginList() {
  if (profiles.length) return open('list');
  pendingList = true;
  open('profile');
}

function drawProfileForm(root) {
  const p = editing || {};
  root.append(element('h3', t(editing ? 'Profil bearbeiten' : 'Profil anlegen'), {tabindex: '-1'}));
  if (pendingList) root.append(element('p', t('Lege zuerst ein Profil an. Danach kannst du deine Amazon-Wunschliste hinzufügen.')));
  const form = element('form', '', {class: 'wish-edit-form'});
  const available = [['person', 'Für mich'], ['organization', 'Für einen Verein']]
    .filter(([kind]) => p.kind === kind || !profiles.some(profile => profile.kind === kind));
  const type = select(form, 'kind', 'Profilart', available.map(([key, label]) => [key, t(label)]), p.kind === 'legacy' ? 'organization' : p.kind);
  if (!type.value) type.selectedIndex = 0;
  if (p.kind === 'legacy') root.append(element('p', t('Wähle die Profilart für deinen bisherigen Eintrag. Die Adresse bleibt erhalten.')));
  const first = field(form, 'first', 'Vorname', p.first_name);
  const last = field(form, 'last', 'Nachname', p.last_name);
  const organization = field(form, 'organization', 'Vereinsname', p.organization_name || (p.kind === 'legacy' ? p.display_name : ''));
  field(form, 'country', 'Land', p.country, {required: true});
  const image = field(form, 'image', 'Link zum Profilfoto oder Vereinslogo', p.image_url, {type: 'url', max: 2048});
  const preview = element('img', '', {class: 'wish-avatar-preview', alt: '', referrerpolicy: 'no-referrer', width: 96, height: 96});
  preview.onerror = () => { if (preview.src !== mascotUrl()) preview.src = mascotUrl(); };
  const showImage = () => { preview.src = httpsUrl(image.value) || mascotUrl(); };
  image.addEventListener('input', showImage);
  showImage();
  form.append(preview);
  const website = field(form, 'website', 'Website des Vereins', p.website, {type: 'url', max: 2048});
  select(form, 'visibility', 'Sichtbarkeit', visibility.map(([key, label]) => [key, t(label)]), p.visibility);
  checkbox(form, 'showOther', 'Weitere öffentliche Listen unter geteilten Listen anzeigen', p.show_other_lists);
  const adjust = () => {
    const personal = type.value === 'person';
    for (const input of [first, last]) { input.parentElement.hidden = !personal; input.required = personal; }
    organization.parentElement.hidden = personal;
    organization.required = !personal;
    website.parentElement.hidden = personal;
  };
  type.onchange = adjust;
  adjust();
  const notice = element('p', '', {class: 'hint'});
  form.append(notice);
  const showNotice = () => {
    const values = new FormData(form);
    const name = type.value === 'person' ? [first.value, last.value].filter(Boolean).join(' ') : organization.value;
    const publicFields = [name, values.get('country'), p.city, p.bio, image.value, type.value === 'organization' && website.value].filter(Boolean);
    notice.textContent = values.get('visibility') === 'private'
      ? t('Dieses Profil ist nur für dich sichtbar.')
      : t('Diese Angaben werden öffentlich sichtbar') + '\n' + publicFields.join(' · ') + '\n' + t('Deine Toolya-Kontodaten bleiben privat.');
  };
  form.addEventListener('input', showNotice);
  form.addEventListener('change', showNotice);
  showNotice();
  finishForm(root, form, async values => {
    let identity;
    try {
      identity = profileIdentity(values.get('kind'), values.get('first'), values.get('last'), values.get('organization'), values.get('country'));
    } catch (error) {
      throw new RangeError(error.message);
    }
    const imageUrl = httpsUrl(values.get('image'));
    const siteUrl = identity.profile_kind === 'organization' ? httpsUrl(values.get('website')) : '';
    if ((values.get('image') && !imageUrl) || (identity.profile_kind === 'organization' && values.get('website') && !siteUrl)) {
      throw new RangeError('Bitte verwende einen gültigen HTTPS-Link.');
    }
    const {profile_kind: kind, ...fields} = identity;
    return {
      table: 'wishlist_directory_profiles', record: p,
      data: {...fields, kind, image_url: imageUrl, website: siteUrl, visibility: values.get('visibility'), show_other_lists: values.has('showOther')}
    };
  }, async () => {
    if (pendingList) { pendingList = false; open('list'); }
    else open('overview');
  });
}

function drawListForm(root) {
  const list = editing || {};
  root.append(element('h3', t(editing ? 'Wunschliste bearbeiten' : 'Amazon-Wunschliste hinzufügen'), {tabindex: '-1'}));
  root.append(element('p', t('Erstelle und veröffentliche die Originalliste bei Amazon. Füge ihren Link anschließend hier ein.')));
  const form = element('form', '', {class: 'wish-edit-form'});
  const options = profiles.map(p => [p.id, p.display_name]);
  if (profiles.length > 1) options.unshift(['', t('Profil auswählen')]);
  const profile = select(form, 'profile', 'Profil', options, list.profile_id);
  profile.parentElement.hidden = profiles.length === 1;
  field(form, 'name', 'Name der Wunschliste', list.name, {required: true, max: 100});
  field(form, 'url', 'Amazon-Wunschlisten-Link', list.url, {type: 'url', required: true, max: 2048});
  field(form, 'occasion', 'Anlass', list.occasion);
  const mode = select(form, 'visibility', 'Sichtbarkeit', visibility.map(([key, label]) => [key, t(label)]), list.visibility);
  const notice = element('p', '', {class: 'hint'});
  const updateNotice = () => {
    const p = profiles.find(item => item.id === profile.value);
    notice.textContent = t(mode.value === 'private' ? 'Diese Liste ist privat.'
      : p?.visibility === 'private' ? 'Die Liste wird erst erreichbar, wenn auch dein Profil veröffentlicht ist.'
      : 'Listenname, Anlass und der Amazon-Link werden öffentlich sichtbar.');
    if (mode.value !== 'private' && p?.visibility !== 'private') {
      notice.textContent += '\n' + [form.elements.name.value, form.elements.occasion.value, form.elements.url.value].filter(Boolean).join(' · ');
    }
  };
  form.addEventListener('input', updateNotice);
  form.addEventListener('change', updateNotice);
  updateNotice();
  form.append(notice);
  finishForm(root, form, async values => {
    const url = amazonListUrl(values.get('url'));
    if (!url) throw new RangeError('Bitte gib einen gültigen Amazon-Wunschlisten-Link ein.');
    return {
      table: 'wishlist_directory_lists', record: list,
      data: {profile_id: profile.value, name: values.get('name').trim(), occasion: values.get('occasion').trim(), url, visibility: mode.value}
    };
  }, () => open('overview'));
}

function finishForm(root, form, payload, next) {
  const save = element('button', t('Speichern'), {type: 'submit'});
  const cancel = action('Abbrechen', () => { pendingList = false; open('overview'); });
  const controls = element('div', '', {class: 'wish-edit-actions'});
  controls.append(save, cancel);
  form.append(controls);
  root.append(form);
  form.onsubmit = async event => {
    event.preventDefault();
    if (busy || !account) return;
    const owner = account.id;
    busy = save.disabled = cancel.disabled = true;
    try {
      const {table, record, data} = await payload(new FormData(form));
      const result = await guardedWishlistWrite(db, owner, () => {
        const query = db.from(table);
        const write = record.id ? query.update(data).eq('id', record.id) : query.insert(data);
        return write.select('*').single();
      });
      if (result.error || !result.data) throw result.error || new Error();
      if (account?.id !== owner) return;
      if (table === 'wishlist_directory_profiles') profiles = [...profiles.filter(p => p.id !== result.data.id), result.data];
      else lists = [...lists.filter(l => l.id !== result.data.id), result.data];
      await next();
      status(profilesPanel, 'Gespeichert.');
    } catch (error) {
      if (account?.id === owner) {
        const accountChanged = error.message === 'Anmeldung nicht gültig oder Konto gewechselt.';
        status(profilesPanel, accountChanged || error instanceof RangeError ? error.message : 'Speichern konnte nicht bestätigt werden. Bitte versuche es erneut.');
      }
    } finally {
      busy = save.disabled = cancel.disabled = false;
    }
  };
}

async function withdraw(table, record) {
  if (busy || !account || !window.confirm(t('Diesen Eintrag zurückziehen?'))) return;
  const owner = account.id;
  busy = true;
  try {
    const result = await guardedWishlistWrite(db, owner, () => db.from(table)
      .update({visibility:'private'}).eq('id',record.id).select('id').single());
    if (result.error || !result.data) throw result.error || new Error();
    if (account?.id !== owner) return;
    record.visibility = 'private';
    render();
    status(profilesPanel, 'Eintrag zurückgezogen.');
  } catch {
    if (account?.id === owner) status(profilesPanel, 'Speichern konnte nicht bestätigt werden. Bitte versuche es erneut.');
  } finally { busy = false; }
}

function render() {
  profilesPanel.replaceChildren(element('h2', t('Meine Profile'), {tabindex: '-1'}));
  cardsPanel.replaceChildren(element('h2', t('Meine Karten')));
  for (const panel of [profilesPanel, cardsPanel]) panel.append(element('p', '', {role: 'status'}));
  if (account === undefined) {
    for (const panel of [profilesPanel, cardsPanel]) status(panel, 'Konto wird geprüft …');
    return;
  }
  if (!account) {
    for (const panel of [profilesPanel, cardsPanel]) panel.append(action('Anmelden', () => window.openSettings()));
    return;
  }
  if (loadError) {
    for (const panel of [profilesPanel, cardsPanel]) panel.append(action('Erneut versuchen', () => load(window.toolyaAccountState, true)));
    status(profilesPanel, 'Deine Profile konnten nicht geladen werden.');
    status(cardsPanel, 'Deine Karten konnten nicht geladen werden.');
    return;
  }
  if (view === 'loading') {
    for (const panel of [profilesPanel, cardsPanel]) status(panel, 'Wird geladen …');
    return;
  }
  cardsPanel.append(link('Karte erstellen', editorUrl()));
  if (!drafts.length) cardsPanel.append(element('p', t('Du hast noch keine gespeicherten Karten.')));
  for (const draft of drafts) {
    const row = element('p');
    row.append(element('a', draft.title, {href: editorUrl(null, null, draft.id)}));
    cardsPanel.append(row);
  }
  if (view === 'profile') return drawProfileForm(profilesPanel);
  if (view === 'list') return drawListForm(profilesPanel);
  const actions = element('div', '', {class: 'wish-edit-actions'});
  if (!profiles.some(p => p.kind === 'legacy') && profiles.length < 2) actions.append(action('Profil anlegen', () => open('profile')));
  if (profiles.some(p => p.kind === 'legacy')) actions.append(action('Bisheriges Profil vervollständigen', () => open('profile', profiles.find(p => p.kind === 'legacy'))));
  actions.append(action('Amazon-Wunschliste hinzufügen', beginList));
  profilesPanel.append(actions);
  for (const p of profiles) {
    const item = element('article', '', {class: 'wish-managed-profile'});
    const headline = element('h3', p.display_name, {dir: 'auto'});
    item.append(headline, element('p', t(visibility.find(([value]) => value === p.visibility)?.[1])));
    const controls = element('div', '', {class: 'wish-edit-actions'});
    controls.append(action('Profil bearbeiten', () => open('profile', p)));
    if (p.visibility !== 'private') controls.append(link('Profil ansehen', directoryUrl('profile', p.id, location.origin)),
      action('Profil zurückziehen', () => void withdraw('wishlist_directory_profiles', p)));
    item.append(controls);
    for (const l of lists.filter(l => l.profile_id === p.id)) {
      const row = element('div', '', {class: 'wish-managed-list'});
      row.append(element('strong', l.name, {dir: 'auto'}), element('span', t(visibility.find(([value]) => value === l.visibility)?.[1])));
      row.append(action('Liste bearbeiten', () => open('list', l)));
      if (l.visibility !== 'private') {
        if (p.visibility !== 'private') row.append(link('Liste ansehen', directoryUrl('list', l.id, location.origin)));
        row.append(action('Liste zurückziehen', () => void withdraw('wishlist_directory_lists', l)));
      }
      item.append(row);
    }
    profilesPanel.append(item);
  }
}

async function load(state, force = false) {
  const next = verifiedAccount(state) || null;
  if (!force && account !== undefined && account?.id === next?.id) return;
  account = next;
  const g = ++sequence;
  profiles = []; lists = []; drafts = []; loadError = false; editing = null; pendingList = false;
  view = 'loading';
  render();
  if (!account) return;
  if (!db) { loadError = true; render(); return; }
  try {
    const results = await Promise.all([
      db.from('wishlist_directory_profiles').select('*').order('created_at'),
      db.from('wishlist_directory_lists').select('*').order('created_at'),
      db.from('wishlist_card_drafts').select('id,title').order('updated_at', {ascending: false})
    ]);
    if (g !== sequence) return;
    if (results.some(result => result.error)) throw new Error();
    [profiles, lists, drafts] = results.map(result => result.data || []);
    view = 'overview';
    if (requestedAdd && location.hash === '#wish-profiles') beginList();
    else render();
  } catch {
    if (g !== sequence) return;
    loadError = true;
    render();
  }
}

document.addEventListener('toolya:account-state', event => void load(event.detail));
document.addEventListener('toolya:dashboard-locale-change', () => {
  const form = profilesPanel.querySelector('form');
  if (!form) { render(); return; }
  if (busy) return;
  const controls = Array.from(form.elements).filter(input => input.name);
  const focus = document.activeElement?.name;
  render();
  const translated = profilesPanel.querySelector('form');
  for (const input of controls) {
    const replacement = translated.elements.namedItem(input.name);
    replacement.value = input.value;
    if (input.type === 'checkbox') replacement.checked = input.checked;
  }
  translated.querySelector('select')?.dispatchEvent(new Event('change', {bubbles:true}));
  if (focus) translated.elements.namedItem(focus)?.focus();
});

render();
if (window.toolyaAccountState) void load(window.toolyaAccountState);
