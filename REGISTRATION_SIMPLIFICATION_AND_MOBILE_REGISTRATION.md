# THENIJOBS Registration Page – Simplified User Roles and Mobile Number Registration

## 1. Executive Summary

The THENIJOBS public registration page (`/register`) has been enhanced to provide a streamlined, secure, and user-friendly experience. As requested:
1. **Exactly Two Public Roles**:
   - **Job Seeker** – வேலை தேடுகிறேன்
   - **Business Owner** – Business வைத்திருக்கிறேன்
   All internal, employee, administrative, supplier, and service-provider roles have been completely removed from the public registration selector while preserving existing user accounts and backend access.
2. **Mandatory Indian Mobile Number Registration**:
   - Mandatory 10-digit mobile number input with default `+91` country code.
   - Strict client and server validation ensuring standard Indian mobile prefixes (`^[6-9]\d{9}$`).
   - Normalization (`+91${cleanPhone}`).
   - Proactive duplicate account prevention both at Firestore and Firebase Auth levels.
3. **High Security Standards**:
   - Zero password exposure in Firestore. Passwords are handled strictly by Firebase Authentication.
   - Backend role whitelisting ensures users cannot inject administrative or unauthorized roles.
   - Business owners are not forced to complete lengthy company profile details during basic account registration, preventing fake or placeholder data.
4. **Seamless Login & Routing**:
   - `/login` supports logging in via either a 10-digit mobile number or email address with password.
   - "Don't have an account? Join Free" links directly to `/register`.
   - Role-based redirection sends Job Seekers to `/seeker/dashboard` and Business Owners to `/employer/dashboard`.

---

## 2. Public Role Selection Architecture

The role selection screen (`step === 1`) displays:
- **Heading**: `"I am a... 👋"`
- **Subtitle**: `"Select your role for a personalised experience"`

### Role 1: Job Seeker
- **Title**: `Job Seeker`
- **Tamil Sublabel**: `வேலை தேடுகிறேன்`
- **Description**: `Find jobs in Theni & Tamil Nadu in minutes.`
- **Supporting Points**:
  - Free for job seekers.
  - Verified local businesses.
  - Setup in minutes.
- **Assigned Role**: `job_seeker`
- **Post-Registration Destination**: `/seeker/dashboard`

### Role 2: Business Owner
- **Title**: `Business Owner`
- **Tamil Sublabel**: `Business வைத்திருக்கிறேன்`
- **Description**: `List your business, get leads & enquiries.`
- **Supporting Points**:
  - List your business, get leads & enquiries.
  - Direct customer calls & WhatsApp leads.
  - Post jobs & hire local talent.
- **Assigned Role**: `business_owner`
- **Post-Registration Destination**: `/employer/dashboard`

Internal roles (`admin`, `super_admin`, `employer`, `supplier`, `service_provider`) are excluded from public registration. Existing authorized administrators and employees continue to use their existing credentials and permission boundaries unaffected.

---

## 3. Registration Form & Mobile Number Validation

The form (`step === 2`) collects basic account credentials:
1. **Full Name** (Mandatory, minimum 2 characters).
2. **Mobile Number** (Mandatory):
   - Prefixed with 🇮🇳 `+91`.
   - Validated against `/^[6-9]\d{9}$/`.
   - Automatically normalized to `+91${cleanPhone}`.
   - Prevents registration if empty, malformed, or already in use.
3. **Email Address** (Optional):
   - If provided, used for recovery and direct email login.
   - If omitted, standard alias `${cleanPhone}@thenijobs.com` is used for Firebase Auth.
4. **Password** (Mandatory, minimum 6 characters):
   - Features password visibility toggle (`Eye` / `EyeOff`).
   - Passed solely to Firebase Authentication (`createUserWithEmailAndPassword`).
   - **Never saved or logged to Firestore**.

---

## 4. Role-Based Workflow & Dashboard Redirection

- **Job Seeker**:
  Upon submission, a user record is initialized with `role: 'job_seeker'` and the user is redirected to `/seeker/dashboard`.
- **Business Owner**:
  Upon submission, a user record is initialized with `role: 'business_owner'` and the user is redirected to `/employer/dashboard`.
  - **No Fake Company Creation**: Company name, address, GST, logo, and categories are completed organically through the employer dashboard onboarding flow.

---

## 5. Login Dual-Mode Enhancement (`/login`)

The member sign-in page has been enhanced to accept either:
1. A **10-digit Indian Mobile Number** (e.g., `9360519460` or `+919360519460`).
2. A standard **Email Address** (e.g., `you@example.com`).

When a mobile number is entered:
- The system queries Firestore for the associated user account or resolves `${cleanPhone}@thenijobs.com`.
- Authenticates securely via `signInWithEmail(resolvedEmail, password)`.
- Redirects users based on their stored Firestore role.

---

## 6. Automated Testing & Verification

A dedicated test suite was implemented in [registration.test.mjs](file:///d:/project/thenijobs-web-main/thenijobs-web-main/tests/registration.test.mjs):
- **Role Whitelist Test**: Verifies only `job_seeker` and `business_owner` are exposed and internal roles are blocked.
- **Mobile Number Validation Test**: Verifies Indian mobile prefix rules, length checks, and normalization.
- **Payload & Security Constraints Test**: Verifies password length, name requirement, and confirms `password` field is absent from Firestore schemas.
- **Redirection Mapping Test**: Confirms proper dashboard routing per role.
- **Login Dual-Mode Test**: Validates identifier normalization for phone and email inputs.

### Test Execution Results
```bash
npm test
```
- **Total Test Suites**: 20
- **Total Tests Passed**: 89
- **Failures**: 0

### TypeScript Check
```bash
npx tsc --noEmit
```
- **Exit Code**: 0 (0 compilation errors).

### Live Route HTTP Status
- `GET http://localhost:3000/register`: HTTP 200 OK
- `GET http://localhost:3000/login`: HTTP 200 OK
