(() => {
  window.toolyaRegister = destination => {
    const page = new URL('/account/register.html', location.origin);
    const current = new URL(location.href);
    if (!current.pathname.startsWith('/tools/estate/')) {
      const next = current.searchParams.get('next');
      if (next && ['/', '/index.html', '/en/', '/en/index.html'].includes(current.pathname)) {
        page.searchParams.set('next', next);
      } else {
        page.searchParams.set('next', current.pathname + current.search + current.hash);
      }
    } else {
      page.searchParams.set('next', current.pathname);
    }
    if (destination) page.searchParams.set('next', destination);
    if (current.searchParams.get('lang') === 'en' || window.__toolyaUILocale === 'en' || current.pathname.startsWith('/en/')) {
      page.searchParams.set('lang', 'en');
    }
    location.assign(page.href);
  };
})();
