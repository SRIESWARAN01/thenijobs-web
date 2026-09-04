# `feedback` lane — user-facing messages, bilingual copy, and the surfaces that already exist

**Fires when** a change renders anything a user reads: a toast, modal, empty state, error state,
loading state, form error, status badge, notification, or a navigation label. THENIJOBS has no
canonical "feedback system" document; this lane is the measured inventory (2026-09-04 at
`5b61111`) plus the rules that keep it from fragmenting further. **Measure before claiming**: paths
below are re-verified with `git grep` before every lane report.

## 1. Never build a new one — the surfaces that exist

```
Toasts        src/contexts/ToastContext.tsx   useToast() → toast.success|error|info|warning(title, message?)   (imported in 44 files)
              ToastProvider is mounted once in src/app/layout.tsx; never mount a second one; never alert()
              (13 `alert(`/`confirm(` call sites remain in src/ at 5b61111 — existing debt; a phase that touches one replaces it)
Notifications src/contexts/NotificationContext.tsx (unreadCount; Firestore `notifications` collection; createNotification() in firestoreService.ts)
Empty / load  src/components/ui/EmptyState.tsx · LoadingSkeleton.tsx (both exist with ZERO importers — pages hand-roll them) · ErrorBoundary.tsx (mounted in layout.tsx)
Modals        src/components/ui/Modal.tsx (zero importers) · JobApplySuccessModal.tsx (1) · InterviewConfirmedModal.tsx (1) · DeviceLivePreviewModal.tsx (2)
Status        src/components/ui/StatusBadge.tsx (zero importers) · VerifiedBadge.tsx (4) · APPLICATION_STATUS_CONFIG / LEAD_STATUS_CONFIG (src/lib/constants.ts)
Gating copy   src/components/ui/FeatureGate.tsx (zero importers; plan-locked UI is hand-rolled per page; a hint, not enforcement — security.md I5)
Payment       src/components/payment/PaymentCheckoutModal.tsx (ready | processing | success | failed states + receipt)
Auth errors   src/contexts/AuthContext.tsx handleError() sets `error` from err.message (raw Firebase messages reach the UI — see §3)
Global errors src/lib/firebase/errorTracker.ts (GlobalErrorTracker → `errors` collection) · src/app/admin/errors (dashboard)
```

Success → `toast.success`. Failed submit → `toast.error` **plus** inline state where the form
lives. Nothing to show → `EmptyState`. Read failed → `ErrorBoundary` or an inline error with a
retry. Destructive → a confirm step in `Modal` before the write, then a toast. Payment → the
modal's own four states, never a bare toast. Plan-locked → `FeatureGate` with the plan name from
`getRequiredPlanForFeature()`, never a hand-written "upgrade" string.

## 2. Bilingual copy (English + Tamil) — the rules that already bind

- Navigation and section labels carry a `tamilLabel` sibling (`ADMIN_NAV_ITEMS`,
  `EMPLOYER_NAV_ITEMS`, `SEEKER_NAV_ITEMS`, `PORTFOLIO_SECTION_DEFS` in `src/lib/constants.ts`).
  A new item in any of these arrays **must** carry both, or the lane is `BLOCKING`.
- Tamil script exists in 10 source files today; the app's `lang` is `en-IN` (`layout.tsx`). There
  is no i18n framework; strings are inline. Do not introduce one inside a feature phase.
- **Every new Tamil string is flagged in the report for human review** with path:line. Never
  machine-translate silently; never transliterate English into Tamil script as a substitute.
- Classify before localising: a rendered label is localised; an enum wire value, route, Firestore
  field value (`status: 'pending'`, `role: 'employer'`), or `switch` discriminator is **not**.
- Currency is `₹` with Indian grouping (`toLocaleString('en-IN')`); phone numbers show as
  `+91 XXXXX XXXXX`; districts use the spellings already in `SITE_CONTACT` and the `jobs-in-*` routes.

## 3. Error copy

- User-visible error text must be an app string, not a provider message. Today `AuthContext.tsx`
  `handleError()` surfaces `err.message` (raw `auth/...` codes reach the login UI) and the API
  routes return fixed strings — keep the fixed strings, and map Firebase codes to app copy when a
  phase touches the auth screens. Never render a stack, a Firestore path, or a provider error body.
- API-route fallbacks ("AI is temporarily unavailable. Please try again.", "OTP sent … (Test/
  Sandbox …)") are **test-mode tells**: a phase must not ship a message that reveals sandbox
  behaviour to production users, and must not treat their appearance as success.
- In production the seven route handlers return **404 HTML**; `res.json()` throws and the UI shows
  the catch-branch copy. Any change to those screens states what the user sees today.

## 4. Feedback choreography rules

- One toast per outcome; never a toast during a navigation you are about to trigger (it is torn
  down with the page) — set the message on the destination or use a query flag.
- Loading states use `LoadingSkeleton` or the page's existing spinner pattern (`Loader2` from
  `lucide-react` in the three portal layouts); never block the whole viewport for a partial fetch.
- Empty states name the action that fills them and use the same verb as the primary button.
- Mobile: toasts and modals respect the 44 px tap targets and the `safe-area-inset` padding
  already in `globals.css`; bottom navigation (`src/components/navigation`) must not cover a toast.

## 5. Lane report

```
FEEDBACK LANE — <phase>
Verdict: PASS | PASS_WITH_FINDINGS | BLOCKING
Surfaces touched: path · surface kind · existing component used
Copy: new user-facing strings (count) · new Tamil strings flagged for review (path:line) · provider messages rendered raw (path:line)
Test-mode tells shipped to production copy: none | path:line
Findings: severity · path:line · rule (§1–§4) · fix
```
`BLOCKING` = a new toast/modal/empty-state component when one exists, `alert()`, a raw
`err.message` rendered to a user on a screen the phase touched, a nav/section item without
`tamilLabel`, a sandbox/test-mode string reachable in production.
