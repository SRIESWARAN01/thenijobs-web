# THENIJOBS Google Sign-In — Production Setup & Operations Guide

---

## 1. Overview

This guide provides operational and configuration instructions to enable and manage **Google Sign-In with Automatic Account Creation** on THENIJOBS across Local Development, Preview Deployments, and Production (`https://www.thenijobs.com`).

---

## 2. Firebase Console Configuration

### 2.1. Enable Google Sign-In Provider
1. Log in to the [Firebase Console](https://console.firebase.google.com/).
2. Select the THENIJOBS project: **`thenijobs-9f01d`**.
3. In the left navigation, click **Build** → **Authentication**.
4. Navigate to the **Sign-in method** tab.
5. In the *Sign-in providers* list, click on **Google**.
6. Switch the toggle to **Enable**.
7. Set the **Project public-facing name**: `THENIJOBS`
8. Set the **Project support email**: `admin@thenijobs.com` or your designated administrator email.
9. Click **Save**.

### 2.2. Configure Authorized Domains
Under **Authentication** → **Settings** → **Authorized domains**, ensure the following domains are added to prevent `auth/unauthorized-domain` errors:

| Domain | Environment | Purpose |
|---|---|---|
| `localhost` | Development | Local testing on port 3000 / 3001 |
| `127.0.0.1` | Development | Alternative local loopback address |
| `thenijobs.com` | Production | Apex custom domain |
| `www.thenijobs.com` | Production | Canonical production domain |
| `thenijobs-9f01d.firebaseapp.com` | Firebase | Default Firebase OAuth redirect handler |
| `thenijobs-9f01d.web.app` | Firebase | Alternative Firebase hosting domain |
| `*.vercel.app` | Preview / CI | Vercel preview environments and branch builds |

---

## 3. Google Cloud Console (OAuth 2.0 Credentials)

When Google Sign-In is enabled in Firebase, a Google Cloud OAuth 2.0 Client ID is automatically generated. To verify or customize branding:

1. Open [Google Cloud Console](https://console.cloud.google.com/) for project `thenijobs-9f01d`.
2. Go to **APIs & Services** → **Credentials**.
3. Under *OAuth 2.0 Client IDs*, locate **Web client (auto created by Google Service)**.
4. Verify **Authorized JavaScript origins**:
   - `http://localhost:3000`
   - `http://localhost:3001`
   - `https://www.thenijobs.com`
   - `https://thenijobs.com`
   - `https://thenijobs-9f01d.firebaseapp.com`
5. Verify **Authorized redirect URIs**:
   - `https://thenijobs-9f01d.firebaseapp.com/__/auth/handler`

---

## 4. Environment Variables Checklist

Ensure the following variables are defined in your local `.env.local` and Vercel Project Environment Settings:

```bash
# Public Firebase Client Configuration
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="thenijobs-9f01d.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="thenijobs-9f01d"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="thenijobs-9f01d.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="1:..."

# Firebase Admin Service Account (Server-Side Role Assignment & Approvals)
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"thenijobs-9f01d",...}'
```

---

## 5. Verification & Testing Procedures

### Test Case A: Existing Member Sign-In
1. Navigate to `https://www.thenijobs.com/login`.
2. Click **Continue with Google**.
3. Select an existing user's Google account in the popup.
4. **Expected Result:**
   - Pop-up closes immediately.
   - User profile in Firestore is updated with fresh `lastLoginAt` and `authProvider: 'google.com'`.
   - Existing role and approval status are 100% preserved.
   - User is redirected to their appropriate dashboard (`/seeker/dashboard`, `/employer/dashboard`, or `/admin/dashboard`).

### Test Case B: New Job Seeker Registration
1. Navigate to `https://www.thenijobs.com/register`.
2. Ensure **Job Seeker** is selected.
3. Click **Continue with Google as Job Seeker**.
4. Select a new Google account in the popup.
5. **Expected Result:**
   - Firebase Auth account is provisioned automatically.
   - Firestore document `users/{uid}` is created with `role: 'job_seeker'`, `approvalStatus: 'approved'`, `accountStatus: 'active'`.
   - User lands directly in `/seeker/dashboard` without filling out registration forms.

### Test Case C: New Business Owner Registration
1. Navigate to `https://www.thenijobs.com/register`.
2. Select **Business Owner**.
3. Click **Continue with Google as Business Owner**.
4. **Expected Result:**
   - Account is created with `role: 'business_owner'`, `approvalStatus: 'pending'`, `canPostJobs: false`.
   - Automatically navigates to `/register-business` Step 2 (Plan Selection / Free Trial).
   - Selecting 15-Day Free Trial sets `trialRequested: true`, pending Admin approval.
   - Dashboard access remains locked until approved by an Admin.

### Test Case D: Account Linking (Email/Password Conflict)
1. Register an account with `testuser@example.com` and a password.
2. Log out.
3. On `/login`, click **Continue with Google** using that same `testuser@example.com`.
4. **Expected Result:**
   - Account Linking Modal opens: *"Link Your Google Account"*.
   - Entering the existing password calls `linkGoogleAccount()`.
   - The user is signed in, Google credential is linked to their existing UID, and Firestore data remains intact.

---

## 6. Troubleshooting Matrix

| Error Code | Root Cause | Solution |
|---|---|---|
| `auth/unauthorized-domain` | The active domain is not in Firebase Auth settings. | Add your domain to Firebase Console → Authentication → Settings → Authorized domains. |
| `auth/popup-blocked` | Web browser blocked the OAuth popup. | Allow popups for `thenijobs.com` in browser address bar. |
| `auth/popup-closed-by-user` | User closed the Google account selector before completing. | Click "Continue with Google" again and complete selection. |
| `auth/operation-not-allowed` | Google provider is disabled in Firebase. | Enable Google in Firebase Console → Authentication → Sign-in method. |
| `auth/account-exists-with-different-credential` | An email/password account already exists for this email. | Enter your password in the displayed linking modal to merge Google sign-in. |
| `auth/network-request-failed` | Device lost internet connectivity during OAuth handshake. | Verify network connectivity and retry. |
