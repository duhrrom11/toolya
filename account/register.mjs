import { authClient, installCountries, profileValues, safeReturn, t, translate } from '../shared/toolya/universe-account.mjs';

translate({
  title: ['Toolya-Konto erstellen', 'Create a Toolya account'],
  description: ['Mit einem Konto kannst du deine Tools auf mehreren Geräten verwenden. Dein Name bleibt privat.', 'An account lets you use your tools on multiple devices. Your name stays private.'],
  first: ['Vorname', 'First name'], last: ['Nachname', 'Last name'],
  email: ['E-Mail-Adresse', 'Email address'], password: ['Passwort (mindestens 8 Zeichen)', 'Password (at least 8 characters)'],
  country: ['Land (freiwillig)', 'Country (optional)'], avatar: ['Profilbild-Link (freiwillig)', 'Profile image link (optional)'],
  submit: ['Konto erstellen', 'Create account'], back: ['Zurück', 'Back'],
  login: ['Bereits ein Konto? Anmelden', 'Already have an account? Sign in'], privacy: ['Datenschutz', 'Privacy'],
});
installCountries();
const language = document.querySelector('#language');
const otherLanguage = new URL(location.href);
otherLanguage.searchParams.set('lang', t('en', 'de'));
language.href = otherLanguage.href;
language.lang = t('en', 'de');
language.textContent = t('English', 'Deutsch');
const form = document.querySelector('#signup');
const result = document.querySelector('#result');
const destination = safeReturn(new URLSearchParams(location.search).get('next'));
const login = new URL('../index.html?auth=required', location.href);
if (destination) {
  document.querySelector('#back').href = destination.href;
  login.searchParams.set('next', destination.pathname + destination.search + destination.hash);
}
if (t(false, true)) login.searchParams.set('lang', 'en');
document.querySelector('#login').href = login.href;

form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector('button');
  if (button.disabled) return;
  button.disabled = true;
  try {
    const profile = profileValues(form);
    const fields = new FormData(form);
    const client = authClient();
    const { data, error } = await client.auth.signUp({
      email: fields.get('email').trim(),
      password: fields.get('password'),
      options: { data: { toolya_profile: profile }, emailRedirectTo: login.href },
    });
    if (error) {
      result.textContent = t('Die Registrierung konnte nicht abgeschlossen werden. Prüfe deine Angaben und versuche es erneut.', 'Registration could not be completed. Check your details and try again.');
      return;
    }
    form.reset();
    form.hidden = true;
    result.textContent = t('Sieh in deinen E-Mails nach und bestätige deine Adresse.', 'Check your inbox to confirm your email address.');
    if (data?.session) location.assign(destination?.href || login.href);
  } catch (error) {
    result.textContent = error instanceof TypeError
      ? t('Die Anmeldung ist gerade nicht erreichbar.', 'Sign-up is temporarily unavailable.')
      : error.message;
  } finally {
    button.disabled = false;
  }
});
