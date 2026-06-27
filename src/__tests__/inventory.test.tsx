import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import React from 'react';
import BusinessInventoryPage from '../app/business/inventory/page';
import { updateProduct } from '@/lib/firebase/shopService';

// Mock window.alert
window.alert = vi.fn();

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock Auth hook
const mockUser = {
  uid: 'owner_123',
  displayName: 'Merchant John',
  email: 'john@example.com',
};

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
  }),
}));

// Mock shop service functions
vi.mock('@/lib/firebase/shopService', () => ({
  updateProduct: vi.fn().mockResolvedValue(undefined),
}));

// Mock data
const mockCompany = {
  id: 'company_123',
  ownerId: 'owner_123',
  name: 'Organic Oils Ltd',
};

const mockProducts = [
  {
    id: 'prod_1',
    name: 'Cold Pressed Coconut Oil',
    description: 'Pure organic oil',
    price: 350,
    stock: 15,
    category: 'Food',
    images: [],
    isActive: true,
    companyId: 'company_123',
  },
  {
    id: 'prod_2',
    name: 'Pure Sesame Oil',
    description: 'Traditional wood-pressed sesame oil',
    price: 450,
    stock: 3, // Low stock (<= 5)
    category: 'Food',
    images: [],
    isActive: true,
    companyId: 'company_123',
  },
  {
    id: 'prod_3',
    name: 'Castor Oil',
    description: 'Rich organic castor oil',
    price: 250,
    stock: 0, // Out of stock
    category: 'Food',
    images: [],
    isActive: true,
    companyId: 'company_123',
  },
];

// Mock Firestore hooks
vi.mock('@/hooks/useFirestore', () => ({
  useCollection: (collectionName: string) => {
    if (collectionName === 'companies') {
      return { data: [mockCompany], loading: false, error: null };
    }
    if (collectionName === 'products') {
      return { data: mockProducts, loading: false, error: null };
    }
    return { data: [], loading: false, error: null };
  },
}));

describe('BusinessInventoryPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders summary stats correctly (SKUs, total items, low stock, out of stock)', async () => {
    render(<BusinessInventoryPage />);

    // Total SKUs should be 3
    const skuCard = screen.getByText('Total SKUs').closest('div');
    expect(skuCard).toBeDefined();
    expect(skuCard?.textContent).toContain('3');

    // Total Stock should be 15 + 3 + 0 = 18
    const stockCard = screen.getByText('Total Stock Items').closest('div');
    expect(stockCard).toBeDefined();
    expect(stockCard?.textContent).toContain('18');

    // Low Stock count should be 1 (Pure Sesame Oil)
    const lowStockCard = screen.getByText('Low Stock Items').closest('div');
    expect(lowStockCard).toBeDefined();
    expect(lowStockCard?.textContent).toContain('1');

    // Out of Stock count should be 1 (Castor Oil)
    const outOfStockHeaders = screen.getAllByText('Out of Stock');
    const headerCard = outOfStockHeaders.find((el) => el.className.includes('uppercase'))?.closest('div');
    expect(headerCard).toBeDefined();
    expect(headerCard?.textContent).toContain('1');
  });

  it('renders products lists with correct status badges', async () => {
    render(<BusinessInventoryPage />);

    expect(screen.getByText('Cold Pressed Coconut Oil')).toBeDefined();
    expect(screen.getByText('Pure Sesame Oil')).toBeDefined();
    expect(screen.getByText('Castor Oil')).toBeDefined();

    expect(screen.getByText('In Stock (15)')).toBeDefined();
    expect(screen.getByText('Low Stock (3)')).toBeDefined();
    const outOfStockBadges = screen.getAllByText('Out of Stock');
    expect(outOfStockBadges.length).toBeGreaterThan(0);
  });

  it('triggers updateProduct when clicking increment and decrement stock adjustments', async () => {
    render(<BusinessInventoryPage />);

    // Scope queries to the specific product rows
    const coconutRow = screen.getByText('Cold Pressed Coconut Oil').closest('tr')!;
    const coconutButtons = within(coconutRow).getAllByRole('button');
    // coconutButtons[0] is decrement (-), coconutButtons[1] is increment (+)
    
    // Increment Coconut Oil (from 15 to 16)
    await act(async () => {
      fireEvent.click(coconutButtons[1]);
    });
    expect(updateProduct).toHaveBeenCalledWith('prod_1', { stock: 16 });

    // Decrement Sesame Oil (from 3 to 2)
    const sesameRow = screen.getByText('Pure Sesame Oil').closest('tr')!;
    const sesameButtons = within(sesameRow).getAllByRole('button');
    // sesameButtons[0] is decrement (-), sesameButtons[1] is increment (+)

    await act(async () => {
      fireEvent.click(sesameButtons[0]);
    });
    expect(updateProduct).toHaveBeenCalledWith('prod_2', { stock: 2 });
  });
});
