(function(root){
 'use strict';
 async function requireOwner(client,expectedId){
  if(!expectedId||typeof expectedId!=='string')throw Error('login_required');
  const {data,error}=await client.auth.getUser();
  if(error||!data?.user?.id||data.user.is_anonymous||data.user.id!==expectedId)
   throw Error('login_required');
  return data.user;
 }
 async function saveEncryptedSnapshot({client,ownerId,vaultId,expectedStamp,encryptedData,encryptedConfig,recoveryKey}){
  await requireOwner(client,ownerId);
  if(!vaultId||!encryptedData?.ciphertext||!encryptedConfig?.ciphertext||!recoveryKey?.ciphertext)
   throw Error('invalid_vault');
  const {data:remote,error}=await client.from('vault_cloud_snapshots')
   .select('vault_id,updated_at').eq('owner_user_id',ownerId).maybeSingle();
  if(error)throw error;
  if(remote&&(remote.vault_id!==vaultId||remote.updated_at!==expectedStamp))throw Error('conflict');
  if(!remote&&expectedStamp!==null)throw Error('conflict');
  await requireOwner(client,ownerId);
  const values={encrypted_data:encryptedData,encrypted_config:encryptedConfig,recovery_key:recoveryKey,updated_at:new Date().toISOString()};
  const result=remote
   ?await client.from('vault_cloud_snapshots').update(values).eq('owner_user_id',ownerId).eq('vault_id',vaultId).eq('updated_at',expectedStamp).select('updated_at')
   :await client.from('vault_cloud_snapshots').insert({...values,owner_user_id:ownerId,vault_id:vaultId}).select('updated_at');
  if(result.error)throw result.error;
  if(result.data?.length!==1||!result.data[0]?.updated_at)throw Error('conflict');
  return result.data[0].updated_at;
 }
 root.EstateCloudGuard={requireOwner,saveEncryptedSnapshot};
})(typeof window!=='undefined'?window:globalThis);
