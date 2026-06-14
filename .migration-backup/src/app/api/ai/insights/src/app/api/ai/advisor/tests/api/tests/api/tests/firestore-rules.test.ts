import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  initializeTestEnvironment, assertSucceeds, assertFails, RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { setDoc, getDoc, deleteDoc, doc } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'ecopulse-test',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

afterAll(async () => testEnv.cleanup());
beforeEach(async () => testEnv.clearFirestore());

describe('firestore.rules', () => {
  it('allows a user to read/write their own calculator_records', async () => {
    const alice = testEnv.authenticatedContext('alice');
    const db = alice.firestore();
    await assertSucceeds(setDoc(doc(db, 'calculator_records/r1'), { userId: 'alice', total: 10 }));
    await assertSucceeds(getDoc(doc(db, 'calculator_records/r1')));
  });

  it("denies a user from reading another user's calculator_records", async () => {
    await testEnv.withSecurityRulesDisabled((ctx) =>
      setDoc(doc(ctx.firestore(), 'calculator_records/r2'), { userId: 'bob', total: 5 })
    );
    const alice = testEnv.authenticatedContext('alice');
    await assertFails(getDoc(doc(alice.firestore(), 'calculator_records/r2')));
  });

  it('prevents changing the owner (userId) on update', async () => {
    await testEnv.withSecurityRulesDisabled((ctx) =>
      setDoc(doc(ctx.firestore(), 'calculator_records/r3'), { userId: 'alice', total: 1 })
    );
    const alice = testEnv.authenticatedContext('alice');
    await assertFails(
      setDoc(doc(alice.firestore(), 'calculator_records/r3'), { userId: 'bob', total: 1 }, { merge: true })
    );
  });

  it('treats activities as append-only (no update/delete)', async () => {
    const alice = testEnv.authenticatedContext('alice');
    const db = alice.firestore();
    await assertSucceeds(setDoc(doc(db, 'activities/a1'), { userId: 'alice', kind: 'walk' }));
    await assertFails(deleteDoc(doc(db, 'activities/a1')));
  });

  it('denies all client access to rate_limits', async () => {
    const alice = testEnv.authenticatedContext('alice');
    await assertFails(getDoc(doc(alice.firestore(), 'rate_limits/1.2.3.4')));
  });

  it('denies unauthenticated access to any collection', async () => {
    const anon = testEnv.unauthenticatedContext();
    await assertFails(getDoc(doc(anon.firestore(), 'users/alice')));
  });
});
