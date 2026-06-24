# THENIJOBS Pending Works Update

**Prepared for:** Siddhu  
**Date:** 10 June 2026  
**Scope:** Updated source-level status of the Flutter/mobile pending work from the Web vs Flutter gap analysis, after the latest implementation pass.

---

## Executive Update

The original headline still holds in the broad product sense: the Flutter app is not yet a full port of the web app. Most logged-in seeker, employer, and admin routes still go through the generic `_buildStubScreen` / `_PortalFeatureScreen` engine in `thenijobs-flutter/lib/core/routes/route_screens.dart`.

However, several critical blockers from the original report have now moved out of "broken" status:

- Mobile-only seekers are no longer blocked from applying just because they do not already have a web-built resume.
- The apply flow now supports direct PDF resume upload from the job apply sheet.
- Mobile application data can carry seeker email and phone fields.
- Portal list views now handle the main web/mobile field-name mismatches.
- Admin Settings now reads `platformSettings` instead of the wrong `settings` collection.
- Application/interview/job/company status actions now route through Cloud Functions where available, preserving backend validation and notification side effects.
- Push and analytics are now initialized at app startup.
- Demo login is disabled unless explicitly enabled by the build flag `THENIJOBS_ENABLE_DEMO_LOGIN`.
- Employer post-job is now started as a real mobile workflow: `/employer/post-job` resolves the employer company and submits job postings through the existing `createJobPosting` Cloud Function.

Net status: the critical stabilization pass is partially complete, but the larger feature-parity backlog remains.

---

## Completed / Updated Now

| Area | Previous status | Updated status | Evidence |
|---|---|---|---|
| Resume dead-end in Apply flow | Broken | Fixed for minimum viable apply | `job_detail_screen.dart` now shows `Upload PDF Resume`; upload writes through `addSeekerResume`. |
| Mobile resume write path | Missing | Added minimal PDF upload path | `firestore_service.dart` has `addSeekerResume(...)`, writing `resumes[]`, `resumeUrl`, and `resumeTitle`. |
| Mobile application contact fields | Missing / backend mismatch | Fixed / supported | `ApplyToJobData` now includes `seekerEmail` and `seekerPhone`; `applyToJob` passes them. |
| D1 application count display | Mismatch | Mitigated in mobile UI | `route_screens.dart` field fallback supports `applicationsCount` and `applicationCount`. |
| D2 profile readiness display | Mismatch | Mitigated in mobile UI | `route_screens.dart` uses `profileStrength` and falls back to `profileCompletion`. |
| D3 resume field display | Mismatch | Mitigated | `route_screens.dart` falls back from `resumeTitle` / `resumeUrl` to the `resumes[]` array. |
| D4 Admin Settings collection | Broken | Fixed | Admin Settings now points at `platformSettings`. |
| D5 mobile apply seeker contact | Missing | Fixed / supported | `seekerEmail` and `seekerPhone` are now in client data; Cloud Function also enriches from profile/user. |
| D6 job approval vocabulary | Inconsistent | Partially fixed | Mobile admin approval now writes `status: active` with `isActive: true`. |
| Status-change notifications | Missing from generic toggles | Improved | Application/interview/job/company actions call Cloud Functions where available. |
| Push init | Not wired | Basic wiring added | `main.dart` calls `PushNotificationService().initialize()`; background handler exists. |
| Analytics init | Not wired | Basic wiring added | `main.dart` logs `app_open` through `AnalyticsService`. |
| Demo login | Needs prod disable | Disabled by default | `demoLoginEnabled` now depends only on `THENIJOBS_ENABLE_DEMO_LOGIN`. |

---

## Still Pending

### Critical / Product-Blocking

| Item | Current status | What remains |
|---|---|---|
| Full resume builder / resume management screen | Still pending | The apply sheet can upload a PDF, but `/seeker/resume` is still a generic portal screen rather than a complete resume manager/builder. |
| Employer post-job wizard | MVP implemented / needs QA | `/employer/post-job` now shows a real form and submits via `PlatformActionsService.createJobPosting`; device QA and Flutter analyzer pass remain. |
| Messaging threads | Still pending | Seeker/employer message routes still show conversation lists/scaffold only; no chat thread or send UI. |
| Profile/skills/settings editors | Still pending | Seeker and employer profile/settings routes remain read-only portal surfaces. |
| Interview scheduler | Still pending | Employers can update status, but cannot create/schedule interviews from a real form. |
| Admin broadcast composer | Still pending | Backend broadcast support exists, but mobile admin UI has no composer workflow. |
| Admin user role tools | Still pending | Backend `updateUserRole` exists, but mobile admin users screen is still read-only. |

### High Priority

| Item | Current status | What remains |
|---|---|---|
| Talent search mobile UI | Still pending | Backend search support exists, but mobile route still relies on generic seeker profile listing. |
| Candidate notes and pipeline detail | Still pending | Status actions work better now, but no notes/detail panel/schedule actions. |
| Company profile editor + gallery upload | Still pending | Company profile route remains read-only. |
| Job alert creation | Still pending | Service helper exists, but mobile route only shows/toggles existing alerts. |
| Store-ready push notifications | Partial | Startup/permission/token request exists, but token persistence, local notification display, tap routing, and device QA remain. |
| Analytics coverage | Partial | `app_open` exists, but screen/event coverage is not complete. |

### Medium Priority

| Item | Current status | What remains |
|---|---|---|
| Reports/charts | Pending | `fl_chart` is still not used for real reports. |
| Pagination/search in portal lists | Pending | Generic lists still cap at 20 and do not provide search/filter UI. |
| Aggregated count reads | Pending | Metric tiles still stream document lists instead of using aggregation count APIs. |
| Offline Firestore cache UX | Pending | Hive initializes, but portal data is not meaningfully cached for offline workflows. |
| Crashlytics | Pending | No crash reporting integration confirmed. |
| Deep links / app links | Pending | go_router paths exist, but Android App Links / iOS Universal Links still need native config and QA. |

---

## Revised Priority Matrix

| Priority | Items |
|---|---|
| Critical | Messaging threads; real profile/resume/settings editors; interview scheduler; admin broadcast and user-role tools. |
| High | Runtime QA for the new post-job workflow; talent search UI backed by Cloud Function; candidate pipeline detail; company profile editor; job-alert creation; complete push token persistence and notification tap handling. |
| Medium | Reports/charts; aggregation counts; pagination/search; offline data strategy; analytics event coverage; Crashlytics; deep-link QA. |
| Low | Remove or justify unused dependencies; polish `/id` and public profile bonus screens; final copy/UI refinements. |

---

## Updated Effort Estimate

The latest patch reduces the stabilization work, but not the full portal parity effort.

| Workstream | Updated status | Remaining estimate |
|---|---|---|
| Fix D1-D6 field mismatches | Mostly done / needs runtime verification | 0.5-1 day |
| Unblock mobile apply | Minimum viable fix done | 0.5-1 day QA |
| Push + analytics startup wiring | Basic wiring done | 2-3 days for token persistence, local notifications, tap routing, and analytics coverage |
| Resume manager/builder | Still pending | 4-6 days |
| Post-job wizard | MVP implemented / QA pending | 1-2 days for analyzer fixes, device testing, copy polish, and edge cases |
| Profile/skills/settings editors | Still pending | 4-6 days |
| Interview scheduler | Still pending | 2-3 days |
| Messaging threads | Still pending | 5-8 days |
| Job-alert creation + admin broadcast/role tools | Still pending | 3-5 days |
| Talent-search mobile UI | Backend exists / UI pending | 2-4 days |
| Store readiness | Partial | 3-5 days |

**Revised total to feature parity:** approximately **5-8 developer-weeks**, assuming the existing backend Cloud Functions remain usable and no major Firestore-rules redesign is required.

---

## Recommended Next Implementation Order

1. Run Flutter tooling locally: `dart format`, `flutter analyze`, and device smoke tests for apply/upload.
2. QA mobile apply with a new seeker who has no resume, including Storage rules and Firestore rules.
3. Persist FCM tokens to user/device records and add notification tap routing.
4. QA the new employer post-job workflow on device/emulator and confirm the callable writes pending jobs correctly.
5. Build seeker profile/resume/settings editors, converting the current read-only portal pages into real workflows.
6. Build messaging threads for seeker and employer.
7. Add interview scheduling from the candidate pipeline.
8. Add admin broadcast composer and user-role management.
9. Add talent search UI backed by the existing Cloud Function.
10. Complete store-readiness QA: deep links, permissions, Crashlytics, release signing, Android/iOS device tests.

---

## Verification Notes

Source checks were performed against the current workspace. Dart/Flutter tooling is not available on PATH in this environment, so this update is source-level only. Runtime verification on Android/iOS and Firebase rules simulation are still required before marking these fixes production-ready.
