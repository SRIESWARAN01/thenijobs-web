# THENIJOBS — Production Deployment & Operations Guide

**Version:** 1.0.0 Production  
**Target Infrastructure:** Vercel (Next.js Edge/Serverless) + Firebase (Auth, Cloud Firestore, Cloud Storage)  
**Primary Domain:** `https://www.thenijobs.com`  
**Secondary / Preview URL:** `https://thenijobs-web-main-nw66tqv3r-agrimorein-3047s-projects.vercel.app`

---

## 1. Environment Variables Configuration

The following environment variables must be configured in Vercel Project Settings:

### 1.1 Firebase Client Configuration
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=thenijobs-f7b5e.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=thenijobs-f7b5e
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=thenijobs-f7b5e.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 1.2 Firebase Admin & Service Credentials
```env
FIREBASE_ADMIN_PROJECT_ID=thenijobs-f7b5e
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@thenijobs-f7b5e.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 1.3 Razorpay Payment Gateway Credentials
```env
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

### 1.4 AI Provider API Keys
```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxx
```

### 1.5 System & Cron Secrets
```env
CRON_SECRET=your_high_entropy_random_secret_token
NEXT_PUBLIC_SITE_URL=https://www.thenijobs.com
```

---

## 2. Pre-Deployment Verification Checklist

Before pushing to production:
1. **Lint & Static Types:** Run `npx tsc --noEmit`. Must exit 0.
2. **Automated Unit & Integration Tests:** Run `npm test`. All 99 tests must pass.
3. **Production Build Validation:** Run `npm run build`. Turbopack must generate all 321 static and dynamic pages with 0 errors.

---

## 3. Deployment Procedure

### Deploying to Vercel
```bash
# Push directly to main or trigger via Vercel CLI
vercel --prod
```

### Deploying Firebase Rules & Indexes
```bash
# Deploy Firestore Security Rules & Indexes
firebase deploy --only firestore:rules,firestore:indexes

# Deploy Cloud Storage Rules
firebase deploy --only storage:rules
```

---

## 4. Production Cron Schedules

Configured in `vercel.json` for automatic maintenance:
1. **`/api/cron/expire-jobs`**: Runs daily at midnight (`0 0 * * *`) to unpublish jobs that have reached their 30-day lifecycle.
2. **`/api/cron/expire-trials`**: Runs daily at midnight (`0 0 * * *`) to transition expired 15-day trials to `trial_expired` while preserving all database records.

---

## 5. Domain, SSL & Canonical Redirects

- **Canonical URL Policy:** Only `https://www.thenijobs.com` serves as the primary canonical domain.
- **Apex to WWW Redirect:** Requests to `https://thenijobs.com` automatically 301-redirect to `https://www.thenijobs.com`.
- **HTTP to HTTPS Redirect:** Managed at the edge by Vercel's SSL termination.
- **Anti-Redirect Loop Safeguard:** Validated in `proxy.ts` / Next.js middleware with `x-forwarded-proto` and canonical host inspection.
