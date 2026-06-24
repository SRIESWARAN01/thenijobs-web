import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../app/api/razorpay/webhook/route';
import { NextRequest } from 'next/server';
import { createHmac } from 'crypto';

// Setup Mock Firestore and Firebase Admin via vi.hoisted to prevent hoisting errors
const {
  mockDocSet,
  mockDocUpdate,
  mockDocGet,
  mockBatchSet,
  mockBatchUpdate,
  mockBatchCommit,
  mockBatch,
  mockCollectionWhereGet,
  mockCollectionAdd,
  mockCollection,
  mockDoc
} = vi.hoisted(() => {
  const mockDocSet = vi.fn().mockResolvedValue(undefined);
  const mockDocUpdate = vi.fn().mockResolvedValue(undefined);
  const mockDocGet = vi.fn();

  const mockBatchSet = vi.fn();
  const mockBatchUpdate = vi.fn();
  const mockBatchCommit = vi.fn().mockResolvedValue(undefined);

  const mockBatch = {
    set: mockBatchSet,
    update: mockBatchUpdate,
    commit: mockBatchCommit,
  };

  const mockCollectionWhereGet = vi.fn();
  const mockCollectionAdd = vi.fn().mockResolvedValue({ id: 'mock-log-id' });

  const mockWhereChain = {
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    get: mockCollectionWhereGet,
  };

  const mockCollection = vi.fn().mockReturnValue({
    doc: vi.fn().mockReturnValue({
      set: mockDocSet,
      update: mockDocUpdate,
      get: mockDocGet,
    }),
    where: vi.fn().mockReturnValue(mockWhereChain),
    add: mockCollectionAdd,
  });

  const mockDoc = vi.fn().mockReturnValue({
    set: mockDocSet,
    update: mockDocUpdate,
    get: mockDocGet,
  });

  return {
    mockDocSet,
    mockDocUpdate,
    mockDocGet,
    mockBatchSet,
    mockBatchUpdate,
    mockBatchCommit,
    mockBatch,
    mockCollectionWhereGet,
    mockCollectionAdd,
    mockCollection,
    mockDoc
  };
});

vi.mock('@/lib/firebaseAdmin', () => ({
  adminDb: {
    doc: mockDoc,
    collection: mockCollection,
    batch: vi.fn().mockReturnValue(mockBatch),
  }
}));

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    serverTimestamp: vi.fn(() => 'mock-server-timestamp'),
  },
  Timestamp: {
    fromDate: vi.fn((d) => d),
  }
}));

describe('Razorpay Webhook Handler API', () => {
  const webhookSecret = 'test_webhook_secret';

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RAZORPAY_WEBHOOK_SECRET = webhookSecret;
  });

  const generateSignature = (payloadStr: string) => {
    return createHmac('sha256', webhookSecret).update(payloadStr).digest('hex');
  };

  it('rejects requests with missing webhook secret config', async () => {
    delete process.env.RAZORPAY_WEBHOOK_SECRET;
    const req = new NextRequest('http://localhost/api/razorpay/webhook', {
      method: 'POST',
      body: JSON.stringify({ event: 'payment.captured' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).toBe('Webhook secret not configured');
  });

  it('rejects requests with invalid signature', async () => {
    const req = new NextRequest('http://localhost/api/razorpay/webhook', {
      method: 'POST',
      body: JSON.stringify({ event: 'payment.captured' }),
      headers: {
        'x-razorpay-signature': 'invalid_sig',
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toBe('Invalid signature');
  });

  it('handles signature verification failure or wrong length', async () => {
    const payload = { event: 'payment.captured' };
    const payloadStr = JSON.stringify(payload);
    const req = new NextRequest('http://localhost/api/razorpay/webhook', {
      method: 'POST',
      body: payloadStr,
      headers: {
        'x-razorpay-signature': 'too_short',
      },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('skips processing if the event was already processed (idempotency)', async () => {
    const payload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_123',
            order_id: 'order_123',
            amount: 48000,
            currency: 'INR',
            status: 'captured',
          },
        },
      },
    };
    const payloadStr = JSON.stringify(payload);
    const signature = generateSignature(payloadStr);

    // Mock idempotency doc exists
    mockDocGet.mockResolvedValueOnce({ exists: true });

    const req = new NextRequest('http://localhost/api/razorpay/webhook', {
      method: 'POST',
      body: payloadStr,
      headers: {
        'x-razorpay-signature': signature,
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toBe('Already processed');
    // Ensure no DB changes were made
    expect(mockBatch.commit).not.toHaveBeenCalled();
  });

  it('successfully processes payment.captured for a job seeker', async () => {
    const payload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_123',
            order_id: 'order_123',
            amount: 48000,
            currency: 'INR',
            status: 'captured',
          },
        },
      },
    };
    const payloadStr = JSON.stringify(payload);
    const signature = generateSignature(payloadStr);

    // 1. Idempotency doc does not exist
    mockDocGet.mockResolvedValueOnce({ exists: false });
    // 2. Client-side payment check: not processed yet
    mockCollectionWhereGet.mockResolvedValueOnce({ empty: true });
    // 3. Order metadata lookup
    mockDocGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        userId: 'user_seeker_abc',
        planSlug: 'basic',
        audience: 'seeker',
      }),
    });
    // 4. User details lookup
    mockDocGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        displayName: 'John Seeker',
        email: 'john@example.com',
        phone: '9876543210',
      }),
    });

    const req = new NextRequest('http://localhost/api/razorpay/webhook', {
      method: 'POST',
      body: payloadStr,
      headers: {
        'x-razorpay-signature': signature,
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toBe('OK');

    // Verify batch commits were executed
    expect(mockBatch.commit).toHaveBeenCalled();

    // Verify subscription and seeker profile updates were staged
    expect(mockBatch.set).toHaveBeenCalledTimes(3); // subscriptions, payments, seekerProfiles
  });

  it('successfully processes payment.captured for an employer/company', async () => {
    const payload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_456',
            order_id: 'order_456',
            amount: 120000,
            currency: 'INR',
            status: 'captured',
          },
        },
      },
    };
    const payloadStr = JSON.stringify(payload);
    const signature = generateSignature(payloadStr);

    // 1. Idempotency doc does not exist
    mockDocGet.mockResolvedValueOnce({ exists: false });
    // 2. Client-side payment check: not processed yet
    mockCollectionWhereGet.mockResolvedValueOnce({ empty: true });
    // 3. Order metadata lookup
    mockDocGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        userId: 'user_emp_xyz',
        planSlug: 'premium',
        audience: 'employer',
        companyId: 'company_999',
      }),
    });
    // 4. User details lookup
    mockDocGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        displayName: 'Alice Employer',
        email: 'alice@company.com',
        phone: '1234567890',
      }),
    });
    // 5. Company details lookup
    mockDocGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        name: 'Cool Tech Corp',
      }),
    });

    const req = new NextRequest('http://localhost/api/razorpay/webhook', {
      method: 'POST',
      body: payloadStr,
      headers: {
        'x-razorpay-signature': signature,
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    // Verify batch commit
    expect(mockBatch.commit).toHaveBeenCalled();
    // Verify subscription, payment, company updates, and order status update
    expect(mockBatch.set).toHaveBeenCalledTimes(2); // subscriptions, payments
    expect(mockBatch.update).toHaveBeenCalledTimes(2); // companies update, order update
  });

  it('handles payment.failed event by updating the order status', async () => {
    const payload = {
      event: 'payment.failed',
      payload: {
        payment: {
          entity: {
            id: 'pay_fail_111',
            order_id: 'order_fail_111',
            amount: 48000,
            currency: 'INR',
            status: 'failed',
            error_description: 'Card expired',
          },
        },
      },
    };
    const payloadStr = JSON.stringify(payload);
    const signature = generateSignature(payloadStr);

    // 1. Idempotency doc does not exist
    mockDocGet.mockResolvedValueOnce({ exists: false });
    // 2. Order doc query
    mockDocGet.mockResolvedValueOnce({ exists: true });

    const req = new NextRequest('http://localhost/api/razorpay/webhook', {
      method: 'POST',
      body: payloadStr,
      headers: {
        'x-razorpay-signature': signature,
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    // Verify order update was called
    expect(mockDocUpdate).toHaveBeenCalledWith(expect.objectContaining({
      status: 'failed',
      failureReason: 'Card expired',
    }));
  });
});
