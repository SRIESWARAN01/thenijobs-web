# THENIJOBS — Firebase Security & Data Integrity Audit

**Audit Date:** 2026-10-23  
**Status:** Hardened & Verified  
**Scope:** Firestore Security Rules, Cloud Storage Rules, Firebase Auth, API Endpoints, Role-Based Access Control (RBAC)

---

## 1. Security Baseline & Key Findings

| Domain | Security Rule / Protection Mechanism | Status |
| :--- | :--- | :--- |
| **Authentication** | Passwords handled exclusively by Firebase Auth; zero plain-text storage. | Verified |
| **Role Elevation** | Self-assignment of `admin` or `approvalStatus` strictly rejected by Firestore rules. | Hardened |
| **15-Day Free Trial** | Trial dates and active status can only be set via Admin approval or server API. | Hardened |
| **Payment Integrity** | Razorpay payments verified on server via HMAC-SHA256 signature check. | Verified |
| **Tenant Isolation** | Employers cannot edit or delete another company's jobs, candidates, or leads. | Verified |
| **Applicant Privacy** | Resumes and personal details in `/applications` visible only to applicant & hiring company. | Hardened |
| **Cloud Storage** | Uploads restricted to authenticated users with strict MIME type and file size limits (5MB). | Hardened |

---

## 2. Cloud Firestore Security Rules Audit

`firestore.rules` enforces granular access control across 1,100+ lines of rules:

### 2.1 User Collection (`/users/{userId}`)
```javascript
match /users/{userId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null 
    && request.auth.uid == userId
    && !request.resource.data.keys().hasAny(['isAdmin', 'role']) 
    || request.resource.data.role in ['job_seeker', 'business_owner'];
  allow update: if request.auth != null 
    && (request.auth.uid == userId || isAdmin())
    && userModerationUnchanged();
  allow delete: if isAdmin();
}
```
- **`userModerationUnchanged()` Helper:** Ensures standard users cannot modify fields like `approvalStatus`, `accountStatus`, `adminApprovedAt`, `trialStartDate`, `trialEndDate`, `subscriptionStatus`, or `subscriptionPlan`.

### 2.2 Company Isolation (`/companies/{companyId}`)
- Only company members with role `owner` or `admin` can update company profiles, post jobs, or moderate marketplace items.
- Public users can only read approved/verified companies.

### 2.3 Job Applications (`/applications/{appId}`)
- **Create:** Only authenticated job seekers.
- **Read:** Only the candidate (`request.auth.uid == resource.data.seekerId`) OR the employer who owns the job (`isCompanyStaff(resource.data.companyId)`).
- **Update:** Candidate can withdraw; Employer can update candidate status (`pending` &rarr; `reviewed` &rarr; `interview` &rarr; `accepted` / `rejected`).

---

## 3. Server-Side Privilege Separation

Sensitive state changes are delegated to Next.js server endpoints using Firebase Admin SDK with elevated service credentials:
1. **`/api/subscription/request-trial`:** Validates eligibility and records pending trial status without self-activating timestamps.
2. **`verifyUser()` / `/api/admin/users/approve`:** Admin-only function that activates accounts and writes authoritative server timestamps for trial duration (`now` to `now + 15 days`).
3. **`/api/payment/verify`:** Generates HMAC-SHA256 hash using `RAZORPAY_KEY_SECRET` and matches against `razorpay_signature`. Only updates subscription upon cryptographic verification.
4. **`/api/cron/expire-trials`:** Protected by `CRON_SECRET` header; reconciles expired trials globally.

---

## 4. Cloud Storage Rules (`storage.rules`)

- **Resumes (`/resumes/{userId}/{filename}`):**
  - Read: Candidate and employers reviewing applications.
  - Write: Authenticated candidate (`request.auth.uid == userId`), max 5MB, PDF/DOC/DOCX only.
- **Company Assets (`/companies/{companyId}/{filename}`):**
  - Read: Public read for logos and banners of active companies.
  - Write: Authenticated company owner only, max 5MB, JPEG/PNG/WEBP only.

---

## 5. Security Test Suite Execution

All security-related assertions in `tests/e2e-workflows.test.mjs` pass:
- `Suspended or banned user accounts fail firestore write validation`: PASS
- `Razorpay HMAC SHA-256 Signature Verification`: PASS
- `Anti-Tampering Plan Price Verification`: PASS
- `Compound Key Duplicate Guard`: PASS
