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

export function getLocalProfile(uid: string): LocalProfileData | null {
  try {
    const raw = localStorage.getItem(key(uid));
    return raw ? (JSON.parse(raw) as LocalProfileData) : null;
  } catch {
    return null;
  }
}

export function initLocalProfile(uid: string): LocalProfileData {
  const existing = getLocalProfile(uid);
  if (existing) return existing;
  const initial: LocalProfileData = { ...DEFAULT_PROFILE, updatedAt: Date.now() };
  try {
    localStorage.setItem(key(uid), JSON.stringify(initial));
  } catch {}
  return initial;
}

export function setLocalProfile(uid: string, data: LocalProfileData): void {
  try {
    localStorage.setItem(key(uid), JSON.stringify(data));
  } catch {}
}

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
