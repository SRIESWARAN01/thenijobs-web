import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import BookServicePage from '../app/services/book/page';
import ServiceBookingsPage from '../app/service/bookings/page';

// Mock window.alert
window.alert = vi.fn();

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => ({
    get: (key: string) => {
      if (key === 'companyId') return 'company_123';
      return null;
    },
  }),
}));

// Mock Header and BottomNav
vi.mock('@/components/navigation/Header', () => ({
  default: () => <div data-testid="mock-header">Mock Header</div>,
}));

vi.mock('@/components/navigation/BottomNav', () => ({
  default: () => <div data-testid="mock-bottomnav">Mock Bottom Nav</div>,
}));

// Mock Auth hook
const mockUser = {
  uid: 'seeker_123',
  displayName: 'Jane Doe',
  email: 'jane@example.com',
  phone: '9876543210',
};

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
  }),
}));

// Mock Data
const mockCompany = {
  id: 'company_123',
  ownerId: 'provider_123',
  name: 'AC Services Theni',
  category: 'Air Conditioning',
  services: ['AC Repair', 'AC Installation', 'Gas Filling'],
};

let mockBookingsList = [
  {
    id: 'booking_1',
    serviceProviderId: 'company_123',
    customerId: 'seeker_123',
    customerName: 'Jane Doe',
    customerPhone: '9876543210',
    customerEmail: 'jane@example.com',
    serviceName: 'AC Repair',
    bookingStatus: 'pending',
    // BookServicePage fields:
    scheduledDate: '2026-06-20',
    scheduledTime: '10:00',
    customerAddress: '123 Main St, Theni',
    customerNotes: 'Please repair the AC unit.',
    preferredPackage: 'Standard',
    // ServiceBookingsPage fields:
    serviceDate: '2026-06-20',
    serviceTime: '10:00',
    serviceLocation: '123 Main St, Theni',
    serviceDescription: 'Please repair the AC unit.',
    createdAt: new Date(),
  },
];

// Mock Firestore hooks
vi.mock('@/hooks/useFirestore', () => ({
  useDocument: (collectionName: string, id: string | null) => {
    if (collectionName === 'companies' && id === 'company_123') {
      return { data: mockCompany, loading: false, error: null };
    }
    return { data: null, loading: false, error: null };
  },
  useCollection: (collectionName: string) => {
    if (collectionName === 'companies') {
      return {
        data: [mockCompany],
        loading: false,
        error: null,
      };
    }
    if (collectionName === 'bookings') {
      return {
        data: mockBookingsList,
        loading: false,
        error: null,
      };
    }
    return { data: [], loading: false, error: null };
  },
}));

// Mock Firestore services
const createBookingMock = vi.fn().mockResolvedValue('new_booking_123');
const createNotificationMock = vi.fn().mockResolvedValue('notification_123');
const updateBookingStatusMock = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/firebase/firestoreService', () => ({
  createBooking: (data: any) => createBookingMock(data),
  createNotification: (data: any) => createNotificationMock(data),
  updateBookingStatus: (...args: any[]) =>
    updateBookingStatusMock(...args),
}));

describe('Local Service Bookings & Provider Dashboards Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBookingsList = [
      {
        id: 'booking_1',
        serviceProviderId: 'company_123',
        customerId: 'seeker_123',
        customerName: 'Jane Doe',
        customerPhone: '9876543210',
        customerEmail: 'jane@example.com',
        serviceName: 'AC Repair',
        bookingStatus: 'pending',
        // BookServicePage fields:
        scheduledDate: '2026-06-20',
        scheduledTime: '10:00',
        customerAddress: '123 Main St, Theni',
        customerNotes: 'Please repair the AC unit.',
        preferredPackage: 'Standard',
        // ServiceBookingsPage fields:
        serviceDate: '2026-06-20',
        serviceTime: '10:00',
        serviceLocation: '123 Main St, Theni',
        serviceDescription: 'Please repair the AC unit.',
        createdAt: new Date(),
      },
    ];
  });

  describe('Seeker Booking Flow (BookServicePage)', () => {
    it('renders the booking request form wizard correctly with company details', async () => {
      render(<BookServicePage />);

      expect(screen.getByText('Request Service Booking')).toBeDefined();
      expect(screen.getByText('Booking with AC Services Theni')).toBeDefined();

      // Check form fields are present
      expect(screen.getByLabelText(/Select Service/i)).toBeDefined();
      expect(screen.getByLabelText(/Pricing Preference/i)).toBeDefined();
      expect(screen.getByPlaceholderText(/Your name/i)).toBeDefined();
      expect(screen.getByPlaceholderText(/10-digit mobile number/i)).toBeDefined();
      expect(screen.getByPlaceholderText(/Enter full address/i)).toBeDefined();
    });

    it('submits a booking request successfully', async () => {
      render(<BookServicePage />);

      // Populate input fields
      const dateInput = screen.getByLabelText(/Date/i);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      fireEvent.change(dateInput, { target: { value: tomorrowStr } });

      const timeInput = screen.getByLabelText(/Preferred Time/i);
      fireEvent.change(timeInput, { target: { value: '14:30' } });

      const nameInput = screen.getByPlaceholderText(/Your name/i);
      fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

      const phoneInput = screen.getByPlaceholderText(/10-digit mobile number/i);
      fireEvent.change(phoneInput, { target: { value: '9876543210' } });

      const addressInput = screen.getByPlaceholderText(/Enter full address/i);
      fireEvent.change(addressInput, { target: { value: '123 Main St, Theni' } });

      const submitButton = screen.getByRole('button', { name: /Confirm Booking Request/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(createBookingMock).toHaveBeenCalled();
        expect(createNotificationMock).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'provider_123',
            type: 'booking',
          })
        );
        expect(screen.getByText('Booking Request Sent!')).toBeDefined();
      });
    });

    it('displays validation error if required fields are missing', async () => {
      render(<BookServicePage />);

      const submitButton = screen.getByRole('button', { name: /Confirm Booking Request/i });
      const form = submitButton.closest('form');
      expect(form).not.toBeNull();
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText('Please fill in all required fields.')).toBeDefined();
        expect(createBookingMock).not.toHaveBeenCalled();
      });
    });
  });

  describe('Provider Booking Management Dashboard (ServiceBookingsPage)', () => {
    it('renders provider bookings dashboard and lists requests', () => {
      render(<ServiceBookingsPage />);

      expect(screen.getByText('Bookings & Appointments')).toBeDefined();
      expect(screen.getByText('Manage scheduling requests, quotes, and customer visits.')).toBeDefined();

      // Check that booking items are listed in the list view
      expect(screen.getByText('Jane Doe')).toBeDefined();
      expect(screen.getByText('Needs Quote')).toBeDefined();
      expect(screen.getByText('Area: 123 Main St, Theni')).toBeDefined();
      expect(screen.getByText('Date: 2026-06-20')).toBeDefined();
    });

    it('allows provider to open quote panel and submit a price quotation', async () => {
      render(<ServiceBookingsPage />);

      // Click "Quote & Accept" button
      const quoteBtn = screen.getByRole('button', { name: /Quote & Accept/i });
      fireEvent.click(quoteBtn);

      // Verify the details panel has opened
      expect(screen.getByText('Submit Quotation')).toBeDefined();
      expect(screen.getByText('Client: Jane Doe')).toBeDefined();

      // Fill in price and notes
      const priceInput = screen.getByPlaceholderText('e.g. 500');
      fireEvent.change(priceInput, { target: { value: '750' } });

      const notesInput = screen.getByPlaceholderText('Describe what is included...');
      fireEvent.change(notesInput, { target: { value: 'Includes check and service.' } });

      const sendQuoteBtn = screen.getByRole('button', { name: /Send Quote/i });
      fireEvent.click(sendQuoteBtn);

      await waitFor(() => {
        expect(updateBookingStatusMock).toHaveBeenCalledWith('booking_1', 'quoted', 'Includes check and service.', 750);
      });
    });

    it('allows provider to confirm and complete bookings', async () => {
      // 1. Test Confirmed status transition
      mockBookingsList[0].bookingStatus = 'quoted';
      const { rerender } = render(<ServiceBookingsPage />);

      const confirmBtn = screen.getByRole('button', { name: /Confirm Visit/i });
      fireEvent.click(confirmBtn);

      expect(updateBookingStatusMock).toHaveBeenCalledWith('booking_1', 'confirmed');

      // 2. Test Completed status transition
      mockBookingsList[0].bookingStatus = 'confirmed';
      rerender(<ServiceBookingsPage />);

      const completeBtn = screen.getByRole('button', { name: /Mark Completed/i });
      fireEvent.click(completeBtn);

      expect(updateBookingStatusMock).toHaveBeenCalledWith('booking_1', 'completed');
    });

    it('allows changing views between list and calendar tabs', () => {
      render(<ServiceBookingsPage />);

      const calendarTabBtn = screen.getByRole('button', { name: /Calendar View/i });
      fireEvent.click(calendarTabBtn);

      // Verify Calendar view elements are visible
      expect(screen.getByText('SUN')).toBeDefined();
      expect(screen.getByText('SAT')).toBeDefined();

      const listTabBtn = screen.getByRole('button', { name: /List View/i });
      fireEvent.click(listTabBtn);

      // Back in List View
      expect(screen.getByText('Bookings & Appointments')).toBeDefined();
    });
  });
});
