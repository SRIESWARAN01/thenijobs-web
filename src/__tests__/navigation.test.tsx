import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import BottomNav from '../components/navigation/BottomNav';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mutable mock state for useAuth
let mockUser: any = null;
let mockLoading = false;

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: mockLoading,
  }),
}));

describe('BottomNav Component', () => {
  beforeEach(() => {
    mockUser = null;
    mockLoading = false;
    vi.clearAllMocks();
  });

  it('renders nothing when loading is true', () => {
    mockLoading = true;
    const { container } = render(<BottomNav />);
    expect(container.firstChild).toBeNull();
  });

  it('renders public nav items when user is not logged in', () => {
    render(<BottomNav />);
    expect(screen.getByText('Home')).toBeDefined();
    expect(screen.getByText('Jobs')).toBeDefined();
    expect(screen.getByText('Business')).toBeDefined();
    expect(screen.getByText('Services')).toBeDefined();
    expect(screen.getByText('Profile')).toBeDefined();
  });

  it('renders job seeker nav items correctly', () => {
    mockUser = { uid: 'u1', role: 'job_seeker' };
    render(<BottomNav />);
    expect(screen.getByText('Dashboard')).toBeDefined();
    expect(screen.getByText('Job Search')).toBeDefined();
    expect(screen.getByText('Applications')).toBeDefined();
    expect(screen.getByText('Companies')).toBeDefined();
    expect(screen.getByText('More')).toBeDefined();
  });

  it('renders employer nav items correctly', () => {
    mockUser = { uid: 'u2', role: 'employer' };
    render(<BottomNav />);
    expect(screen.getByText('Dashboard')).toBeDefined();
    expect(screen.getByText('Jobs')).toBeDefined();
    expect(screen.getByText('Products')).toBeDefined();
    expect(screen.getByText('Messages')).toBeDefined();
    expect(screen.getByText('Account')).toBeDefined();
  });

  it('renders business owner/supplier nav items correctly', () => {
    mockUser = { uid: 'u3', role: 'business_owner' };
    render(<BottomNav />);
    expect(screen.getByText('Dashboard')).toBeDefined();
    expect(screen.getByText('Jobs')).toBeDefined();
    expect(screen.getByText('Products')).toBeDefined();
    expect(screen.getByText('Messages')).toBeDefined();
    expect(screen.getByText('Account')).toBeDefined();
  });

  it('renders service provider nav items correctly', () => {
    mockUser = { uid: 'u4', role: 'service_provider' };
    render(<BottomNav />);
    expect(screen.getByText('Dashboard')).toBeDefined();
    expect(screen.getByText('Jobs')).toBeDefined();
    expect(screen.getByText('Products')).toBeDefined();
    expect(screen.getByText('Messages')).toBeDefined();
    expect(screen.getByText('Account')).toBeDefined();
  });

  it('renders admin nav items correctly', () => {
    mockUser = { uid: 'u5', role: 'admin' };
    render(<BottomNav />);
    expect(screen.getByText('Dashboard')).toBeDefined();
    expect(screen.getByText('Approvals')).toBeDefined();
    expect(screen.getByText('Users')).toBeDefined();
    expect(screen.getByText('Broadcast')).toBeDefined();
    expect(screen.getByText('Settings')).toBeDefined();
  });
});
