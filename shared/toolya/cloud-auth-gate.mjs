/**
 * Shared Toolya auth prerequisite for future cloud-only tool controllers.
 * Development-only: not wired into tools until their cloud persistence is ready.
 * A client-side gate is UX only; Supabase RLS must authorize every data operation.
 */
export async function requireVerifiedUser(client) {
  if (!client?.auth?.getUser) throw new Error('Toolya-Anmeldung nicht verfügbar.');
  const { data, error } = await client.auth.getUser();
  if (error) throw new Error('Toolya-Anmeldung konnte nicht geprüft werden.', { cause: error });
  if (!data?.user?.id) throw new Error('Bitte bei Toolya anmelden.');
  if (data.user.is_anonymous) throw new Error('Ein registriertes Toolya-Konto ist erforderlich.');
  return data.user;
}

export function createCloudOnlyGuard(client, { onAuthorized, onUnauthorized, onError } = {}) {
  let generation = 0;
  let disposed = false;
  let subscription;
  const run = async () => {
    const current = ++generation;
    try {
      const user = await requireVerifiedUser(client);
      if (!disposed && current === generation) await onAuthorized?.(user);
    } catch (error) {
      if (disposed || current !== generation) return;
      if (error.message === 'Bitte bei Toolya anmelden.' ||
          error.message === 'Ein registriertes Toolya-Konto ist erforderlich.') {
        await onUnauthorized?.(error);
      } else {
        await onError?.(error); // Fail closed on network/auth errors
      }
    }
  };
  const { data } = client.auth.onAuthStateChange(() => {
    // Never invoke Supabase auth methods synchronously within its auth callback.
    queueMicrotask(() => { if (!disposed) void run(); });
  });
  subscription = data?.subscription;
  return {
    verify: run,
    dispose() { disposed = true; ++generation; subscription?.unsubscribe(); }
  };
}
