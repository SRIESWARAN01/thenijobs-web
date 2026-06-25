import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import EmployerDashboard from '../app/employer/dashboard/page';
import BusinessDashboardPage from '../app/business/dashboard/page';
import ServiceDashboardPage from '../app/service/dashboard/page';
import AdminDashboard from '../app/admin/dashboard/page';

// 1. Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { uid: 'test_employer_123', displayName: 'Employer Name' },
    loading: false,
  }),
  useRequireAuth: (allowedRoles: string[]) => ({
    user: { uid: 'test_user_456', displayName: 'Mock User', role: allowedRoles[0] },
    loading: false,
  }),
}));

// 2. Mock useFirestore
vi.mock('@/hooks/useFirestore', () => ({
  useCollection: (collectionName: string) => {
    if (collectionName === 'companies') {
      return {
        data: [{ id: 'company_123', name: 'Super Enterprises', ownerId: 'test_employer_123' }],
        loading: false,
        error: null,
      };
    }
    if (collectionName === 'jobs') {
      return {
        data: [{ id: 'job_1', title: 'Sales Executive', applicationsCount: 5, viewCount: 12, isActive: true }],
        loading: false,
        error: null,
      };
    }
    if (collectionName === 'applications') {
      return {
        data: [{ id: 'app_1', seekerName: 'John Doe', status: 'applied', jobId: 'job_1', createdAt: '2026-06-15T10:00:00Z' }],
        loading: false,
        error: null,
      };
    }
    if (collectionName === 'interviews') {
      return {
        data: [{ id: 'int_1', seekerName: 'John Doe', date: '2026-06-18', time: '14:00', mode: 'Phone' }],
        loading: false,
        error: null,
      };
    }
    if (collectionName === 'services') {
      return {
        data: [{ id: 'service_1', name: 'AC Repair', providerId: 'test_user_456' }],
        loading: false,
        error: null,
      };
    }
    if (collectionName === 'leads') {
      return {
        data: [{ id: 'lead_1', contactName: 'Alice', status: 'new' }],
        loading: false,
        error: null,
      };
    }
    return { data: [], loading: false, error: null };
  },
}));

// 3. Mock useRealtimeStats
vi.mock('@/hooks/useRealtimeStats', () => ({
  useEmployerStats: () => ({
    stats: {
      activeJobs: 2,
      totalApplications: 15,
      pendingReview: 5,
      shortlisted: 3,
      interviewScheduled: 2,
      interviews: 2,
      hired: 1,
      rejected: 4,
    },
    loading: false,
  }),
  usePlatformStats: () => ({
    stats: {
      totalUsers: 120,
      totalCompanies: 15,
      totalBusinesses: 10,
      totalEmployers: 25,
      totalJobSeekers: 95,
      activeJobs: 30,
      totalApplications: 85,
      totalWalkInRegistrations: 10,
      totalLeads: 40,
      totalRevenue: 5000,
      pendingBusinesses: 2,
      pendingJobs: 3,
      pendingUsers: 1,
    },
    loading: false,
  }),
}));

// 4. Mock shop/firestore services
vi.mock('@/lib/firebase/shopService', () => ({
  getShopStats: async () => ({ totalOrders: 12, totalRevenue: 1200, pendingOrders: 3 }),
}));

vi.mock('@/lib/firebase/firestoreService', () => ({
  getActivityLogs: async () => [
    { id: 'log_1', action: 'User registered', target: 'Bob', timestamp: Date.now() },
  ],
  approveCompany: async () => {},
  rejectCompany: async () => {},
  approveJob: async () => {},
  rejectJob: async () => {},
}));

describe('EmployerDashboard Page Component', () => {
  it('renders stats grid and lists correctly', () => {
    render(<EmployerDashboard />);

    expect(screen.getByText('Employer Dashboard')).toBeDefined();
    expect(screen.getByText('Super Enterprises — manage your pipeline')).toBeDefined();
    expect(screen.getByText('Sales Executive')).toBeDefined();
    expect(screen.getAllByText('John Doe').length).toBeGreaterThanOrEqual(1);
  });
});

describe('BusinessDashboard Page Component', () => {
  it('renders business dashboard elements', () => {
    render(<BusinessDashboardPage />);

    expect(screen.getByText('Real-Time Analytics Insights')).toBeDefined();
    expect(screen.getByText('Super Enterprises')).toBeDefined();
  });
});

describe('ServiceDashboard Page Component', () => {
  it('renders service dashboard elements', () => {
    render(<ServiceDashboardPage />);

    expect(screen.getByText('Service Dashboard')).toBeDefined();
    expect(screen.getByText('Super Enterprises')).toBeDefined();
  });
});

describe('AdminDashboard Page Component', () => {
  it('renders system stats, pending approvals and actions', async () => {
    await act(async () => {
      render(<AdminDashboard />);
    });

    // Switch to Audit tab to see activity logs
    const auditTabBtn = screen.getByRole('button', { name: /Audit Activities/i });
    fireEvent.click(auditTabBtn);

    await waitFor(() => {
      expect(screen.getByText('User registered')).toBeDefined();
    });

    expect(screen.getByText('BI Control Center')).toBeDefined();
    expect(screen.getByText('Dashboard Overview')).toBeDefined();
  });
});
