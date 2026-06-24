# THENIJOBS — UI / Buttons / Mobile Audit (top-level `src/` app)

**Date:** 2026-06-09
**Scope of THIS report:** the **top-level** Next.js app only — `E:\thenijobs-main\src` (Next 16, React 19, Firebase, Tailwind 4). Seeker, Employer, Admin portals + public pages, focused on *incomplete functions, dead/non-working buttons, and mobile-friendliness*.

> ⚠️ **Read this first — there are 3 apps in this repo.** `E:\thenijobs-main` contains the top-level Next app (this report), a **nested** `thenijobs-main/` Next app, and a `thenijobs-flutter/` Flutter app. A separate, broader `AUDIT_REPORT.md` already exists in this folder and concludes the **nested** app is the canonical/production one and the **top-level** app is stale. **If that's still true, the issues below are in the app you may not be shipping.** Confirm which app is "live" before acting on these.

---

## Executive summary (top-level `src/` app)

The top-level app's UI is well built: real Firebase auth (email/Google/phone-OTP), a full Firestore service layer, real-time hooks, working CRUD, and proper mobile drawers in all three portals. Most buttons have real handlers; most pages read live data. What remains is a finishing pass — a cluster of invalid-CSS-class typos, a few decorative dead controls, one hardcoded stat, two intentional "coming soon" features, and minor mobile polish. **No architectural blockers in the UI layer. ~85% complete.**

### Severity legend
🔴 High — broken/misleading · 🟡 Medium — visible rough edge / dead control · 🟢 Low — cosmetic/intentional

---

## A. Incomplete & pending features

| # | Feature | Status | Location | Sev |
|---|---------|--------|----------|-----|
| A1 | **AI Coach** (mock interviews, resume scanner) | Intentional waitlist — email capture + "Beta Coming soon" badge, no engine | `src/app/seeker/ai-coach/page.tsx` | 🟢 |
| A2 | Seeker subscription lists "AI Coach mock interviews (Coming Soon)" as a perk | Tied to A1 | `src/app/seeker/subscription/page.tsx:15` | 🟢 |
| A3 | Homepage **Trending Jobs** falls back to `MOCK_JOBS` when Firestore is empty | Real visitors can see fake jobs on an empty DB | `src/components/home/TrendingJobs.tsx:32,176` | 🟡 |
| A4 | Homepage **Featured Businesses** falls back to `MOCK_BUSINESSES` | Same pattern as A3 | `src/components/home/FeaturedBusinesses.tsx:20,116` | 🟡 |

---

## B. Dead / non-functional buttons & inputs

These look interactive but do nothing.

| # | Control | Location | Sev |
|---|---------|----------|-----|
| B1 | **Header search bar** (no `value`/`onChange`) — appears on every authenticated page in all 3 portals | seeker `layout.tsx:217` · employer `layout.tsx:227` · admin `layout.tsx:219` | 🟡 |
| B2 | **Public header Search icon** — no `onClick` | `src/components/navigation/Header.tsx:66` | 🟡 |
| B3 | **Public header Notifications (Bell) icon** — no `onClick` | `src/components/navigation/Header.tsx:73` | 🟡 |
| B4 | **Top-right avatar** in seeker header — `cursor-pointer`, no menu | `src/app/seeker/layout.tsx:300` | 🟢 |

**Fix:** wire header search → `/jobs?q=…` (cheap), and either implement or remove B2/B3. A broken search box hurts trust more than no search box.

---

## C. Real bugs

| # | Issue | Detail | Location | Sev |
|---|-------|--------|----------|-----|
| C1 | **Invalid Tailwind color shades** | `text-gray-505`, `text-gray-450`, `text-rose-450`, `text-emerald-450` etc. don't exist → class dropped → text inherits wrong/low-contrast color. **24 occurrences in 8 files.** | resume (5), profile (9), dashboard (2), ai-coach (2), job-alerts (2), notifications (1), resume/builder (2), jobs/[id] (1) | 🔴 (cheap, app-wide) |
| C2 | **Unguarded `job.jobType.replace('_',' ')`** | Throws if a job lacks `jobType`, can blank the dashboard card | `src/app/seeker/dashboard/page.tsx:196` | 🟡 |

**Fix C1 first** — a single find/replace (`-505`→`-500`, `-450`→`-400`) corrects all 24 and restores intended colors/contrast. Highest value, lowest risk.

---

## D. Hardcoded / placeholder data

| # | Item | Detail | Location | Sev |
|---|------|--------|----------|-----|
| D1 | **Profile Strength = 65%** hardcoded in seeker sidebar | The profile page computes the real value; the sidebar ignores it | `src/app/seeker/layout.tsx:120,123` | 🟡 |
| D2 | "🟢 Open to Work" sidebar status is static, not from `isOpenToWork` | — | `src/app/seeker/layout.tsx:194` | 🟢 |

---

## E. Mobile-friendliness

**Foundation is solid:** body `overflow-x:hidden`; all 3 portals use off-canvas drawer + overlay + hamburger below `lg`; public `BottomNav` is `md:hidden` with `safe-area-inset-bottom`; public pages add `pb-28 md:pb-12` to clear it; `FloatingWhatsApp` raised to `bottom-20` on mobile; `DataTable` uses `overflow-x-auto` + sticky first column; stat grids collapse (`grid-cols-2 lg:grid-cols-4`).

**To address:**

| # | Item | Sev |
|---|------|-----|
| E1 | Portal header search hidden on mobile (`hidden sm:block`) with no replacement — no search affordance on phones | 🟢 |
| E2 | Heavy admin/employer tables rely on horizontal scroll; consider stacked card view under `sm` | 🟢 |
| E3 | Some tap targets below ~44px (table action icons `p-1.5`, dense candidate rows) | 🟢 |
| E4 | Confirm the resume **builder** (2-col editor + live preview) stacks to 1 column on phones | 🟡 (to confirm) |

---

## F. Recommended fix order (quick wins first)

1. **C1** — fix 24 invalid color classes (one pass). *Highest value / lowest risk.*
2. **B1** — wire portal header search → `/jobs?q=` (or remove). On every logged-in page.
3. **D1** — bind sidebar Profile Strength to the real computed value.
4. **B2/B3** — public header Search & Bell: implement or remove.
5. **C2** — guard `jobType` and similar optional fields.
6. **A3/A4** — decide mock fallback vs honest empty-state on the homepage.
7. **E1–E4** — mobile polish.

**Left as-is by design:** A1/A2 (AI Coach waitlist).

---

## Method & confidence
Reviewed in full: Firestore service, real-time hooks, auth context, global CSS, shared `DataTable`, `BottomNav`, public `Header`/`FloatingWhatsApp`, all 3 portal layouts, home page, seeker dashboard. Pattern-scanned all ~90 files of `src/` for dead handlers, mock data, "coming soon" markers, invalid classes, and mobile padding. Counts are exact matches. Items marked **(to confirm)** were inferred from structure. The app was not run, so runtime-only issues (Firestore index errors, console warnings) are out of scope — see the existing `AUDIT_REPORT.md` for those and for the backend/security/architecture view across all three apps.
