# THENIJOBS — Mobile Redesign (Flutter) — Build & Integration Guide

A premium, **mobile-first native** redesign delivered as a self-contained module under
`lib/redesign/`. It does **not** mimic the website: Material 3, clean light surfaces,
skeleton loaders, pull-to-refresh, bottom navigation, gated guest mode, and an
enterprise look in the spirit of LinkedIn / Indeed / Naukri.

Everything plugs into your **existing backend** (the same `FirestoreService`, auth
providers, `Job`/`Company`/`User` models and GoRouter paths) — no schema changes.

---

## 1. What was built

| Area | File | Notes |
|---|---|---|
| Design system (Material 3) | `lib/redesign/theme/app_theme_m3.dart` | `AppX` tokens: colours, spacing, radii, shadows, typography (Plus Jakarta Sans + Inter), full `ThemeData`. |
| Data providers | `lib/redesign/data/job_providers.dart` | Featured / latest / trending / recommended, search (`JobQuery`), job detail, similar jobs, company, saved-ids. Maps `FirestoreService` → typed `Job`. |
| Gated actions | `lib/redesign/data/job_actions.dart` | `toggleSaveJob()` with login gate. |
| UI kit | `lib/redesign/widgets/ui_kit.dart` | `JobCard`, `FeaturedJobCard`, shimmer skeletons, `CompanyLogo` (cached), section headers, empty/error states, salary/relative-time formatters. |
| Guest mode + auth | `lib/redesign/auth/login_sheet.dart` | `ensureLoggedIn()` → premium bottom sheet (Google / Email / Phone OTP); resumes the original action after sign-in. |
| Home | `lib/redesign/home/home_shell.dart` | `HomeTab` (search bar, categories, featured/recommended/trending/latest, pull-to-refresh). Also includes an optional standalone `HomeShell` with its own bottom nav. |
| Search | `lib/redesign/search/jobs_search_screen.dart` | Debounced instant search, **voice search**, filter sheet (category, district, type, experience, salary), active-filter chips. |
| Job detail | `lib/redesign/job_detail/job_detail_screen.dart` | Banner, logo, snapshot grid, skills, description, responsibilities, benefits, map card (opens Google Maps), similar jobs, **sticky Apply Now**. |
| Apply flow | `lib/redesign/job_detail/apply_sheet.dart` | Resume pick/upload + cover letter → `applyToJob()`. |
| Seeker profile | `lib/redesign/profile/seeker_profile_screen.dart` | Strength ring, resume upload, skills/education/experience/certifications editors, saved & applied jobs. |
| Employer | `lib/redesign/employer/employer_screens.dart` | Dashboard (stats), post/edit job, manage jobs (pause/activate/delete), applications (resume download + status updates). |
| Secure storage (Phase 10) | `lib/redesign/core/secure_storage_service.dart` | Keystore/Keychain-backed wrapper for session/token data. |

---

## 2. Architecture & design system

- **State**: Riverpod (`FutureProvider.family`, `StateNotifier` already in repo). All list
  providers are `autoDispose` to free memory when screens close.
- **Navigation**: GoRouter (existing). The redesign screens are plain widgets/Scaffolds —
  they slot into the existing `MainShell` `ShellRoute` as tab children, or as pushed routes.
- **Networking/data**: reuses `FirestoreService` + cloud functions (`applyToJob`,
  `updateApplicationStatus`, etc.). Dio client remains available for REST endpoints.
- **Theme**: one `AppX.theme()` — light, premium, Material 3. Royal-blue primary `#2563EB`,
  teal accent, soft neutral surfaces, rounded cards, pill chips, floating snackbars.
- **Loading**: `shimmer` skeletons everywhere instead of spinners; `RefreshIndicator`
  pull-to-refresh on every list; `cached_network_image` for logos/banners.

> Phase 11 stack note: the project already uses **Riverpod + GoRouter + Dio**. `freezed` /
> `build_runner` are **not** currently in `pubspec.yaml`; the models are hand-written
> `fromFirestore`/`toFirestore`. The redesign deliberately matches the existing hand-written
> model style so no codegen step is required. Adding freezed later is optional and isolated.

---

## 3. Integration (wiring) — apply these edits

> Heads-up: `app_router.dart` and `main.dart` were being edited concurrently while this
> module was written, so they are **not** auto-wired here to avoid clobbering that work.
> Apply the small edits below in one commit. The redesign screens are designed to live
> inside your existing `MainShell` (full-Scaffold tab children), so no second bottom nav
> is introduced.

### 3.1 `pubspec.yaml` (already added)

```yaml
cached_network_image: ^3.3.1
shimmer: ^3.0.0
flutter_secure_storage: ^9.2.2
# speech_to_text is already present in your pubspec
```

Then:

```bash
flutter pub get
```

### 3.2 `lib/core/routes/app_router.dart`

Add imports:

```dart
import 'package:thenijobs/redesign/home/home_shell.dart';            // HomeTab
import 'package:thenijobs/redesign/search/jobs_search_screen.dart';   // JobsSearchScreen
import 'package:thenijobs/redesign/job_detail/job_detail_screen.dart';// JobDetailScreenM3
import 'package:thenijobs/redesign/profile/seeker_profile_screen.dart';// SeekerProfileScreenM3, SavedJobsScreen, AppliedJobsScreen
import 'package:thenijobs/redesign/employer/employer_screens.dart';   // EmployerDashboardM3
```

Point these builders at the redesign screens:

```dart
// Inside the MainShell ShellRoute:
GoRoute(path: '/',  builder: (c, s) => HomeTab(onOpenSearch: () => c.go('/jobs'))),
GoRoute(path: '/jobs', builder: (c, s) => JobsSearchScreen(
  initialSearch:   s.uri.queryParameters['search'],
  initialCategory: s.uri.queryParameters['category'],
  initialLocation: s.uri.queryParameters['location'] ?? s.uri.queryParameters['area'],
  embedded: true,
)),
GoRoute(path: '/seeker/saved-jobs', builder: (c, s) => const SavedJobsScreen(embedded: true)),
GoRoute(path: '/seeker/profile',    builder: (c, s) => const SeekerProfileScreenM3(embedded: true)),

// Non-shell routes:
GoRoute(path: '/jobs/:id', builder: (c, s) => JobDetailScreenM3(jobId: s.pathParameters['id'] ?? '')),
GoRoute(path: '/seeker/applications', builder: (c, s) => const AppliedJobsScreen()),
GoRoute(path: '/employer/dashboard',  builder: (c, s) => const EmployerDashboardM3()),
```

> Post-job / manage-jobs / applications screens are reached **inside** the employer
> dashboard via `Navigator.push`, so no extra routes are required for them.

### 3.3 `lib/main.dart` (optional but recommended for the full premium look)

```dart
import 'package:thenijobs/redesign/theme/app_theme_m3.dart';
// ...
return MaterialApp.router(
  title: 'TheNiJobs',
  theme: AppX.theme(),
  themeMode: ThemeMode.light,   // the redesign is a light, premium theme
  routerConfig: router,
  debugShowCheckedModeBanner: false,
  builder: ...,                 // keep your existing builder
);
```

---

## 4. Guest mode & authentication flow (Phase 4)

- **No login wall on open.** Home, Search and Job Detail are fully browsable as a guest —
  title, company, location, salary, type and experience are all visible without an account.
- **Login is requested only for**: Apply, Save, Post job, and Profile/Saved tabs.
- `ensureLoggedIn(context, ref)` opens the bottom sheet with **Continue with Google /
  Email / Phone**; on success it returns `true` and the caller resumes the original action,
  so the user lands **back on the job they were viewing** (Apply re-opens automatically).
- Phone uses OTP (`sendOtp` → `verifyOtp`); Email uses `signIn`; Google uses `signInWithGoogle`.

---

## 5. Performance (Phase 9)

- `autoDispose` providers release Firestore listeners/data when screens close.
- All lists are lazy (`ListView.builder`); horizontal carousels are bounded-height lazy lists.
- `cached_network_image` caches logos/banners (memory + disk) → no re-downloads on scroll.
- Search is **debounced 350 ms** and capped at 80 docs server-side, then refined client-side.
- Skeleton loaders give instant perceived performance instead of blank/spinner screens.
- Detail/search/home queries use `limitCount` to keep payloads small.

Targets & how to verify: cold start < 2 s (profile with `flutter run --profile` + DevTools
timeline); list scrolling at 60/120 fps (DevTools "Performance overlay"). Enable Firestore
offline persistence for sub-second warm reads (see §8 note).

---

## 6. Security (Phase 10)

- **Login gating** enforced in-app for all write/PII actions; portal routes already guarded
  by the GoRouter `redirect` (guests on `/seeker|/employer|/admin` → `/login`).
- **Secure storage** (`SecureStorageService`) uses Android EncryptedSharedPreferences /
  iOS Keychain for session/token/FCM values — never plain `SharedPreferences`.
- **Token refresh** is handled by Firebase Auth automatically (ID tokens refresh ~hourly);
  callable cloud functions verify `request.auth` server-side.
- **Authorization** lives in Firestore Security Rules + cloud functions (`approveJob`,
  `updateApplicationStatus`, etc.) — the client never trusts its own role for privileged writes.
- **Input handling**: forms trim input, numbers parsed defensively, resume uploads limited
  to pdf/doc/docx and 5 MB (`StorageService.maxBytes`).

Recommended hardening (server side, outside this module): enable **Firebase App Check**,
add rate-limiting to callable functions, and review the candidate-detail rules noted in the
earlier audit.

---

## 7. QA / testing checklist (Phase 13)

Functional
- [ ] Guest can browse Home, Search, open a Job Detail (no login prompt).
- [ ] Tapping Apply / Save as guest opens the login sheet; after login the action resumes.
- [ ] Google, Email, and Phone-OTP sign-in each complete and dismiss the sheet.
- [ ] Apply submits (resume + optional cover letter) and shows the success dialog.
- [ ] Saved job appears in Saved tab; un-saving removes it.
- [ ] Applied job appears in Applied list with correct status colour.
- [ ] Employer: post job → appears in My Jobs and on Home/Search; edit persists; pause hides it.
- [ ] Employer: applicant list shows candidates; resume opens; status update succeeds.

UI / edge
- [ ] Skeletons show on first load; pull-to-refresh works on every list.
- [ ] Long titles/companies ellipsize; empty states render for no-results.
- [ ] Offline → error state with Retry; airplane mode doesn't crash.
- [ ] Voice search: permission prompt, dictation fills the field, graceful fallback if unavailable.

Automated
- [ ] `flutter analyze` clean.
- [ ] Widget tests for `JobCard`, `formatSalary`, `JobQuery.copyWith`.
- [ ] `flutter test`.

---

## 8. Build & release

```bash
# 0. From thenijobs-flutter/
flutter pub get
flutter analyze            # fix any analyzer issues first
flutter test               # if tests are present

# 1. Run on a device/emulator
flutter run

# 2. Debug APK (quick share)
flutter build apk --debug

# 3. Release APK (split per ABI → smaller installs)
flutter build apk --release --split-per-abi
#   → build/app/outputs/flutter-apk/app-armeabi-v7a-release.apk
#   → build/app/outputs/flutter-apk/app-arm64-v8a-release.apk

# 4. Release App Bundle (Play Store)
flutter build appbundle --release
#   → build/app/outputs/bundle/release/app-release.aab
```

### Signing (required for Play Store)
1. Create a keystore:
   ```bash
   keytool -genkey -v -keystore upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
   ```
2. `android/key.properties`:
   ```
   storePassword=*****
   keyPassword=*****
   keyAlias=upload
   storeFile=../upload-keystore.jks
   ```
3. Wire it in `android/app/build.gradle(.kts)` `signingConfigs.release` and use it in
   `buildTypes.release`. Then re-run the `appbundle`/`apk` commands above.

> Firestore offline cache (optional, recommended): call
> `FirebaseFirestore.instance.settings = const Settings(persistenceEnabled: true);`
> early in `main()` for faster warm reads.

---

## 9. Verification status & notes

- **Not compiled here.** The Linux sandbox was offline (disk space) during this session, so
  the module was written but not run through `flutter analyze`/`build`. Run §8 step 0–1
  before shipping. The code targets your existing APIs and was reviewed for symbol/import
  correctness; treat `flutter analyze` as the source of truth.
- **Concurrent edits.** `app_router.dart` / `main.dart` / `pubspec.yaml` were being modified
  by another process during this session — that's why router/main wiring is provided as
  copy-paste (§3) instead of force-applied. Reconcile in one commit.
- **`speech_to_text` v7**: voice search uses `initialize()` + `listen(onResult:)`; all calls
  are wrapped in try/catch and degrade gracefully if the device/permission is unavailable.
- **Employer job approval**: posted jobs are written with `isActive: true, status: 'active'`.
  If your Firestore rules/admin flow require approval before a job goes live, change those two
  fields in `PostJobScreenM3._submit` to match (e.g. `isActive:false, status:'pending'`).
- Everything is additive under `lib/redesign/` — safe to adopt screen-by-screen, and easy to
  revert with `git`.
```
