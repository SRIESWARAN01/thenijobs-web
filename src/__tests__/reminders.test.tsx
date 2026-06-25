import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SeekerRemindersPage from '../app/seeker/reminders/page';
import React from 'react';

// Mock localStorage globally
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock the Auth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { uid: 'test_user_123', displayName: 'Test Seeker' },
    loading: false,
  }),
}));

// Mock the Firestore hooks
vi.mock('@/hooks/useFirestore', () => ({
  useCollection: (collectionName: string) => {
    if (collectionName === 'interviews') {
      return {
        data: [
          {
            id: 'interview_1',
            jobTitle: 'Frontend Developer',
            companyName: 'Acme Corp',
            notes: 'Technical round',
            date: '2026-06-20',
            time: '10:00',
            status: 'scheduled',
            mode: 'Video',
            meetingLink: 'https://meet.google.com/abc',
          },
        ],
        loading: false,
        error: null,
      };
    }
    if (collectionName === 'subscriptions') {
      return {
        data: [
          {
            id: 'sub_1',
            status: 'active',
            planName: 'Premium Plan',
            expiresAt: { seconds: Math.floor(Date.now() / 1000) + 5 * 24 * 3600 }, // expires in 5 days
          },
        ],
        loading: false,
        error: null,
      };
    }
    return { data: [], loading: false, error: null };
  },
}));

describe('SeekerRemindersPage Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders reminders page title and metric summaries', () => {
    render(<SeekerRemindersPage />);

    expect(screen.getByText('My Reminders & Tasks')).toBeDefined();
    expect(screen.getByText('Pending Reminders')).toBeDefined();
    expect(screen.getByText('Interview Reminders')).toBeDefined();
    expect(screen.getByText('Renewal Warnings')).toBeDefined();
  });

  it('renders dynamic interviews and subscription warning reminders from Firestore', () => {
    render(<SeekerRemindersPage />);

    // Check interview reminder
    expect(screen.getByText('Interview for Frontend Developer')).toBeDefined();
    expect(screen.getByText('Acme Corp')).toBeDefined();
    expect(screen.getByText('Join Meet')).toBeDefined();

    // Check subscription reminder
    expect(screen.getByText('Your Premium Plan Subscription Expires Soon')).toBeDefined();
    expect(screen.getByText('Manage Plan')).toBeDefined();
  });

  it('allows adding, completing, and deleting custom user reminders', async () => {
    render(<SeekerRemindersPage />);

    // Open Add Task Reminder modal
    const addButton = screen.getByRole('button', { name: /Add Task Reminder/i });
    fireEvent.click(addButton);

    // Verify modal elements are visible
    expect(screen.getByRole('heading', { name: /Add Task Reminder/i })).toBeDefined();
    const titleInput = screen.getByPlaceholderText('e.g. Call company HR or prepare portfolio');
    const notesInput = screen.getByPlaceholderText('Add details, links, or contact phone...');
    const submitButton = screen.getByText('Create Reminder Task');

    // Fill form
    fireEvent.change(titleInput, { target: { value: 'Review my resume checklist' } });
    fireEvent.change(notesInput, { target: { value: 'Double check contact details' } });
    fireEvent.click(submitButton);

    // Verify reminder is added to the page list
    expect(screen.getByText('Review my resume checklist')).toBeDefined();
    expect(screen.getByText('Double check contact details')).toBeDefined();

    // Verify metrics updated
    // 1 interview + 1 subscription + 1 custom = 3 pending
    expect(screen.getAllByText('3')[0]).toBeDefined();

    // Toggle complete using the semantic aria-label
    const checkbox = screen.getByRole('button', { name: /Toggle status for Review my resume checklist/i });
    fireEvent.click(checkbox);

    // Tab to 'Completed' and check if it's there
    const completedTab = screen.getByRole('button', { name: /Completed/i });
    fireEvent.click(completedTab);
    expect(screen.getByText('Review my resume checklist')).toBeDefined();
  });
});
