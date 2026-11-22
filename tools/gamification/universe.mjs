import { authClient, installCountries, profileValues, t, translate } from '../../shared/toolya/universe-account.mjs';
import { chapter, decor, progress, ranks, regions } from './world.mjs';

translate({
  skip: ['Zum Inhalt', 'Skip to content'], tools: ['Alle Tools', 'All tools'],
  title: ['Die Nebelinseln', 'The Mist Isles'],
  intro: ['Zwölf Inseln schweben über dem Nebel. Seit letzter Nacht fehlt das Licht, das sie verbindet. In einem Papierboot wartet die erste Spur.', 'Twelve islands float above the mist. Last night the light that connects them disappeared. The first clue awaits in a paper boat.'],
  map: ['Landkarte', 'Map'], adventure: ['Abenteuer', 'Adventure'], hideout: ['Dein Versteck', 'Your hideout'],
  signin: ['Anmelden', 'Sign in'],
  secret: ['Blick aus dem Fenster', 'Look out the window'],
  'secret-text': ['Unter dem Nebel blinkt ein Licht zurück. Jemand auf einer Insel ohne Namen hat die Laterne gesehen.', 'A light blinks back from beneath the mist. Someone on an unnamed island saw the lantern.'],
  consent: ['Wenn du mitspielst, speichert Toolya deine Abenteuer und einmalige Tool-Erfolge in deinem Konto. Du entscheidest separat über die Rangliste.', 'If you join in, Toolya saves your adventures and one-time tool milestones to your account. The leaderboard is a separate choice.'],
  enable: ['Mitspielen', 'Join the adventure'], badges: ['Abzeichen und Fundstücke', 'Badges and finds'],
  decor: ['Dekoration', 'Decoration'], save: ['Speichern', 'Save'],
  chapter: ['Die verschwundene Laterne', 'The Missing Lantern'], question: ['Wohin gehst du?', 'Where do you go?'],
  continue: ['Weiter', 'Continue'], profile: ['Mein Profil', 'My profile'],
  private: ['Diese Angaben bleiben in deinem Konto. Die Rangliste verwendet einen eigenen Anzeigenamen.', 'These details stay in your account. The leaderboard uses a separate display name.'],
  first: ['Vorname', 'First name'], last: ['Nachname', 'Last name'],
  country: ['Land (freiwillig)', 'Country (optional)'], avatar: ['Profilbild-Link (freiwillig)', 'Profile image link (optional)'],
  rank: ['Rangliste', 'Leaderboard'],
  'rank-info': ['In der Rangliste sehen angemeldete Mitspieler deinen Anzeigenamen und deine Punkte aus allgemeinen Tools.', 'Signed-in players see your display name and points from general tools in the leaderboard.'],
  visible: ['In der Rangliste erscheinen', 'Join the leaderboard'],
  handle: ['Anzeigename (3–24 Zeichen)', 'Display name (3–24 characters)'],
  pause: ['Spiel pausieren', 'Pause the game'],
  'pause-info': ['Dein Fortschritt bleibt gespeichert. Während der Pause sammelst du keine Punkte und erscheinst in keiner Rangliste.', 'Your progress stays saved. You earn no points while paused and disappear from the leaderboard.'],
  support: ['Toolya freiwillig unterstützen', 'Support Toolya on Ko-fi'], privacy: ['Datenschutz', 'Privacy'],
  collect: ['Tool-Erfolge abholen', 'Collect tool milestones'], 'collect-quiet': ['Private Meilensteine prüfen', 'Check private milestones'],
  'quiet-info': ['Freiwillig. Toolya prüft nur, ob für Tiergesundheit ein erstes Profil oder für den Nachlass eine verschlüsselte Online-Sicherung vorhanden ist. Das Ergebnis bleibt in deinem Versteck.', 'Optional. Toolya checks only whether a first pet profile or an encrypted estate backup exists. The result stays in your hideout.'],
});
installCountries();

const $ = id => document.getElementById(id);
const client = authClient();
let state;
let account;
let request = 0;
let rankingRequest = 0;
let writing = false;
const language = new URL(location.href);
language.searchParams.set('lang', t('en', 'de'));
$('language').href = language.href;
$('language').lang = t('en', 'de');
$('language').textContent = t('English', 'Deutsch');
const home = new URL($('sign-in').href);
home.searchParams.set('next', location.pathname + location.search + location.hash);
if (t(false, true)) home.searchParams.set('lang', 'en');
$('sign-in').href = home.href;

function element(tag, value = '') {
  const node = document.createElement(tag);
  node.textContent = value;
  return node;
}

for (const region of regions) {
  const card = element('article');
  card.append(element('h3', t(...region.name)), element('p', t(...region.description)));
  const list = element('ul');
  for (const [id, de, en, toolDE, toolEN, file = 'index.html'] of region.places) {
    const row = element('li');
    const link = element('a', t(de, en));
    link.href = '../' + id + '/' + file + (t(false, true) ? '?lang=en' : '');
    row.append(link, element('span', t(toolDE, toolEN)));
    list.append(row);
  }
  card.append(list);
  $('regions').append(card);
}

function renderBuddy() {
  let preferences = {};
  try { preferences = JSON.parse(localStorage.getItem('helferlein-toolya-preferences-v1') || '{}') || {}; } catch { /* use defaults */ }
  const purple = preferences.character === 'purple';
  const pose = state?.chapter === chapter.length ? 'success' : 'welcome';
  $('buddy').src = '../../assets/toolya/universe/buddy-' + (purple ? 'purple' : 'turquoise') + '-' + pose + '.webp';
  $('buddy').hidden = !state?.active || preferences.hidden === true || preferences.buddy === false;
  $('buddy-line').hidden = $('buddy').hidden;
  $('buddy-line').textContent = purple
    ? t('Ich hab eine Karte. Gut, die Hälfte davon ist eine Einkaufsliste.', 'I have a map. Granted, half of it is a shopping list.')
    : t('Ich packe einen Kompass ein. Und zwei Kekse. Man weiß ja nie.', 'I’m packing a compass. And two cookies. Just in case.');
  $('buddy').parentElement.dataset.motion = preferences.quiet || preferences.motion === 'off' ? 'off' : 'normal';
}
window.addEventListener('storage', renderBuddy);

function renderQuest() {
  const step = chapter[state?.chapter ?? 0];
  $('quest-title').textContent = step ? t(...step.name) : t('Die Laterne brennt wieder', 'The lantern shines again');
  $('quest-text').textContent = step ? t(...step.text) : t('Über dem Nebel ziehen wieder goldene Fäden von Insel zu Insel. Das Nebellicht steht jetzt für dein Versteck bereit.', 'Golden threads once again stretch from island to island. The Mist Lantern is ready for your hideout.');
  $('quest').hidden = !state?.active || !step;
  $('answers').replaceChildren();
  step?.options.forEach((option, position) => {
    const label = element('label');
    const input = element('input');
    input.type = 'radio';
    input.name = 'answer';
    input.value = String(position);
    input.required = true;
    label.append(input, document.createTextNode(t(...option)));
    $('answers').append(label);
  });
}

function render() {
  const active = state?.active === true;
  $('enable').hidden = !state || active;
  $('player').hidden = !active;
  $('profile').hidden = !state;
  $('ranking-form').hidden = !active;
  $('pause').hidden = !active;
  $('secret').hidden = !active || state?.decor !== 'window';
  if ($('secret').hidden) $('secret').open = false;
  renderBuddy();
  renderQuest();
  if (!state) {
    $('profile-form').reset();
    $('ranking-form').reset();
    $('ranking').replaceChildren();
    $('room-symbol').textContent = '';
    return;
  }
  const profile = $('profile-form').elements;
  for (const key of ['first', 'last', 'country', 'avatar']) profile[key].value = state.profile?.[key] ?? '';
  $('ranking-form').elements.visible.checked = state.visible === true;
  $('ranking-form').elements.handle.value = state.handle ?? '';
  if (!active) {
    $('room-symbol').textContent = '';
    return;
  }
  const { level, next, percent } = progress(state.xp);
  $('level-line').textContent = t('Stufe ', 'Level ') + (level + 1) + ' · ' + t(...ranks[level]) + ' · ' + state.xp + ' XP';
  $('level-progress').value = percent;
  $('next').textContent = next ? (next - state.xp) + t(' XP bis zur nächsten Stufe', ' XP to the next level') : t('Höchste Stufe erreicht', 'Highest level reached');
  const finds = chapter.slice(0, state.chapter).map(step => t(...step.reward));
  $('badges').replaceChildren(...[...ranks.slice(1, level + 1).map(rank => t(...rank)), ...finds].map(name => element('li', name)));
  $('decor').replaceChildren(new Option(t('Ohne Dekoration', 'No decoration'), ''),
    ...decor.slice(0, state.chapter).map(([key, de, en]) => new Option(t(de, en), key)));
  $('decor').value = state.decor || '';
  $('room-symbol').textContent = decor.find(([key]) => key === state.decor)?.[3] ?? '';
}

async function rpc(name, args) {
  const { data, error } = await client.rpc('universe_' + name, args);
  if (error) throw error;
  return data;
}

async function ranking(epoch) {
  const version = ++rankingRequest;
  const results = state?.active ? await rpc('ranking') : [];
  if (epoch !== request || version !== rankingRequest) return;
  $('ranking').replaceChildren(...results.map(row => element('li', row.handle + ' · ' + row.xp + ' XP')));
}

async function load() {
  const epoch = ++request;
  state = undefined;
  account = undefined;
  $('sign-in').hidden = true;
  $('quest-result').textContent = '';
  render();
  $('status').textContent = t('Dein Konto wird geprüft …', 'Checking your account…');
  try {
    const { data, error } = await client.auth.getUser();
    if (epoch !== request) return;
    if (error && error.name !== 'AuthSessionMissingError' && error.status !== 401 && error.status !== 403) throw error;
    if (!data?.user || data.user.is_anonymous) {
      $('status').textContent = t('Melde dich an, um dein Versteck einzurichten.', 'Sign in to set up your hideout.');
      $('sign-in').hidden = false;
      return;
    }
    account = data.user.id;
    const current = await rpc('state');
    if (epoch !== request) return;
    state = current;
    render();
    $('status').textContent = '';
    await ranking(epoch);
  } catch {
    if (epoch === request) $('status').textContent = t('Der Spielstand ist gerade nicht erreichbar. Lade die Seite erneut.', 'Your game is temporarily unavailable. Reload the page to try again.');
  }
}

function submit(id, action) {
  const form = $(id);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!account || writing) return;
    const epoch = request;
    writing = true;
    const button = form.querySelector('button');
    button.disabled = true;
    $('status').textContent = '';
    $('quest-result').textContent = '';
    try {
      const response = await action(form);
      if (epoch !== request) return;
      state = response.state ?? response;
      render();
      const message = response.message ?? t('Gespeichert.', 'Saved.');
      $(id === 'quest' ? 'quest-result' : 'status').textContent = message;
      if (id === 'quest' && response.focus) {
        $('quest-title').tabIndex = -1;
        $('quest-title').focus();
      }
      void ranking(epoch).catch(() => {
        if (epoch === request) $('ranking').replaceChildren();
      });
    } catch (error) {
      if (epoch !== request) return;
      $('status').textContent = error instanceof Error && error.name === 'Error' ? error.message :
        error?.code === '23505' ? t('Dieser Anzeigename ist bereits vergeben.', 'That display name is taken.') :
        t('Die Änderung konnte nicht gespeichert werden. Bitte versuche es erneut.', 'The change could not be saved. Please try again.');
    } finally {
      button.disabled = false;
      writing = false;
    }
  });
}

submit('enable', () => rpc('toggle', { p_active: true }));
submit('pause', () => rpc('toggle', { p_active: false }));
submit('profile-form', form => rpc('save_profile', { p_profile: profileValues(form) }));
submit('ranking-form', form => rpc('visibility', {
  p_visible: form.elements.visible.checked, p_handle: form.elements.handle.value.trim(),
}));
submit('decoration', form => rpc('decorate', { p_decor: form.elements.decor.value }));
submit('collect', async () => ({ state: await rpc('collect', { p_private: false }), message: t('Deine Tool-Erfolge sind auf dem aktuellen Stand.', 'Your tool milestones are up to date.') }));
submit('collect-quiet', async () => ({ state: await rpc('collect', { p_private: true }), message: t('Private Meilensteine geprüft.', 'Private milestones checked.') }));
submit('quest', async form => {
  const before = state.chapter;
  const after = await rpc('answer', { p_step: before, p_answer: Number(new FormData(form).get('answer')) });
  return { state: after, focus: after.chapter > before, message: after.chapter > before
    ? t('Du hast eine Spur gefunden.', 'You found a clue.')
    : t('Schau dir den Hinweis noch einmal an. Du kannst es erneut versuchen.', 'Read the clue again and try another answer.') };
});
client?.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || event === 'USER_UPDATED' ||
      (event === 'SIGNED_IN' && session?.user?.id !== account)) setTimeout(load, 0);
});
void load();
