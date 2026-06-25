import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

// Mock Firebase Config
vi.mock('@/lib/firebase/config', () => ({
  auth: {
    currentUser: null,
  },
  db: {},
}));

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((auth, callback) => {
    // Call callback with null initially (not logged in)
    callback(null);
    return () => {};
  }),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  GoogleAuthProvider: class {},
  sendEmailVerification: vi.fn(),
  signOut: vi.fn(),
  signInWithPopup: vi.fn(),
  browserLocalPersistence: {},
  setPersistence: vi.fn().mockResolvedValue(undefined),
  updateProfile: vi.fn(),
}));

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
  Timestamp: {
    fromDate: vi.fn((d) => d),
  },
}));

// Test helper component to consume auth
function TestConsumer() {
  const { user, loading, isAdmin, isBusiness, isSeeker } = useAuth();
  if (loading) return <div>Loading...</div>;
  return (
    <div>
      <span data-testid="user">{user ? user.displayName : 'Guest'}</span>
      <span data-testid="is-admin">{isAdmin.toString()}</span>
      <span data-testid="is-business">{isBusiness.toString()}</span>
      <span data-testid="is-seeker">{isSeeker.toString()}</span>
    </div>
  );
}

describe('AuthContext and useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws an error when useAuth is consumed outside AuthProvider', () => {
    // Suppress console.error for expected react error during test
    const consoleError = console.error;
    console.error = vi.fn();

    expect(() => render(<TestConsumer />)).toThrow(
      'useAuth must be used within an AuthProvider'
    );

    console.error = consoleError;
  });

  it('renders children and starts in loading/guest state by default', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    // Initial state is resolved since mock onAuthStateChanged triggers callback immediately
    expect(screen.getByTestId('user').textContent).toBe('Guest');
    expect(screen.getByTestId('is-admin').textContent).toBe('false');
    expect(screen.getByTestId('is-business').textContent).toBe('false');
    expect(screen.getByTestId('is-seeker').textContent).toBe('false');
  });
});
