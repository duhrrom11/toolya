import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { dashboardText } from '../../shared/toolya/i18n/dashboard-copy.mjs';

const source = readFileSync(new URL('../../dashboard/account-settings.js', import.meta.url), 'utf8');
const helper = source.slice(source.indexOf('function accountErrorMessage'), source.indexOf('function renderUser'));
const message = runInNewContext(helper + '\naccountErrorMessage;');

test('dashboard account errors translate in both directions and unknown errors use the action fallback', () => {
  for (const [code, [de, en]] of Object.entries({
  "invalid_credentials": [
    "E-Mail-Adresse oder Passwort stimmt nicht.",
    "The email address or password is incorrect."
  ],
  "email_not_confirmed": [
    "Bitte bestätige zuerst deine E-Mail-Adresse.",
    "Confirm your email address first."
  ],
  "weak_password": [
    "Das Passwort ist zu schwach. Wähle ein längeres Passwort.",
    "Your password is too weak. Choose a longer password."
  ],
  "over_request_rate_limit": [
    "Zu viele Anfragen. Bitte versuche es später erneut.",
    "Too many requests. Try again later."
  ],
  "over_email_send_rate_limit": [
    "Zu viele Anfragen. Bitte versuche es später erneut.",
    "Too many requests. Try again later."
  ]
})) {
    assert.equal(message({ code }, 'fallback'), de);
    assert.equal(dashboardText(de, 'en'), en);
    assert.equal(dashboardText(en, 'de'), de);
  }
  const fallback = "Abmeldung fehlgeschlagen. Bitte versuche es erneut.";
  assert.equal(message({ message: 'raw fixture' }, fallback), fallback);
  assert.equal(dashboardText(fallback, 'en'), "Could not sign out. Please try again.");
});
