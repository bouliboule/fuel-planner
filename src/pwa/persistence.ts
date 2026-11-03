export type PersistenceStatus = 'persisted' | 'not-persisted' | 'unsupported';

// Asks the browser to keep this origin's storage (IndexedDB) from eviction.
// Safari can evict data of sites not added to the home screen; JSON export
// is the backup. Settings reads the current state with getPersistenceStatus.
export async function requestPersistentStorage(): Promise<PersistenceStatus> {
  if (
    !('storage' in navigator) ||
    typeof navigator.storage.persist !== 'function'
  ) {
    return 'unsupported';
  }
  if (await navigator.storage.persisted()) return 'persisted';
  return (await navigator.storage.persist()) ? 'persisted' : 'not-persisted';
}

export async function getPersistenceStatus(): Promise<PersistenceStatus> {
  if (
    !('storage' in navigator) ||
    typeof navigator.storage.persisted !== 'function'
  ) {
    return 'unsupported';
  }
  return (await navigator.storage.persisted()) ? 'persisted' : 'not-persisted';
}
