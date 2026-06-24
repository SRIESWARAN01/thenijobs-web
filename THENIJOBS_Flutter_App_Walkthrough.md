# THENIJOBS Flutter App — Guided Walkthrough (Target Demo)

**For:** Siddhu · **Date:** 10 June 2026 · **Scope:** Flutter mobile app (`thenijobs-flutter/`)

This is a screen-by-screen "demo on paper": how each flow **should work** once the fixes are in, with a callout for what the app does **today**. Use it as the acceptance spec while building, and pair it with the companion **Fix-Prompt Pack** (`THENIJOBS_Flutter_Fix_Prompts.md`).

**Legend:** 🟢 already real today · 🟡 partly works (read-only/limited) · 🔴 stub/missing today.

Every screen must write the **same Firestore fields and side-effects as the web app** (field names, status values, and notifications). Parity anchors are noted as → `web: <file>`.

---

## 0. App start & navigation (target)

On launch the app initializes Firebase, Hive, **and** push + analytics (today push/analytics are not wired). A bottom navigation bar gives signed-in users one-tap access to their portal home, Search (Jobs), Messages, Notifications, and Profile/Menu. `go_router` already guards `/seeker`, `/employer`, `/admin` by role.

> **Today:** `main.dart` inits only Firebase + Hive; there's no bottom nav for portals (each portal route renders a single generic scaffold).

---

## 1. SEEKER (job-seeker) journey

### 1.1 Register & sign in — 🟢 works today
The user picks a role, enters name/email/password (or Google / phone OTP). On success they land on the Seeker Dashboard. Password reset and OTP already work.

### 1.2 Seeker Dashboard — 🟡 today read-only
**Demo:** Four live tiles (Applications, Saved Jobs, Interviews, Unread) and two lists (Recent applications, Latest notifications). Tapping a tile opens the matching screen; a prominent "Complete your profile" banner appears until the profile + resume exist.
**Parity:** counts come from `applications`(`seekerId`), `savedJobs`(`userId`), `interviews`(`seekerId`), `notifications`(`userId`,`read==false`).
> Today this renders correctly as read-only tiles/lists — keep it, just add navigation + the profile-completion banner.

### 1.3 Profile editor — 🔴 stub today → must become a real form
**Demo:** The seeker edits name, headline, district, summary, contact, education and experience (add/remove rows), and a profile photo (image picker → Storage). Saving writes `seekerProfiles/{uid}` and recomputes `profileStrength`.
**Parity (critical):** write `profileStrength` (NOT `profileCompletion`), `name`, `skills`, `experience[]`, `education[]` exactly as → `web: src/lib/types/index.ts` (`JobSeekerProfile`). Photo to Storage path `seekers/{uid}/...` per `storage.rules`.

### 1.4 Resume — 🔴 stub today → unblocks everything
**Demo:** The seeker uploads a PDF (file picker → Storage `resumes/{uid}/...`) or builds one; each resume is appended to the `resumes[]` array on `seekerProfiles/{uid}` with `{id, name, url, uploadDate, isDefault}`. They can set a default and delete.
**Why it's the #1 fix:** the Apply sheet requires a resume in `resumes[]`. Today the "Manage Resumes" button leads to this stub, so a mobile-only user can **never apply**. → `web: JobDetailPageClient.tsx` (reads `seekerProfile.resumes`).

### 1.5 Search jobs & job detail + Apply — 🟢 works today (one fix)
**Demo:** Browse/search jobs, open a job, tap **Apply**, pick a resume, write a cover letter, submit → an `applications/{seekerId}_{jobId}` doc is created and the employer is notified.
**Fix:** the mobile apply must also write `seekerEmail` and `seekerPhone` (today it omits them, so employers see blank contact for app-submitted candidates). → `web: firestoreService.ts applyToJob`.

### 1.6 My Applications — 🟡 read-only today
**Demo:** Pipeline view (Applied / Shortlisted / Interview / Selected / Rejected) with status chips; tapping one shows the job, cover letter, employer note, and any scheduled interview. Pull-to-refresh; pagination beyond 20.

### 1.7 Saved Jobs — 🟡 works via job detail
**Demo:** List of saved jobs with quick "Apply" and "Remove". Already saveable from job detail; this screen just needs the real list + remove action.

### 1.8 Job Alerts — 🔴 create missing today
**Demo:** Create an alert (keyword, district, job type, push on/off) → writes `jobAlerts/{auto}` with `userId`. Existing alerts can be activated/paused (today only the toggle exists). When push is wired, matching new jobs trigger a notification.

### 1.9 Interviews — 🟡 read-only
**Demo:** Upcoming/past interviews with date, time, mode (phone/video/in-person), location/link, and a reminder. Read-only is acceptable for the seeker (employer schedules).

### 1.10 Messages — 🔴 thread missing today
**Demo:** Conversation list → open a thread → read messages and **send** a reply. Sending writes to `conversations/{id}/messages` with `senderId==uid`; updates `lastMessage`/`lastMessageAt`. → `web: firestoreService.ts startConversation` + `conversations` rules.
> Today only a read-only conversation list exists; there is no thread or compose.

### 1.11 Notifications — 🟢/🟡 works
**Demo:** List with unread badge, mark-one / mark-all read. Add **push** delivery so the user is alerted in real time (see §4).

### 1.12 Skills / AI Coach / Subscription / Settings — 🔴 read-only today
**Demo:** Skills editor (add/remove → `seekerProfiles.skills`); AI Coach surface (links + resume tips); Subscription view of current plan; Settings to edit notification/privacy prefs and dark mode. Settings must actually **write** changes (today they only display documents).

---

## 2. EMPLOYER / HR journey

### 2.1 Register company — 🟢 works today
**Demo:** Real form → creates `companies` doc (`status:'pending'`, `isActive:false`) and links `users/{uid}.companyId`. Keep as-is.

### 2.2 Employer Dashboard — 🟡 read-only today
**Demo:** Tiles for Jobs, Applications, Leads, Interviews (filtered by `companyId`) plus recent applications/jobs and quick actions (Post job, Candidates, Leads, Billing). Keep the layout; wire the quick actions to real screens.
**Fix:** job cards must read `applicationsCount` (today they read `applicationCount`, always blank). → `web: firestoreService.ts`.

### 2.3 Company Profile editor — 🔴 stub today
**Demo:** Edit business details, logo/cover/gallery (image picker → Storage `companies/{companyId}/...`), services, social links. Writes `companies/{companyId}` honoring `companies` update rules (cannot self-verify/feature).

### 2.4 Post a Job — 🔴 **biggest employer gap**
**Demo:** A multi-step wizard mirroring the web (Details → Requirements → Compensation → Preview) that creates a `jobs` doc with `status:'pending'`, `isActive:false`, `postedBy:uid`, `companyId`, `companyName`. It stays pending until an admin approves.
**Parity:** match field names and the pending-approval gate exactly. → `web: src/app/employer/post-job/page.tsx`.
> Today the "Post Job" route only lists existing jobs — there is no posting form, so **employers cannot create jobs on mobile**.

### 2.5 My Jobs — 🟡 list + toggles
**Demo:** List with status, applicants count, and edit/pause/close actions; tap a job → see its applicants.

### 2.6 Candidates (pipeline) — 🟡 toggles only today → make it real
**Demo:** Tabs (New/Shortlisted/Interview/Selected/Rejected). Each candidate card shows name, role applied, and **contact from the application doc** (name/email/phone/resume — employers can read applications). Actions: Shortlist / Select / Reject (each **sends the candidate a notification**, like web), open resume, message, and **Schedule interview**.
**Fix:** today the generic toggle updates status **without notifying** the candidate — add `createNotification` on each change. → `web: src/app/employer/candidates/page.tsx`.

### 2.7 Schedule interview — 🔴 missing today
**Demo:** From a candidate, open a form (date, time, mode, location/link) → creates an `interviews` doc (`companyId`, `seekerId`, `jobId`), sets the application to `interview_scheduled`, and notifies the seeker. Today only "Complete/Cancel" toggles exist; you cannot **create** an interview.

### 2.8 Talent Search — 🔴 blocked by rules (same as web)
**Demo:** Search candidates by skill/district/experience and see **redacted** profiles (contact hidden until Premium + candidate consent). This must go through a **Cloud Function**, because security rules (correctly) forbid employers from reading `seekerProfiles` directly. Today the screen reads `seekerProfiles` and returns nothing.

### 2.9 Leads / Reviews / Messages / Billing / Reports / Settings — 🟡/🔴
**Demo:** Leads inbox with status actions (real today as toggles); Reviews with a **reply** box (write `reply`); Messages with real threads (§1.10); Billing showing plan + upgrade (payment gateway is a separate web+app project); Reports with `fl_chart` charts over the metric data; Settings that actually save.

---

## 3. ADMIN journey

### 3.1 Admin Dashboard & approvals — 🟡 works as toggles
**Demo:** Platform tiles (Users, Businesses, Jobs, Leads); Business and Job approval lists with Approve / Reject / Feature actions (these work today via generic doc updates). Keep, but align job status with web vocabulary (`active`/`rejected`, not `approved`).

### 3.2 Users & roles — 🔴 read-only today
**Demo:** User list with verify and **change-role** actions (writes `users/{uid}.role`, admin-only per rules). Today there are no actions on the users screen.

### 3.3 Notifications / Broadcasts — 🔴 composer missing
**Demo:** Compose a broadcast (title, message, audience) → writes `broadcasts` and fans out notifications. Today only read-only lists exist.

### 3.4 Reviews / Services / Ads / Subscriptions — 🟡 toggles
**Demo:** Moderation lists with approve/flag/activate/pause (work today). Add detail views.

### 3.5 Security / Settings — 🟡/🔴
**Demo:** Activity log (note: empty until the web's `logActivity` is implemented server-side); Settings must read `platformSettings` (today it reads the non-existent `settings` collection, so it's always empty).

---

## 4. Cross-cutting: Push, Analytics, Offline (target)

- **Push:** on login, request permission, get the FCM token, store it on `users/{uid}.fcmTokens`, handle foreground/background messages, and deep-link taps to the right screen. (`PushNotificationService` exists but is never called.)
- **Analytics:** log screen views and key events (apply, post-job, register). (`AnalyticsService` exists but is never called.)
- **Offline:** cache last-loaded lists in Hive and show them with a "offline" banner via `connectivity_plus`.
- **Store readiness:** disable `demoLoginEnabled`, add deep-link config (App Links / Universal Links), permission strings (camera/photos for pickers), and Crashlytics.

---

## 5. "Definition of done" per screen

A portal screen is done when it: (1) renders real, role-appropriate data; (2) supports the **create/edit** actions the web has (not just view); (3) writes the **exact field names** the web uses; (4) fires the **same notifications/side-effects**; (5) respects the security rules (no forbidden reads like raw `seekerProfiles`); and (6) handles loading/empty/error states. Track these against the Fix-Prompt Pack.
