import '@testing-library/jest-dom';
import { vi } from 'vitest';

// ── Next.js router mock ──────────────────────────────────────────────────────
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// ── Firebase auth mock ────────────────────────────────────────────────────────
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  signInAnonymously: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  updateProfile: vi.fn(),
  GoogleAuthProvider: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn(),
  signOut: vi.fn(),
}));

// ── Firebase firestore mock ───────────────────────────────────────────────────
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: vi.fn(),
  collection: vi.fn(),
  writeBatch: vi.fn(() => ({
    set: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  })),
  serverTimestamp: vi.fn(() => new Date()),
  increment: vi.fn((n: number) => n),
  onSnapshot: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
}));

// ── Firebase app mock ─────────────────────────────────────────────────────────
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
  FirebaseError: class FirebaseError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
      this.name = 'FirebaseError';
    }
  },
}));

// ── Session action mock ───────────────────────────────────────────────────────
vi.mock('@/app/actions/session', () => ({
  setSessionCookieAction: vi.fn().mockResolvedValue(undefined),
}));

// ── window.matchMedia (required by Radix UI) ──────────────────────────────────
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

// ── ResizeObserver (required by Radix ScrollArea) ─────────────────────────────
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// ── Suppress known harmless React/jsdom console noise ─────────────────────────
const originalError = console.error.bind(console.error);
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    if (
      msg.includes('Warning: ReactDOM.render') ||
      msg.includes('act(...)') ||
      msg.includes('Error: Uncaught [Error: Test crash]')
    ) return;
    originalError(...args);
  };
});
afterAll(() => {
  console.error = originalError;
});
