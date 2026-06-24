# THENIJOBS Flutter — Fix-Prompt Pack

**For:** Siddhu · **Date:** 10 June 2026 · **Scope:** Flutter app (`thenijobs-flutter/`)

Copy-paste prompts for a developer or AI coding agent. Each is self-contained: **context → files → task → parity constraints → acceptance criteria**. Do them roughly in order (P0 first). Companion spec: `THENIJOBS_Flutter_App_Walkthrough.md`.

### Global context to paste once at the start of any session

```
You are working in the Flutter app at thenijobs-flutter/. It shares a Firebase backend (Firestore/Auth/Storage) with a Next.js web app in src/. State = Riverpod, routing = go_router. Today, every /seeker, /employer, /admin screen is a placeholder rendered by _buildStubScreen()/_PortalFeatureScreen in lib/core/routes/route_screens.dart. Your job is to replace specific stubs with real screens that match the web app's behavior EXACTLY: same Firestore collection + field names, same status values, and the same notification side-effects. Never read collections the security rules forbid (e.g. employers cannot read seekerProfiles directly). Parity references live in src/lib/firebase/firestoreService.ts, src/lib/types/index.ts, and firestore.rules. After each screen: handle loading/empty/error states and keep the existing AppTheme styling.
```

---

## P0 — Data parity (fast, do first)

```
TASK: Fix Firestore field/collection name mismatches between the Flutter app and the web app so mobile stops rendering blanks.
FILES: lib/core/routes/route_screens.dart (and any model in lib/shared/data/models that maps these).
FIX EXACTLY:
1. Jobs application count: replace 'applicationCount' with 'applicationsCount' (web increments applicationsCount). Occurrences include the employer 'jobs' collection config and employer dashboard recent-jobs meta.
2. Seeker profile readiness: replace 'profileCompletion' with 'profileStrength' everywhere (web field is profileStrength).
3. Resume data: read resumes from the 'resumes' array on seekerProfiles ({id,name,url,uploadDate,isDefault}); stop relying on flat 'resumeUrl'/'resumeTitle'.
4. Admin Settings: change the collection from 'settings' to 'platformSettings' (web + rules use platformSettings).
5. Admin/job status vocabulary: when approving a job use {'status':'active','isActive':true} and when rejecting {'status':'rejected','isActive':false} to match web (not 'approved'/'paused').
ACCEPTANCE: employer job cards show a real applicant count; seeker profile meta shows strength; admin settings list loads; resume list reads the array; approved jobs appear in the public jobs query (isActive==true).
```

```
TASK: Include candidate contact on mobile job applications.
FILE: lib/features/public/presentation/screens/job_detail_screen.dart (_applyToJob / ApplyToJobData) and lib/core/services/firestore_service.dart (applyToJob).
FIX: add seekerEmail and seekerPhone to the application document, sourced from the signed-in user and the seeker profile, matching web src/lib/firebase/firestoreService.ts applyToJob (which writes seekerEmail, seekerPhone, resumeName, appliedAt).
ACCEPTANCE: an application created on mobile contains seekerEmail and seekerPhone; the web employer candidate view shows contact info for mobile-submitted candidates.
```

---

## P1 — Unblock the seeker (critical)

```
TASK: Build a real Seeker Resume screen (replace the stub) so mobile users can upload/build resumes.
ROUTE: /seeker/resume and /seeker/resume/builder. Remove the stub for SeekerResumeScreen in route_screens.dart and create lib/features/seeker/presentation/screens/seeker_resume_screen.dart.
REQUIREMENTS:
- Upload a PDF via file_picker -> Firebase Storage at resumes/{uid}/{filename} (rules require owner + PDF + <5MB).
- Append an entry to seekerProfiles/{uid}.resumes[] = {id, name, url (download URL), uploadDate, isDefault}.
- List existing resumes; allow set-default and delete (also delete from Storage).
PARITY: web stores resumes as an array on seekerProfiles and the Apply sheet selects from it.
ACCEPTANCE: after uploading, the Apply bottom sheet on a job lists the resume and a mobile-only user can complete an application end to end.
```

```
TASK: Build a real Seeker Profile editor (replace the stub).
ROUTE: /seeker/profile. Create seeker_profile_screen.dart.
REQUIREMENTS: edit name, headline, district, summary, phone, email; add/remove education[] and experience[] rows; upload profile photo (image_picker -> Storage seekers/{uid}/...). Save to seekerProfiles/{uid}; recompute and store profileStrength.
PARITY: field names per src/lib/types/index.ts JobSeekerProfile (profileStrength, skills, experience, education).
ACCEPTANCE: edits persist and reflect on the web profile; profileStrength updates.
```

```
TASK: Build Seeker Skills editor and make Seeker Settings actually save.
ROUTES: /seeker/skills, /seeker/settings.
REQUIREMENTS: skills editor adds/removes seekerProfiles/{uid}.skills (chips + suggestions). Settings writes notification/privacy prefs to users/{uid} and toggles dark mode in the Hive 'settings' box (main.dart already reads it).
ACCEPTANCE: skills and settings changes persist across app restarts.
```

```
TASK: Add Job Alert creation (today only activate/pause exists).
ROUTE: /seeker/job-alerts.
REQUIREMENTS: a "Create alert" form (keyword, district, jobType, pushEnabled) -> writes jobAlerts/{auto} with userId==uid, status 'active'. Keep the existing activate/pause actions.
PARITY: jobAlerts rules require userId == request.auth.uid.
ACCEPTANCE: a new alert appears in the list and is owned by the user.
```

---

## P2 — Unblock the employer (critical)

```
TASK: Build the employer Post-Job wizard (replace the stub that only lists jobs).
ROUTE: /employer/post-job. Create employer_post_job_screen.dart mirroring src/app/employer/post-job/page.tsx.
REQUIREMENTS: multi-step form (Details -> Requirements -> Compensation -> Preview). On submit, create a jobs doc with: title, description, jobType, location, district, openings, experience, education, skills[], salaryMin/Max, benefits[], companyId, companyName, postedBy:uid, status:'pending', isActive:false, viewCount:0, applicationsCount:0, createdAt/updatedAt serverTimestamp. Require an existing company (needsCompany pattern already in code).
PARITY: keep the pending-approval gate; rules force new jobs isActive==false.
ACCEPTANCE: posting creates a pending job that an admin can approve and that then appears publicly.
```

```
TASK: Build the real Candidates pipeline screen + notify-on-status (replace toggle-only stub).
ROUTE: /employer/candidates. Create employer_candidates_screen.dart mirroring src/app/employer/candidates/page.tsx.
REQUIREMENTS:
- Tabs by status; cards show seekerName, jobTitle, and contact (email/phone) READ FROM THE APPLICATION DOC (do not query seekerProfiles/users — rules forbid employers).
- Actions: Shortlist/Select/Reject -> update applications/{id}.status AND createNotification to the seeker (matching web messages). Open resume (resumeUrl), Message candidate (startConversation), Save employer note.
PARITY: web sends createNotification on each status change and stores employerNote.
ACCEPTANCE: status changes notify the candidate; contact shows for applicants; no permission-denied errors.
```

```
TASK: Add Interview scheduling (today only Complete/Cancel toggles exist).
ROUTE: from a candidate in /employer/candidates and /employer/interviews.
REQUIREMENTS: a form (date, time, mode: phone/video/in_person, location/meetingLink) -> create interviews doc {companyId, companyName, seekerId, seekerName, jobId, jobTitle, date, time, mode, status:'scheduled'}; set the application status to 'interview_scheduled'; createNotification to the seeker.
PARITY: src/app/employer/candidates/page.tsx handleScheduleInterview.
ACCEPTANCE: scheduling creates the interview, updates the application, and notifies the seeker.
```

```
TASK: Build the employer Company Profile editor (replace stub).
ROUTE: /employer/company-profile.
REQUIREMENTS: edit company fields; upload logo/cover/gallery via image_picker -> Storage companies/{companyId}/... Save to companies/{companyId} (cannot change verificationStatus/isFeatured per rules).
ACCEPTANCE: edits persist; images upload; verification fields are not client-editable.
```

---

## P3 — Talent search (needs backend)

```
TASK: Implement Talent Search via a Cloud Function (employers cannot read seekerProfiles directly per rules).
BACKEND: add a callable Cloud Function (functions/) e.g. searchCandidates(filters) that runs with admin privileges, queries seekerProfiles, and returns a REDACTED list (no phone/email unless the employer is Premium AND the seeker opted in).
FLUTTER: /employer/talent-search -> call the function via cloud_functions (already a dependency) and render results; gate "unlock contact" behind Premium server-side, not client-side.
ACCEPTANCE: employers see candidates without a permission error; contact info is only returned when authorized server-side.
NOTE: this same function should back the web Talent Search (shared fix).
```

---

## P4 — Messaging

```
TASK: Build real messaging threads for seeker and employer (today only a conversation list exists).
ROUTES: /seeker/messages, /employer/messages.
REQUIREMENTS: conversation list -> open thread -> stream conversations/{id}/messages ordered by createdAt; send a message (write {senderId:uid, message, createdAt}) and update the parent conversation lastMessage/lastMessageAt. Start-conversation already exists in firestore_service.
PARITY: conversations + messages rules require the sender to be a participant.
ACCEPTANCE: two users can exchange messages in real time; unread counts update.
```

---

## P5 — Admin tools

```
TASK: Add Admin user-role management and a notification broadcast composer (replace read-only stubs).
ROUTES: /admin/users, /admin/notifications.
REQUIREMENTS:
- Users: verify user (users/{uid}.isVerified=true) and change role (users/{uid}.role) — admin-only per rules.
- Notifications: compose broadcast (title, message, audience) -> write broadcasts/{auto}; optionally fan out per-user notifications via a Cloud Function.
ACCEPTANCE: an admin can change a user's role and send a broadcast that recipients see.
```

```
TASK: Add charts to employer/admin Reports using fl_chart (already a dependency).
ROUTES: /employer/reports, /admin/reports.
REQUIREMENTS: render bar/line charts over the existing metric data (applications over time, jobs by status, leads by status). Use getCountFromServer aggregation instead of downloading docs to count.
ACCEPTANCE: reports show charts; count queries use aggregation (fewer reads).
```

---

## P6 — Integrations & store readiness

```
TASK: Wire push notifications.
FILES: lib/main.dart, lib/core/services/push_notification_service.dart.
REQUIREMENTS: on app start (and after login) request notification permission, get the FCM token, store it on users/{uid}.fcmTokens (arrayUnion), register foreground + background (top-level) handlers, and route notification taps to actionUrl via go_router. Configure Android (google-services.json) and iOS (APNs) — verify both exist.
ACCEPTANCE: a test message from Firebase console shows in foreground and background and deep-links correctly.
```

```
TASK: Wire analytics and add crash reporting.
FILES: lib/main.dart, lib/core/services/analytics_service.dart; add firebase_crashlytics.
REQUIREMENTS: initialize analytics; log screen_view + events (register, apply, post_job); pipe Flutter errors to Crashlytics.
ACCEPTANCE: events appear in Firebase Analytics DebugView; a forced error appears in Crashlytics.
```

```
TASK: Production hardening for store submission.
REQUIREMENTS:
- Set AuthRepositoryImpl.demoLoginEnabled = false for release builds (or guard by build flavor).
- Add deep-link config: Android App Links (assetlinks) + iOS Universal Links matching go_router paths.
- Add iOS Info.plist usage strings (NSCameraUsageDescription, NSPhotoLibraryUsageDescription) and Android permissions for image_picker/file_picker.
- Verify applicationId/bundleId, app icons, splash, versionName/Code.
ACCEPTANCE: release builds have demo login off, deep links resolve, and pickers prompt with proper permission strings.
```

```
TASK: Remove or wire dead dependencies.
REQUIREMENTS: dio and cloud_functions are unused (cloud_functions will be used by P3). Remove dio if no REST API is planned; keep cloud_functions only after P3 lands. Confirm image_picker/file_picker are used by P1/P2/P4 before keeping.
ACCEPTANCE: pubspec has no unused heavy deps; build size drops.
```

---

## Suggested order & rough effort

| Order | Prompt(s) | Effort |
|---|---|---|
| 1 | P0 data parity + apply contact | 1–2 days |
| 2 | P1 resume + profile + skills/settings + alerts | ~2 weeks |
| 3 | P2 post-job + candidates + interviews + company profile | ~2 weeks |
| 4 | P3 talent search (Cloud Function) | 3–5 days |
| 5 | P4 messaging | ~1 week |
| 6 | P5 admin tools + reports | ~1 week |
| 7 | P6 push/analytics/store readiness/deps | ~1 week |

> Tip: after each prompt, run the screen against the matching web page and diff the Firestore document it writes — field names and notifications must match exactly, or web and app will silently disagree.
