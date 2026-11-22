// Check the account before exposing the private tool UI.
(() => {
  const root = document.documentElement;
  const home = new URL('../../index.html?auth=required', location.href);
  const reject = () => {
    const explicit = new URLSearchParams(window.location.search).get('lang');
    let language = explicit;
    if (language !== 'de' && language !== 'en') {
      try { language = window.localStorage.getItem('toolya-locale-v1'); } catch { language = null; }
    }
    if (language === 'en') home.searchParams.set('lang', 'en');
    home.searchParams.set('next', location.pathname + location.search + location.hash);
    window.location.replace(home.href);
  };
  const unavailable = () => root.classList.add('toolya-auth-unavailable');

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('toolya-auth-retry')?.addEventListener('click', () => window.location.reload());
  }, { once: true });

  if (!window.supabase?.createClient) {
    unavailable();
    return;
  }

  const client=window.supabase.createClient('https://yheogmeaosuigyaxkwth.supabase.co','sb_publishable_PK20oOPzG3AB-bd95Ji9Tg_C-MIUgyv');
  let finished = false;
  const timeout = setTimeout(() => {
    finished = true;
    unavailable();
  }, 8000);

  client.auth.getUser().then(({ data, error }) => {
    if (finished) return;
    finished = true;
    clearTimeout(timeout);

    if (error && error.name !== 'AuthSessionMissingError' && error.status !== 401 && error.status !== 403) {
      unavailable();
      return;
    }
    if (error || !data?.user?.id || data.user.is_anonymous) {
      reject();
      return;
    }

    root.classList.remove('toolya-auth-pending');
    window.dispatchEvent(new Event('toolya-auth-verified'));
  }).catch(() => {
    if (finished) return;
    finished = true;
    clearTimeout(timeout);
    unavailable();
  });

  client.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      root.classList.add('toolya-auth-pending');
      reject();
    }
  });
})();
