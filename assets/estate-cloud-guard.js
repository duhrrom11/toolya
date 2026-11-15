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
 async function verifyEncryptedBackup({client,ownerId,vaultId,expectedStamp,key,cryptoApi,validatePayload,expectedEncryptedData,expectedEncryptedConfig,expectedRecoveryKey}){
  await requireOwner(client,ownerId);
  if(!key||!cryptoApi?.decrypt||typeof validatePayload!=='function')throw Error('invalid_vault');
  const {data:remote,error}=await client.from('vault_cloud_snapshots')
   .select('vault_id,encrypted_data,encrypted_config,recovery_key,updated_at')
   .eq('owner_user_id',ownerId).single();
  if(error||!remote||remote.vault_id!==vaultId||remote.updated_at!==expectedStamp||
     !remote.recovery_key?.ciphertext)throw Error('backup_unverified');
  // A matching revision alone does not prove that the just-written backup is intact.
  if(expectedEncryptedData&&JSON.stringify(remote.encrypted_data)!==JSON.stringify(expectedEncryptedData)||
     expectedEncryptedConfig&&JSON.stringify(remote.encrypted_config)!==JSON.stringify(expectedEncryptedConfig)||
     expectedRecoveryKey&&JSON.stringify(remote.recovery_key)!==JSON.stringify(expectedRecoveryKey))
   throw Error('backup_unverified');
  const payload=validatePayload(await cryptoApi.decrypt(remote.encrypted_data,key));
  await cryptoApi.decrypt(remote.encrypted_config,key);
  await requireOwner(client,ownerId);
  return {entries:payload.entries.length,stamp:remote.updated_at};
 }
 function assertRestoreCompatible(local,remote){
  if(!local||!remote)return;
  if(local.vaultId!==remote.vault_id)throw Error('vault_mismatch');
  if(local.version===2&&local.pending&&local.cloudStamp!==remote.updated_at)
   throw Error('conflict');
 }
 async function restoreCloudSnapshot({client,ownerId,password,cryptoApi,validatePayload}){
  await requireOwner(client,ownerId);
  if(!password||!cryptoApi?.unwrap||!cryptoApi?.decrypt||typeof validatePayload!=='function')
   throw Error('invalid_vault');
  const {data:remote,error}=await client.from('vault_cloud_snapshots')
   .select('vault_id,encrypted_data,encrypted_config,recovery_key,updated_at')
   .eq('owner_user_id',ownerId).maybeSingle();
  if(error)throw error;
  if(!remote)return null;
  if(!remote.vault_id||!remote.updated_at||!remote.recovery_key?.ciphertext||
     !remote.encrypted_data?.ciphertext||!remote.encrypted_config?.ciphertext)
   throw Error('backup_unverified');
  const key=await cryptoApi.unwrap(remote.recovery_key,password);
  const payload=validatePayload(await cryptoApi.decrypt(remote.encrypted_data,key));
  const config=await cryptoApi.decrypt(remote.encrypted_config,key);
  if(!config||typeof config!=='object'||Array.isArray(config)||
     config.vaultId&&config.vaultId!==remote.vault_id)throw Error('backup_unverified');
  await requireOwner(client,ownerId);
  return {key,payload,config:{...config,vaultId:remote.vault_id},
   recovery:remote.recovery_key,stamp:remote.updated_at,remote};
 }
 root.EstateCloudGuard={requireOwner,saveEncryptedSnapshot,verifyEncryptedBackup,assertRestoreCompatible,restoreCloudSnapshot};
})(typeof window!=='undefined'?window:globalThis);
