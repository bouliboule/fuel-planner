import { db, getProfile, useLiveQuery } from '../../db/index.ts';

export function useProfile() {
  return useLiveQuery(() => getProfile(db), []);
}
