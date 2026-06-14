/**
 * @fileOverview Firestore security rules tests.
 * Run with the Firestore emulator: npm run test:rules
 */

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { describe, it, beforeAll, afterAll, afterEach } from 'vitest';
import { setDoc, getDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'ecopulse-test',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host:  '127.0.0.1',
      port:  8080,
    },
  });
});

afterAll(async () => { await testEnv.cleanup(); });
afterEach(async () => { await testEnv.clearFirestore(); });

// ── /users ────────────────────────────────────────────────────────────────────

describe('users collection', () => {
  it('allows a user to read their own profile', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users/alice'), { name: 'Alice' });
    });
    const alice = testEnv.authenticatedContext('alice');
    await assertSucceeds(getDoc(doc(alice.firestore(), 'users/alice')));
  });

  it('denies reading another user\'s profile', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users/alice'), { name: 'Alice' });
    });
    const bob = testEnv.authenticatedContext('bob');
    await assertFails(getDoc(doc(bob.firestore(), 'users/alice')));
  });

  it('denies unauthenticated reads', async () => {
    const anon = testEnv.unauthenticatedContext();
    await assertFails(getDoc(doc(anon.firestore(), 'users/alice')));
  });

  it('denies client-side deletes', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users/alice'), { name: 'Alice' });
    });
    const alice = testEnv.authenticatedContext('alice');
    await assertFails(deleteDoc(doc(alice.firestore(), 'users/alice')));
  });
});

// ── /calculator_records ───────────────────────────────────────────────────────

describe('calculator_records collection', () => {
  it('allows owner to create their own record', async () => {
    const alice = testEnv.authenticatedContext('alice');
    await assertSucceeds(
      setDoc(doc(alice.firestore(), 'calculator_records/rec1'), { userId: 'alice', co2: 5 })
    );
  });

  it('denies creating a record with a different userId', async () => {
    const bob = testEnv.authenticatedContext('bob');
    await assertFails(
      setDoc(doc(bob.firestore(), 'calculator_records/rec2'), { userId: 'alice', co2: 5 })
    );
  });

  it('denies reading another user\'s record', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'calculator_records/rec1'), { userId: 'alice', co2: 5 });
    });
    const bob = testEnv.authenticatedContext('bob');
    await assertFails(getDoc(doc(bob.firestore(), 'calculator_records/rec1')));
  });

  it('denies changing userId on update', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'calculator_records/rec1'), { userId: 'alice', co2: 5 });
    });
    const alice = testEnv.authenticatedContext('alice');
    await assertFails(
      updateDoc(doc(alice.firestore(), 'calculator_records/rec1'), { userId: 'hacker' })
    );
  });
});

// ── /activities — append-only ─────────────────────────────────────────────────

describe('activities collection (append-only)', () => {
  it('allows owner to create an activity', async () => {
    const alice = testEnv.authenticatedContext('alice');
    await assertSucceeds(
      setDoc(doc(alice.firestore(), 'activities/act1'), { userId: 'alice', type: 'audit' })
    );
  });

  it('denies client updates (append-only)', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'activities/act1'), { userId: 'alice', type: 'audit' });
    });
    const alice = testEnv.authenticatedContext('alice');
    await assertFails(
      updateDoc(doc(alice.firestore(), 'activities/act1'), { type: 'edited' })
    );
  });

  it('denies client deletes', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'activities/act1'), { userId: 'alice', type: 'audit' });
    });
    const alice = testEnv.authenticatedContext('alice');
    await assertFails(deleteDoc(doc(alice.firestore(), 'activities/act1')));
  });
});

// ── /rate_limits — fully locked ───────────────────────────────────────────────

describe('rate_limits collection', () => {
  it('denies authenticated reads', async () => {
    const alice = testEnv.authenticatedContext('alice');
    await assertFails(getDoc(doc(alice.firestore(), 'rate_limits/1.1.1.1')));
  });

  it('denies authenticated writes', async () => {
    const alice = testEnv.authenticatedContext('alice');
    await assertFails(
      setDoc(doc(alice.firestore(), 'rate_limits/1.1.1.1'), { timestamps: [] })
    );
  });

  it('denies unauthenticated access', async () => {
    const anon = testEnv.unauthenticatedContext();
    await assertFails(getDoc(doc(anon.firestore(), 'rate_limits/1.1.1.1')));
  });
});
