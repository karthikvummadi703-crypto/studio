import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// ── Browser API stubs ────────────────────────────────────────────────────────

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// ── Next.js stubs ────────────────────────────────────────────────────────────

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push:     vi.fn(),
    replace:  vi.fn(),
    prefetch: vi.fn(),
    back:     vi.fn(),
  }),
  usePathname:    () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next/dynamic', () => ({
  default: (fn: () => Promise<{ default: unknown }>) => fn,
}));

// ── Firebase stubs ───────────────────────────────────────────────────────────

vi.mock('@/firebase/config', () => ({
  app:  {},
  auth: { currentUser: null },
  db:   {},
}));

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword:     vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithPopup:                vi.fn(),
  signInAnonymously:              vi.fn(),
  signOut:                        vi.fn(),
  updateProfile:                  vi.fn(),
  sendPasswordResetEmail:         vi.fn(),
  onAuthStateChanged:             vi.fn((_auth: unknown, cb: (u: null) => void) => { cb(null); return vi.fn(); }),
  GoogleAuthProvider:             vi.fn(),
  getAuth:                        vi.fn(),
  FirebaseError: class FirebaseError extends Error {
    constructor(public code: string, message: string) { super(message); }
  },
}));

vi.mock('firebase/firestore', () => ({
  doc:             vi.fn(),
  setDoc:          vi.fn().mockResolvedValue(undefined),
  addDoc:          vi.fn().mockResolvedValue({ id: 'mock-id' }),
  updateDoc:       vi.fn().mockResolvedValue(undefined),
  deleteDoc:       vi.fn().mockResolvedValue(undefined),
  getFirestore:    vi.fn(),
  collection:      vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
  onSnapshot:      vi.fn(() => vi.fn()),
  query:           vi.fn(),
  where:           vi.fn(),
  orderBy:         vi.fn(),
  limit:           vi.fn(),
  writeBatch:      vi.fn(() => ({
    set:    vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  })),
  increment:      vi.fn(),
  runTransaction: vi.fn(),
}));

vi.mock('@/firebase', () => ({
  useUser:       () => ({ user: null, isLoading: false, isDemo: false }),
  useFirestore:  () => ({}),
  useDoc:        () => ({ data: null, isLoading: false, error: null }),
  useCollection: () => ({ data: [], isLoading: false, error: null }),
  useFirebase:   () => ({ profile: null, isProfileLoading: false }),
  useAuth:       () => ({}),
  auth:          {},
  db:            {},
  FirebaseClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));
