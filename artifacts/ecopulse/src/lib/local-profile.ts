/**
 * localStorage-backed profile store used as a fallback when Firestore
 * security rules are not yet deployed or when the user is offline.
 * Scores are capped at 99 to match the displayed maximum.
 */

const SCORE_CAP = 99;

export interface LocalProfileData {
  greenPoints: number;
  sustainabilityScore: number;
  updatedAt: number;
}

const key = (uid: string) => `ecopulse_profile_${uid}`;

const DEFAULT_PROFILE: Omit<LocalProfileData, "updatedAt"> = {
  greenPoints: 100,
  sustainabilityScore: 75,
};

/**
 * Reads the cached profile for the given user from localStorage.
 * @param uid - Firebase Auth UID.
 * @returns The stored profile, or null if none exists.
 */
export function getLocalProfile(uid: string): LocalProfileData | null {
  try {
    const raw = localStorage.getItem(key(uid));
    return raw ? (JSON.parse(raw) as LocalProfileData) : null;
  } catch {
    return null;
  }
}

/**
 * Initialises a local profile with default values if one does not already exist.
 * @param uid - Firebase Auth UID.
 * @returns The existing or newly created profile.
 */
export function initLocalProfile(uid: string): LocalProfileData {
  const existing = getLocalProfile(uid);
  if (existing) return existing;
  const initial: LocalProfileData = { ...DEFAULT_PROFILE, updatedAt: Date.now() };
  try {
    localStorage.setItem(key(uid), JSON.stringify(initial));
  } catch {}
  return initial;
}

/**
 * Persists a profile snapshot to localStorage.
 * @param uid  - Firebase Auth UID.
 * @param data - The profile data to store.
 */
export function setLocalProfile(uid: string, data: LocalProfileData): void {
  try {
    localStorage.setItem(key(uid), JSON.stringify(data));
  } catch {}
}

/**
 * Atomically increments green points and/or sustainability score in the local cache.
 * The sustainability score is capped at SCORE_CAP (99).
 * @param uid   - Firebase Auth UID.
 * @param delta - Partial increments to apply.
 * @returns The updated profile.
 */
export function incrementLocalProfile(
  uid: string,
  delta: { greenPoints?: number; sustainabilityScore?: number }
): LocalProfileData {
  const current = getLocalProfile(uid) ?? { ...DEFAULT_PROFILE, updatedAt: Date.now() };
  const updated: LocalProfileData = {
    greenPoints: current.greenPoints + (delta.greenPoints ?? 0),
    sustainabilityScore: Math.min(
      SCORE_CAP,
      current.sustainabilityScore + (delta.sustainabilityScore ?? 0)
    ),
    updatedAt: Date.now(),
  };
  setLocalProfile(uid, updated);
  return updated;
}

/**
 * Merges Firestore profile data into the local cache, keeping whichever value is higher
 * for each metric so offline edits are never overwritten by a stale server snapshot.
 * @param uid           - Firebase Auth UID.
 * @param firestoreData - Partial profile fetched from Firestore.
 */
export function mergeFirestoreProfile(
  uid: string,
  firestoreData: { greenPoints?: number; sustainabilityScore?: number }
): void {
  const local = getLocalProfile(uid);
  const merged: LocalProfileData = {
    greenPoints: Math.max(local?.greenPoints ?? 0, firestoreData.greenPoints ?? 0),
    sustainabilityScore: Math.min(
      SCORE_CAP,
      Math.max(local?.sustainabilityScore ?? 0, firestoreData.sustainabilityScore ?? 0)
    ),
    updatedAt: Date.now(),
  };
  setLocalProfile(uid, merged);
}
