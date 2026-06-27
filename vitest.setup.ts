import '@testing-library/jest-dom';
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'mock-api-key';
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'mock-auth-domain';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'mock-project-id';
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'mock-storage-bucket';
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 'mock-sender-id';
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'mock-app-id';
process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL = 'https://mock-database-url.firebaseio.com';

import React from 'react';

const originalUse = (React as any).use;
(React as any).use = function (promise: any) {
  if (promise && typeof promise.then === 'function') {
    if ('value' in promise) {
      return promise.value;
    }
    // Default fallback mock for params in detail pages
    return { id: 'prod_1' };
  }
  return originalUse ? originalUse.call(React, promise) : promise;
};

import { afterAll } from 'vitest';
afterAll(() => {
  if (originalUse) {
    (React as any).use = originalUse;
  }
});
