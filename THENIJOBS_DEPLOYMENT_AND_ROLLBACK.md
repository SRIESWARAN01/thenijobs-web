# THENIJOBS — Deployment, Infrastructure & Rollback Operations Runbook

> **Platform:** THENIJOBS Web Platform & Flutter Mobile Application  
> **Environment:** Next.js 16.3.4 (Vercel) + Flutter 3.x (Play Store / App Store) + Firebase (`thenijobs-9f01d`)  
> **Date:** October 2026 Production Release  

---

## 1. Production Architecture Overview

The THENIJOBS platform operates across three interconnected infrastructure environments:
1. **Next.js Web Application:** Hosted on Vercel's global edge network with serverless functions for API endpoints and cron jobs.
2. **Firebase Cloud Backend (`thenijobs-9f01d`):** Cloud Firestore NoSQL database, Firebase Authentication, and Firebase Storage.
3. **Flutter Cross-Platform Mobile Application:** Distributed as an Android App Bundle (`.aab`) to the Google Play Store and iOS Archive (`.ipa`) to Apple TestFlight / App Store.

---

## 2. Environment Variables & Secret Configuration Checklist

Configure the following secrets in the Vercel Dashboard (`Settings` → `Environment Variables`):

```bash
# --- Razorpay Live Payment Gateway ---
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxxxx

# --- Firebase Admin Privileged SDK ---
FIREBASE_PROJECT_ID=thenijobs-9f01d
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@thenijobs-9f01d.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# --- Client Firebase Configuration ---
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=thenijobs-9f01d.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=thenijobs-9f01d
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=thenijobs-9f01d.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxxxxxxxxxxx
NEXT_PUBLIC_FIREBASE_APP_ID=1:xxxxxxxxxxxx:web:xxxxxxxxxxxx

# --- Scheduled Cron Security ---
CRON_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# --- Multi-Model AI Gateway ---
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxx
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx

# --- SMS & Voice OTP Telephony ---
TWO_FACTOR_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## 3. Web Application Deployment (Next.js on Vercel)

### Step 1: Pre-Deployment Validation
Run locally in `thenijobs-web-main`:
```bash
# 1. Strict TypeScript Check
npx tsc --noEmit

# 2. ESLint Code Quality Inspection
npm run lint

# 3. Unit & Integration Test Suite
npm test

# 4. Payment Workflow Verification
npx tsx scripts/test-payment-system.ts
```

### Step 2: Deployment via Authorized Git Flow or Vercel CLI
```bash
# Deploy to Production
vercel --prod
```

### Step 3: Verify Scheduled Cron Jobs
Confirm Vercel registers cron routes defined in `vercel.json`:
- `GET /api/cron/expire-jobs` (Every day at 01:00 UTC)
- `GET /api/cron/expire-trials` (Every day at 00:00 UTC)

---

## 4. Firebase Cloud Backend Deployment

Deploy security rules and database indexes using the Firebase CLI:
```bash
# 1. Login to Firebase CLI
firebase login

# 2. Select the Production Project
firebase use thenijobs-9f01d

# 3. Deploy Firestore Security Rules & Indexes
firebase deploy --only firestore:rules,firestore:indexes

# 4. Deploy Firebase Storage MIME & Size Rules
firebase deploy --only storage
```

---

## 5. Razorpay Webhook Configuration

1. Log in to the [Razorpay Live Dashboard](https://dashboard.razorpay.com/).
2. Navigate to **Settings** → **Webhooks** → **Add New Webhook**.
3. Enter Webhook URL: `https://www.thenijobs.com/api/payment/webhook`.
4. Enter Webhook Secret: Match the value set in `RAZORPAY_WEBHOOK_SECRET`.
5. Select Active Events:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
6. Save and send a test webhook payload. Confirm receipt in `/admin/security` logs.

---

## 6. Flutter Mobile Application Deployment

### Android Release Build (`.aab`):
```bash
cd thenijobs_app

# 1. Run Flutter Test Suite
flutter test

# 2. Run Static Analyzer
dart analyze

# 3. Clean and build release Android App Bundle
flutter clean
flutter pub get
flutter build appbundle --release
```
The output file `build/app/outputs/bundle/release/app-release.aab` is uploaded to the **Google Play Console** internal or production track.

### iOS Release Build (`.ipa`):
```bash
cd thenijobs_app

# Build iOS Archive
flutter build ipa --release
```
Upload via **Transporter** or Xcode Organizer to **App Store Connect**.

---

## 7. Zero-Downtime Rollback Protocols

### A. Web Application Rollback (Vercel)
If a critical production bug emerges after a web deployment:
1. Navigate to the **Vercel Project Dashboard** → **Deployments**.
2. Identify the last known stable deployment.
3. Click the **Three Dots (...)** menu next to that deployment and select **Instant Rollback (Promote to Production)**.
4. Traffic shifts instantly (within < 5 seconds) to the previous immutable serverless build with zero downtime.

### B. Firestore Database Backup & Point-in-Time Recovery
Before running any data migrations:
```bash
# 1. Trigger Full Cloud Storage Export of Firestore
gcloud firestore export gs://thenijobs-backups/backup-$(date +%Y%m%d-%H%M%S) --project=thenijobs-9f01d

# 2. Emergency Restore Procedure (if needed)
gcloud firestore import gs://thenijobs-backups/backup-TARGET-TIMESTAMP/ --project=thenijobs-9f01d
```

### C. Emergency Maintenance Mode Gate
If platform maintenance or hotfixing requires taking the public site offline:
1. Navigate to `/admin/settings` (or update Firestore directly via Firebase Console).
2. Set document `platformSettings/public` property `maintenance: true`.
3. The Next.js application immediately displays the bilingual maintenance gate (`MaintenanceGate.tsx`) to all public visitors.
4. All `/admin/**` routes and `/login` remain fully functional so administrators can troubleshoot and resolve issues before disabling maintenance mode.
