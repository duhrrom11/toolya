import {readAppLocale} from '../../shared/toolya/i18n/locale.mjs';
import {wishesText} from '../../shared/toolya/i18n/wishes-copy.mjs';

export const identityId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const homeUrl = 'https://toolya.app/';
export const directoryPath = '/tools/wishes/public.html';
export const translate = value => wishesText(value, readAppLocale());

export function directoryUrl(kind, id, base = homeUrl) {
  const target = new URL(directoryPath, base);
  if (['profile', 'list'].includes(kind) && identityId.test(id)) target.searchParams.set(kind, id);
  return target;
}

export function editorUrl(kind, id, draft) {
  const target = directoryUrl(kind, id, location.origin);
  target.searchParams.set('card', '1');
  if (identityId.test(draft || '')) target.searchParams.set('draft', draft);
  return target;
}

export function httpsUrl(value) {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' && !url.username && !url.password && !url.port ? url.href : '';
  } catch {
    return '';
  }
}

export function mascotUrl() {
  const character = window.toolyaBuddy?.character === 'purple' ? 'purple' : 'turquoise';
  return new URL('../../assets/toolya/headers/toolya_wishlist_' + character + '_welcome_400.webp', import.meta.url).href;
}

export function element(tag, content = '', attributes = {}) {
  const node = document.createElement(tag);
  node.textContent = content;
  for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
  return node;
}

export function action(label, callback) {
  const button = element('button', translate(label), {type: 'button'});
  button.onclick = callback;
  return button;
}

export function verifiedAccount(state = window.toolyaAccountState) {
  return state && !state.error && !state.recovery && !state.user?.is_anonymous ? state.user : null;
}
