import {guardedWishlistWrite} from './wishlist-auth.mjs';
import {identityId} from './directory-links.mjs';

const guestKey = 'toolya-public-profile-favorites-v1';

export function directoryFavorites(db, changed, failed) {
  let owner = null;
  let ids = guestIds();
  let revision = 0;
  let busy = false;
  let ready = true;

  function guestIds() {
    try {
      const data = JSON.parse(localStorage.getItem(guestKey) || '[]');
      return new Set(data.map(row => typeof row === 'string' ? row : row?.user_id).filter(id => identityId.test(id)));
    } catch {
      return new Set();
    }
  }

  async function account(next, refresh = false) {
    if (owner === next && !refresh) return;
    owner = next;
    const version = ++revision;
    ids = owner ? new Set() : guestIds();
    ready = !owner;
    changed();
    if (!owner) return;
    try {
      const guest = [...guestIds()];
      if (guest.length) {
        const result = await guardedWishlistWrite(db, next, () => db.from('wishlist_directory_favorites')
          .upsert(guest.map(profile_id => ({profile_id})), {onConflict: 'owner_id,profile_id', ignoreDuplicates: true}));
        if (result.error) throw result.error;
        if (revision !== version) return;
        // Keep favorites added by another tab during the import.
        const extra = [...guestIds()].filter(id => !guest.includes(id));
        try { localStorage.setItem(guestKey, JSON.stringify(extra)); } catch {}
      }
      const result = await db.from('wishlist_directory_favorites').select('profile_id').eq('owner_id', next);
      if (result.error) throw result.error;
      if (revision !== version) return;
      ids = new Set((result.data || []).map(row => row.profile_id));
      ready = true;
      changed();
    } catch {
      if (revision === version) failed();
    }
  }

  async function toggle(id) {
    if (busy || !identityId.test(id)) return;
    if (!ready) { await account(owner, true); return; }
    const current = owner;
    const version = revision;
    const remove = ids.has(id);
    busy = true;
    try {
      if (current) {
        const result = await guardedWishlistWrite(db, current, () => {
          const table = db.from('wishlist_directory_favorites');
          return remove ? table.delete().eq('owner_id', current).eq('profile_id', id)
            : table.upsert({profile_id: id}, {onConflict: 'owner_id,profile_id', ignoreDuplicates: true});
        });
        if (result.error) throw result.error;
      }
      if (version !== revision) return;
      if (!current) ids = guestIds();
      if (remove) ids.delete(id);
      else ids.add(id);
      if (!current) localStorage.setItem(guestKey, JSON.stringify([...ids]));
      changed();
    } catch {
      if (version === revision) { if (!current) ids = guestIds(); failed(); }
    } finally {
      busy = false;
    }
  }

  window.addEventListener('storage', event => {
    if (event.key === guestKey && !owner) { ids = guestIds(); changed(); }
  });
  return {get ids() { return [...ids]; }, has: id => ids.has(id), account, toggle};
}
