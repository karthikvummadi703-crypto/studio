import { initializeTestEnvironment, assertFails, assertSucceeds, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';

/**
 * @fileOverview Unit tests for Firestore Security Rules using the Firebase Rules Unit Testing library.
 */

describe('Firestore Security Rules', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    // Initialize the test environment with the project rules.
    // Note: The Firestore emulator must be running for these tests to succeed in a local dev environment.
    testEnv = await initializeTestEnvironment({
      projectId: 'ecopulse-test',
      firestore: {
        rules: readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  it('prevents user A from reading user B profile', async () => {
    const userB = testEnv.authenticatedContext('user-b');
    await assertFails(userB.firestore().doc('users/user-a').get());
  });

  it('allows user A to read their own profile', async () => {
    const userA = testEnv.authenticatedContext('user-a');
    await assertSucceeds(userA.firestore().doc('users/user-a').get());
  });

  it('allows user A to create their own calculator record', async () => {
    const userA = testEnv.authenticatedContext('user-a');
    await assertSucceeds(userA.firestore().collection('calculator_records').add({
      userId: 'user-a',
      co2: 12.5,
      timestamp: new Date().toISOString()
    }));
  });

  it('prevents user A from creating a calculator record for user B', async () => {
    const userA = testEnv.authenticatedContext('user-a');
    await assertFails(userA.firestore().collection('calculator_records').add({
      userId: 'user-b',
      co2: 5.0,
      timestamp: new Date().toISOString()
    }));
  });

  it('prevents unauthenticated access to user profiles', async () => {
    const unauthed = testEnv.unauthenticatedContext();
    await assertFails(unauthed.firestore().doc('users/any-user').get());
  });
});