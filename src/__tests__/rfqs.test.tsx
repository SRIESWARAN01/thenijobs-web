import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Mock React.use to avoid React 19 Suspense issues with async params in testing environment
vi.mock('react', async (importOriginal) => {
  const original = await importOriginal<typeof import('react')>();
  return {
    ...original,
    use: (promise: any) => {
      if (promise && typeof promise.then === 'function') {
        return { id: 'prod_1' };
      }
      return (original as any).use(promise);
    }
  };
});

import ProductDetailPageClient from '../app/shop/products/[id]/ProductDetailPageClient';
import BusinessLeadsPage from '../app/business/leads/page';
import { createRFQ, updateRFQ } from '@/lib/firebase/firestoreService';
import { getProductById, getProductReviews } from '@/lib/firebase/shopService';

// Mock alert & print
window.alert = vi.fn();
window.open = vi.fn().mockReturnValue({
  document: {
    write: vi.fn(),
    close: vi.fn(),
  },
});

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock Cart hook
vi.mock('@/contexts/CartContext', () => ({
  useCart: () => ({
    addToCart: vi.fn(),
  }),
}));

// Mock Shop Auth hook
vi.mock('@/hooks/useShopAuth', () => ({
  useShopAuth: () => ({
    shopUser: { uid: 'user_123', email: 'jane@example.com', phoneNumber: '9876543210' },
    shopUserProfile: { fullName: 'Jane Doe' },
  }),
}));

// Mock General Auth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { uid: 'owner_123', displayName: 'John Owner' },
    loading: false,
  }),
}));

// Mock firebase services
vi.mock('@/lib/firebase/shopService', () => ({
  getProductById: vi.fn(),
  getProductReviews: vi.fn().mockResolvedValue([]),
  addProductReview: vi.fn(),
}));

vi.mock('@/lib/firebase/firestoreService', () => ({
  createRFQ: vi.fn().mockResolvedValue({ id: 'rfq_abc' }),
  updateRFQ: vi.fn().mockResolvedValue(undefined),
  updateLeadStatus: vi.fn().mockResolvedValue(undefined),
  trackProductOrServiceAnalytics: vi.fn(),
}));

// Mock components
vi.mock('@/components/shop/StarRating', () => ({
  default: () => <div data-testid="mock-star-rating">Mock Star Rating</div>,
}));

// Mock Firestore hooks
const mockCompany = {
  id: 'company_123',
  ownerId: 'owner_123',
  name: 'Woodcraft Furniture',
  email: 'wood@example.com',
  phone: '9876543210',
};

const mockRfq = {
  id: 'rfq_1',
  productId: 'prod_1',
  productName: 'Teakwood Dining Table',
  companyId: 'company_123',
  customerId: 'user_123',
  customerName: 'Jane Doe',
  customerPhone: '9876543210',
  customerEmail: 'jane@example.com',
  quantity: 10,
  status: 'pending_quote',
  createdAt: new Date().toISOString(),
};

vi.mock('@/hooks/useFirestore', () => ({
  useCollection: (collectionName: string) => {
    if (collectionName === 'companies') {
      return { data: [mockCompany], loading: false, error: null };
    }
    if (collectionName === 'leads') {
      return { data: [], loading: false, error: null };
    }
    if (collectionName === 'rfqs') {
      return { data: [mockRfq], loading: false, error: null };
    }
    return { data: [], loading: false, error: null };
  },
}));

describe('B2B RFQ & Quotation Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders request B2B quote button and submits form on public product details page', async () => {
    const mockProduct = {
      id: 'prod_1',
      companyId: 'company_123',
      name: 'Teakwood Dining Table',
      description: 'Solid premium teakwood dining table',
      price: 25000,
      stock: 50,
      category: 'Furniture',
      images: [],
      isActive: true,
      isFeatured: false,
      rating: 0,
      reviewCount: 0,
    };

    (getProductById as any).mockResolvedValue(mockProduct);

    const paramsPromise = Promise.resolve({ id: 'prod_1' }) as any;
    paramsPromise.value = { id: 'prod_1' };
    render(<ProductDetailPageClient params={paramsPromise} />);

    // Wait for product details to load
    await waitFor(() => {
      expect(screen.getByText('Teakwood Dining Table')).toBeDefined();
    });

    // Check RFQ CTA button is visible since product has companyId
    const rfqCtaButton = screen.getByText('Request Bulk / B2B Quote');
    expect(rfqCtaButton).toBeDefined();

    // Click CTA to open modal
    fireEvent.click(rfqCtaButton);

    // Verify modal fields appear
    expect(screen.getByText('Quantity Needed *')).toBeDefined();
    expect(screen.getByText('Contact Phone *')).toBeDefined();

    // Fill out form
    const qtyInput = document.getElementById('rfq-qty') as HTMLElement;
    const phoneInput = screen.getByPlaceholderText('Enter phone number');
    const msgInput = screen.getByPlaceholderText(/custom branding/);

    fireEvent.change(qtyInput, { target: { value: '15' } });
    fireEvent.change(phoneInput, { target: { value: '9876543210' } });
    fireEvent.change(msgInput, { target: { value: 'We need custom lacquer polish.' } });

    // Submit form
    const submitButton = screen.getByText('Submit Request');
    const form = submitButton.closest('form');
    fireEvent.submit(form!);

    // Verify createRFQ is called with matching values
    await waitFor(() => {
      expect(createRFQ).toHaveBeenCalledWith(expect.objectContaining({
        productId: 'prod_1',
        productName: 'Teakwood Dining Table',
        companyId: 'company_123',
        customerId: 'user_123',
        customerName: 'Jane Doe',
        customerPhone: '9876543210',
        quantity: 15,
        message: 'We need custom lacquer polish.',
      }));
    });
  });

  it('renders RFQs list and updates quotation calculations inside Business Leads Page', async () => {
    render(<BusinessLeadsPage />);

    // Click on Product RFQs (B2B) tab
    const rfqTabButton = screen.getByText('Product RFQs (B2B)');
    fireEvent.click(rfqTabButton);

    // Verify RFQ list items appear
    expect(screen.getByText('Teakwood Dining Table')).toBeDefined();
    expect(screen.getByText('10 units')).toBeDefined();

    // Open RFQ Details/Quotation Builder drawer
    const prepareQuoteButton = screen.getByText('Prepare Quote');
    fireEvent.click(prepareQuoteButton);

    // Verify Drawer displays customer request and form fields
    expect(screen.getByText('RFQ Details')).toBeDefined();
    expect(screen.getByText('Price per Unit (₹) *')).toBeDefined();

    // Fill quotation price, tax rate, and discount
    const priceInput = screen.getByLabelText('Price per Unit (₹) *');
    const taxInput = screen.getByLabelText('Tax Rate (%)');
    const discountInput = screen.getByLabelText('Flat Discount (₹)');

    fireEvent.change(priceInput, { target: { value: '22000' } }); // 22,000 * 10 = 220,000
    fireEvent.change(taxInput, { target: { value: '18' } }); // 18% of 220k = 39,600
    fireEvent.change(discountInput, { target: { value: '5000' } }); // 220,000 + 39,600 - 5000 = 254,600

    // Check live calculations text
    expect(screen.getByText('₹254600.00')).toBeDefined();

    // Submit quotation
    const sendButton = screen.getByText('Send Quotation');
    fireEvent.click(sendButton);

    // Verify updateRFQ is called with correct price terms
    await waitFor(() => {
      expect(updateRFQ).toHaveBeenCalledWith('rfq_1', expect.objectContaining({
        status: 'quoted',
        quotedPricePerUnit: 22000,
        quotedTaxPercent: 18,
        quotedDiscount: 5000,
        quotedTotal: 254600,
      }));
    });
  });
});
