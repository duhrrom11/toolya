// Public discovery stays anonymous; private profile and publication writes require a fresh verified identity.
export async function requireWishlistWriter(client,expectedUserId){
  if(!expectedUserId||typeof expectedUserId!=='string')throw Error('Bitte zuerst anmelden.');
  const {data,error}=await client.auth.getUser();
  const user=data?.user;
  if(error||!user?.id||user.is_anonymous||user.id!==expectedUserId)
    throw Error('Anmeldung nicht gültig oder Konto gewechselt.');
  return user;
}
export async function guardedWishlistWrite(client,expectedUserId,write){
  await requireWishlistWriter(client,expectedUserId);
  if(typeof write!=='function')throw Error('Schreibfunktion fehlt.');
  return write(expectedUserId);
}
