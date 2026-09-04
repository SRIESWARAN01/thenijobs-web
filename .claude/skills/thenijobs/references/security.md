# `security` lane — trust, moderation integrity, AI credits, payments, OTP, storage, secrets

**Mandate.** Every change that touches the surface list in §2 gets this lane before VERIFY. The
lane produces findings with severity, evidence and a fix; it never "signs off" from a passing
build. A verified P0 outranks every feature phase — say so and stop feature work.

**Never reproduce a secret value.** Cite the path and the key name, say what is exposed, require
rotation. Server-side env names this tree reads: `GROQ_API_KEY`, `GROQ_MODEL`, `GEMINI_API_KEY`,
`GOOGLE_GENERATIVE_AI_API_KEY`, `GEMINI_MODEL`, `OPENAI_API_KEY`, `TWOFACTOR_API_KEY`,
`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `GOOGLE_INDEXING_SERVICE_ACCOUNT_KEY`; browser-visible:
`NEXT_PUBLIC_FIREBASE_*` (8), `NEXT_PUBLIC_RAZORPAY_KEY_ID`. Real values live only in the
primary checkout's untracked `.env.local` (Firebase web config only) and in provider dashboards.

**Never write to the `thenijobs-9f01d` project.** Every probe below is read-only or runs in an
emulator / the Rules Playground. **Facts below were measured 2026-09-04 at `5b61111`. Re-measure.**

## 1. Trust boundaries and identity universes

| Universe | Credential | Verified by | Authority for data access |
|---|---|---|---|
| Seeker / employer / business owner | Firebase Auth session (email+password, Google popup, Firebase phone auth with reCAPTCHA in `AuthContext.tsx`; **or** 2Factor OTP → `signInAnonymously` in `src/app/login/page.tsx:257`) | Firebase Auth | `firestore.rules` / `storage.rules` — the **only** server-side control that runs in production; role = `users/{uid}.role` |
| Admin | same Firebase Auth session + `users/{uid}.role in ['admin','super_admin']` | client check in `src/app/admin/login/page.tsx:32` and `useRequireAuth(['admin','super_admin'])` (`src/app/admin/layout.tsx:39`); rules `isAdmin()` (`firestore.rules` L16–21, `storage.rules` L38–43) | the rules' `isAdmin()` `get()` on the user doc |
| Company owner | `companies/{id}.ownerId == uid` | rules `isCompanyOwner()` (`firestore.rules` L23–26; `storage.rules` L33–36 via `firestore.get()`) | rules |
| `/api/ai` caller | body `userId` (+ optional `Authorization: Bearer <idToken>`) | `src/app/api/ai/route.ts` L69–100: token checked **only if sent**; verifier error → continue; `src/lib/ai/aiClient.ts` never sends one | none in production (route absent) |
| `/api/payment/verify` caller | body `orderId`,`paymentId`,`signature` | HMAC-SHA256 at `verify/route.ts` L73–107 **only if** `RAZORPAY_KEY_SECRET` and `signature` are both present | none in production (route absent) |
| `/api/otp/*` caller | phone / sessionId+otp | 2Factor.in when `TWOFACTOR_API_KEY` is set; test mode otherwise (`send` L42–52, `verify` L47–71) | none in production (route absent) |
| Build-time server | `NEXT_PUBLIC_FIREBASE_API_KEY` over Firestore REST | `src/lib/firebase/firestoreServer.ts` (reads for `generateStaticParams`/metadata/sitemap) | unauthenticated REST reads — succeed today only because of the catch-all read rule |
| Public web | none | — | catch-all `allow read: if true` (`firestore.rules` L396, `storage.rules` L116) |

## 2. Surface list — what triggers this lane (`scripts/surface.sh` encodes it)

```
firestore.rules  storage.rules  database.rules.json  firebase.json  vercel.json  next.config.ts  package.json  package-lock.json  .gitignore
src/app/api/**   src/lib/ai/**   src/lib/firebase/**   src/contexts/AuthContext.tsx   src/hooks/useAuth.ts   src/lib/plans.ts   src/lib/constants.ts
src/app/login/**  src/app/register/**  src/app/register-business/**  src/app/company/register/**  src/app/forgot-password/**  src/app/admin/**
src/components/payment/**   src/components/auth/**   src/lib/seo/indexingApi.ts   src/lib/identityService.ts   scripts/**   .github/**
```

## 3. The request path per surface (order is a security property)

- **Browser → Firestore/Storage (client SDK).** Every portal write (`firestoreService.ts`,
  `useFirestore.ts`, page-level `setDoc/addDoc/updateDoc`) goes straight to the rules. There is
  no `middleware.ts`, no server component that gates a route, no Cloud Function. `useRequireAuth`
  only redirects; a direct SDK call from the console bypasses it.
- **Browser → `/api/ai`.** `aiClient.ts` POST `{feature,userId,userRole,payload}` → rate limit
  (in-memory Map, 15/min, per process) → `checkUserCredits` (client SDK **unauthenticated** in the
  server process → succeeds only via the catch-all read) → provider (`getActiveProvider` reads
  `platformSettings/aiConfig`, falls back to `GROQ_API_KEY` env) → `deductUserCredits`
  (`updateDoc users/{uid}` unauthenticated → succeeds only via the catch-all write; would be
  denied under a correct rule set) → `logAIUsage` → response. **Production: 404 HTML.**
- **Browser → `/api/ai/test`.** No auth at all; tests any provider key the caller supplies, or the
  server's env key. Server-side request forgery to three fixed providers; key-validity oracle.
- **Browser → `/api/payment/create-order` → Razorpay → `/api/payment/verify`.** With no
  Razorpay env the order is fake (`isRazorpay:false`) and `PaymentCheckoutModal.tsx` L171–177 calls
  verify with `signature: 'direct_authorized'`; verify skips the HMAC when the secret or the
  signature is absent, validates `amount` against **its own** `PLAN_PRICES` (999/2999/7999/14999,
  which contradict `constants.ts` 480/1200/5000 — a real Standard payment of ₹480 would be
  rejected), then writes `payments`, `subscriptions`, `companies/{id}`, `users/{id}`,
  `notifications` over Firestore REST with the web API key only (unauthenticated; response codes
  unchecked). Under the current rules those writes need `isAuthenticated()` → they fail silently
  while the route still answers `success: true`. **Production: 404 HTML** → `res.json()` throws →
  `paymentState = 'failed'`.
- **Browser → `/api/otp/send|call|verify`.** After a verified (or test-mode) OTP the client calls
  `signInAnonymously`, then creates/merges `users/{uid}` with `phone` and `isVerified: true`
  (`login/page.tsx` L262–289). Firebase never saw the phone; `isVerified` is self-asserted and the
  `users` create rule does not constrain it. **Production: 404 HTML.**
- **Admin.** `/admin/login` signs in with email+password, reads its own user doc, and pushes to
  the dashboard only for `admin|super_admin`; every admin write is a client-SDK write authorized
  by `isAdmin()` in the rules. `/admin/ai-settings` writes provider `apiKey` **plaintext** into
  `platformSettings/aiConfig` (page L105 → `updateProviderConfig` → `saveAIConfig`).
- **Static export.** `next.config.ts` sets `output: 'export'` under `NODE_ENV=production`
  (Vercel and `next build` both set it). Next's own docs (`node_modules/next/dist/docs/01-app/
  02-guides/static-exports.md` L235, L282): only `GET` route handlers, none that read `Request`.
  All seven routes are `POST` and read the body → not exported → 404 on Vercel and on Firebase
  Hosting (`firebase.json` has no function rewrite).

## 4. Invariant catalogue — what enforces it, what proves it, how to probe it

| # | Invariant | Enforced by (path) | Proven by | Status 2026-09-04 | Probe (read-only / Playground / emulator) |
|---|---|---|---|---|---|
| I1 | A client can never set `verificationStatus`/`isActive`/`isFeatured`/`isVerified`/`isPremium`/`status` on companies, jobs, services, or its own `role` | `firestore.rules` L37–73 + L85–111, L221–229; `users` L76–82 | nothing today | **BROKEN** — catch-all L394–398 grants `write` to any authenticated user on every document, including `users/{uid}.role` (admin self-promotion) | Playground: auth uid A updates `companies/{B-owned}` `{isFeatured:true}` → must DENY; auth uid A updates `users/A` `{role:'admin'}` → must DENY |
| I2 | AI credits are deducted server-side only, after `checkUserCredits` | `src/app/api/ai/route.ts` L113–124, L325–338; `creditService.ts` | nothing | **BROKEN** — `aiCredits`/`aiCreditsUsed` are not in `userModerationUnchanged()`, so the owner may set them; the route is absent in production; `checkUserCredits` returns `allowed:true, balance 100` on any read error | Playground: auth A updates `users/A` `{aiCredits: 999999}` → must DENY |
| I3 | Payment success only by server-side Razorpay signature | `verify/route.ts` L73–107 | nothing | **BROKEN** — HMAC conditional on the client sending `signature`; fake-order fallback in the modal; price table contradiction; REST writes unauthenticated; route absent in production | under `next dev` with `RAZORPAY_KEY_SECRET` set: POST verify with `signature` omitted → must be 403; today activates |
| I4 | Storage writes require ownership (`isOwner`/`isCompanyOwner`) and type/size limits | `storage.rules` L46–98 | nothing | **BROKEN** — `/portfolio/{uid}/**` and `/uploads/{uid}/**` accept any authenticated writer (L103, L110); catch-all L114–118 makes every object world-readable, including `/resumes/**` and `/verification/**` | Playground (Storage): auth B writes `portfolio/A/x.png` → must DENY; unauthenticated read `resumes/A/cv.pdf` → must DENY |
| I5 | Plan gating is enforced where the write happens | nothing — `src/lib/plans.ts` helpers are called from `.tsx` only; `subscriptionPlan` is not in `companyModerationUnchanged()` | nothing | **BROKEN** — an owner may set `companies/{own}.subscriptionPlan = 'enterprise'`; job-posting limits are UI-only | Playground: owner updates own company `{subscriptionPlan:'enterprise'}` → must DENY (or a server path must own it) |
| I6 | No provider key in client source or in a world-readable document | `groqClient.ts` (server-only comment), env names | nothing | **BROKEN** — `src/app/api/otp/call/route.ts:42` carries a literal fallback key; `platformSettings` is world-readable (L383 overrides L248) and the admin UI stores plaintext `apiKey` there; the repo is PUBLIC and history holds key literals (§9 S-6) | `git grep -nE 'AIza[0-9A-Za-z_-]{35}|gsk_|sk-[A-Za-z0-9]{20,}|rzp_live_' -- src` → only the Firebase web key fallback in `adminUserService.ts:22` is tolerable; Playground: unauthenticated get `platformSettings/aiConfig` → must DENY |
| I7 | Every `AIFeatureKey` has an `AI_CREDIT_COSTS` entry | `Record<AIFeatureKey, number>` type in `src/lib/ai/config.ts` | `npx tsc --noEmit` | HOLDS (15/15) | delete one entry → tsc must fail (non-vacuity) |
| I8 | `/api/ai` rate limit 15 req/min preserved | `route.ts` L22–40 | nothing | HOLDS in code; meaningless in production (route absent) and per-process under `next dev` | 16 POSTs in 60 s under `next dev` → the 16th is 429 |
| I9 | Admin capability comes from `users/{uid}.role` set by an admin only | `userModerationUnchanged()` L69–73; `updateUserRole()` admin path | nothing | **BROKEN** by I1's catch-all | as I1 |
| I10 | A phone login proves phone ownership | nothing — 2Factor session ≠ Firebase identity; `signInAnonymously` | nothing | **BROKEN** by design; and the OTP routes are absent in production, so phone login fails closed today | `next dev`: call `signInAnonymously` from the console, `setDoc users/{uid} {isVerified:true, phone:'+91…'}` → must DENY |
| I11 | Private collections/objects are not world-readable (`users`, `seekerProfiles`, `applications`, `conversations`, `subscriptions`, `payments`, `errors`, `aiUsageLogs`, `/resumes`, `/verification`) | specific rule blocks | nothing | **BROKEN** by the two catch-all reads; `payments`, `errors`, `aiUsageLogs` have no block at all | Playground: unauthenticated get `counters/theniJobsId_company` → must DENY (a non-PII proxy for the catch-all) |
| I12 | The repository states truthfully how `src/app/api/**` runs in production | `next.config.ts`; this skill | `curl -sS -o /dev/null -w '%{http_code}' -X POST https://www.thenijobs.com/api/ai` = 404 | HOLDS (documented) | re-run the curl before any claim about server-side behaviour |
| I13 | Secrets never in the tree or the history of a public repo | nothing (no gitleaks, no hook, no CI) | — | **BROKEN** (§9 S-6) | `git log --all -p -S'AIzaSy' --format='%h' -- src | grep -E '^\+\+\+'` lists paths only; never print values |
| I14 | A job reaches "published" only through `validateJobForPublishing()` | nothing — the function has **zero callers** at `5b61111` | — | NOT ENFORCED | `git grep -n validateJobForPublishing -- src` must show a caller on the publish path |
| I15 | No client-side write sets a moderated field to a privileged value | `register-business/page.tsx:128` writes `isActive: true` on create | — | **CONTRADICTED** — succeeds only via the catch-all; would be denied by `safeCompanyCreate()` once the catch-all is removed (fix both together) | `git grep -nE "isActive: *true|verificationStatus: *'verified'|isFeatured: *true" -- 'src/app/**' 'src/components/**' | grep -v admin` |

## 5. Gate battery (what `scripts/gate.sh` runs, and what each proves)

| Command | Proves | Does NOT prove |
|---|---|---|
| `npx tsc --noEmit` | types compile; I7 | anything at runtime |
| `npm run lint` | eslint 9 flat config (next core-web-vitals + typescript; 5 rules off) | security |
| `npm run build` | the static export compiles; `generateStaticParams` ran (with or without real Firebase config — say which) | rules, credits, payments, OTP |
| `npm test` (only if `package.json` gains a `test` script — D-TESTS) | whatever the phase's tests assert | anything not asserted |
| `firebase emulators:exec --only firestore,storage '<test cmd>'` (optional; needs an accepted JDK — 17 installed, requirement CLAIMED_NOT_VERIFIED) | rule behaviour against the emulator | production data state |
| §7 probe G on `out/_next/static` | no non-Firebase key in the bundle | keys in Firestore documents |

**Non-vacuity rule:** before crediting any "0 offenders" grep, plant one offender and watch it
match. Before crediting an emulator suite, confirm it printed a test count.

## 6. Review procedure by change type

- **Rules** (`firestore.rules`, `storage.rules`, `database.rules.json`): read the whole file —
  rules are additive (OR), a later permissive block wins; duplicates (`portfolioSites` L289/L375,
  `platformSettings` L248/L383) must be collapsed, never "fixed" by adding a third; every collection
  the client writes has a block (`payments`, `errors`, `aiUsageLogs` have none); moderation fields
  stay in `*ModerationUnchanged()`; add `subscriptionPlan`, `aiCredits`, `aiCreditsUsed`,
  `companyId`, `isEmployer`, `canPostJobs` to the guarded lists or justify each; the catch-all is
  removed with the client fixes it was masking (I15); Playground evidence before and after; the
  deploy command (`firebase deploy --only firestore:rules,storage --project thenijobs-9f01d`) is
  printed for the owner, never run.
- **API routes**: state how the route is served in production (today: not); never trust body
  fields for identity; token verification mandatory, not optional; fail closed on verifier error;
  no in-memory rate limit presented as protection; every Firestore write from a route uses an
  authenticated identity (Admin SDK / service account via a server) — never the web API key.
- **AI provider config**: keys via env names or a server-only secret store; never a plaintext
  `apiKey` field in a client-readable document; `AI_CREDIT_COSTS` entry per feature; prompts in
  `src/lib/ai/prompts/`; `/api/ai/test` must require admin identity.
- **Payment / OTP**: signature mandatory; prices from `SUBSCRIPTION_PLANS` (or stop on `D-PLANS`);
  idempotency by `orderId`; no test-mode branch reachable in production; a phone login ends in a
  Firebase phone credential (`AuthContext.sendPhoneOTP` path), not an anonymous session.
- **Templates / sections / portfolio**: `portfolioSites` create must bind `ownerId == uid`; a
  published site is public by design — no PII in section data; storage paths under the owner's uid.
- **Plans**: the matrix is a product decision (`D-PLANS`); a phase may add enforcement for the
  existing matrix, never change tiers or prices.
- **SEO**: `validateJobForPublishing()` on the publish path (I14); `indexingApi.ts` never from a
  client component.
- **Dependencies / config**: `package-lock.json` diff reviewed; `next.config.ts` `output` change
  is `D-HOSTING`; `firebase.json` headers/CSP apply only to the `.web.app` copy today.

## 7. Adversarial probes (read-only against production; writes only in the emulator or Playground)

```bash
# A. Hosting truth — the seven routes must be reported as absent while the export is static
for r in ai ai/test otp/send otp/call otp/verify payment/create-order payment/verify; do printf '%-24s ' "$r"; curl -sS -o /dev/null -w '%{http_code} %{content_type}\n' --max-time 15 -X POST -H 'content-type: application/json' -d '{}' "https://www.thenijobs.com/api/$r"; done
# B. Catch-all read (non-PII proxy) — Rules Playground: unauthenticated GET counters/theniJobsId_company → expect DENY after the fix (memory 2026-09-03: platformSettings/aiConfig returned 404 NOT_FOUND, i.e. read permitted, document absent)
# C. Forged moderation write — Playground: auth uid A, update companies/<B-owned> {isFeatured:true}; update users/A {role:'admin'} → both DENY
# D. Client-reported "paid" — next dev with RAZORPAY_KEY_SECRET set: curl -X POST localhost:3000/api/payment/verify -d '{"orderId":"x","userId":"u","planSlug":"standard","amount":480,"status":"success"}' → expect 403, never success
# E. Direct provider call from the browser — git grep -nE "api\.groq\.com|generativelanguage\.googleapis\.com|api\.openai\.com|new Groq\(|GoogleGenerativeAI\(" -- 'src/**' | grep -v 'src/lib/ai/providers\|groqClient\|src/app/api' → must be empty
# F. Storage cross-owner write — Playground (Storage): auth B, write portfolio/A/x.png (image, 1 MB) → DENY; unauthenticated read resumes/A/cv.pdf → DENY
# G. Secrets in the bundle (after npm run build in a worktree)
grep -rlE 'gsk_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|rzp_live_[A-Za-z0-9]+|BEGIN (RSA |EC )?PRIVATE KEY|"private_key"' out/_next/static 2>/dev/null || echo clean   # Firebase web keys (AIza…) are expected there
# H. Secret literals in source (paths only, never values)
git grep -lE 'AIza[0-9A-Za-z_-]{35}|gsk_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|rzp_live_' -- src scripts
# I. Mandatory token check — git grep -n "if (authHeader)" -- src/app/api/ai/route.ts must be empty after the AI phase (the check must be unconditional)
# J. Dead SEO validator — git grep -n validateJobForPublishing -- src | grep -v seoValidator.ts must be non-empty after the SEO phase
```

## 8. Threat checklist (map each finding to one)

- **Spoofing**: anonymous session presented as a verified phone user (I10) · body `userId` as
  identity in `/api/ai` (I2) · admin self-promotion via `users/{uid}.role` (I1/I9).
- **Tampering**: moderation fields, `subscriptionPlan`, `aiCredits` written by the client (I1, I2,
  I5) · `counters/*` writable by any authenticated user (ID sequence tampering) · `seoAnalytics`
  writable by any authenticated user · `conversations`/`messages` create by any authenticated user
  without a participant check.
- **Repudiation**: `activityLogs` create by any authenticated user; `payments` records written by
  an unauthenticated REST call (or not at all).
- **Information disclosure**: catch-all reads (I11) — `users` (emails, phones, roles),
  `seekerProfiles`, `applications`, `payments`, `platformSettings` (provider keys if ever saved),
  `/resumes`, `/verification` (GST/identity documents) · public repo history (I13) · `/api/ai/test`
  as a key oracle.
- **Denial of service**: `leads` create unauthenticated with no rate limit · in-memory rate limits
  · provider bill exposure through `/api/ai` with a forged `userId` (when the route runs).
- **Elevation**: role self-write · `approveCompany()` grants `role: 'employer'` — admin-only by
  rule, but the rule is bypassable (I1).

## 9. Open findings register (verified 2026-09-04 at `5b61111`; each needs an owner)

| ID | Finding | Evidence | Severity |
|---|---|---|---|
| S-1 | **Catch-all rules nullify every specific rule**: `firestore.rules` L394–398 `read: true / write: isAuthenticated()`; `storage.rules` L114–118 `read: true / write: isAuthenticated() && <10MB` | rule text; memory 2026-09-03 REST probe (read permitted); Playground not run today (probe denied by the harness) | **P0** — world-readable PII and documents; admin self-promotion; moderation bypass |
| S-2 | Duplicate blocks: `platformSettings` L248 (admin read) vs L383 (public read); `portfolioSites` L289 (owner-bound create) vs L375 (any-auth create) — permissive wins | rule text | P0 (keys) / P1 |
| S-3 | `subscriptionPlan` (companies) and `aiCredits`/`aiCreditsUsed`, `companyId`, `isEmployer`, `canPostJobs` (users) are outside the `*ModerationUnchanged()` lists | `firestore.rules` L56–73; writers `payment/verify/route.ts` L181/L200, `creditService.ts:72`, `firestoreService.ts` L620–625 | P0 (free upgrade; unlimited AI on the owner's bill once the route runs) |
| S-4 | **Production serves the static export on Vercel; all seven API routes are 404** — AI gateway, payment verification and OTP never execute for real users; checkout fails closed | `curl` 404 `text/html` for POST on each route (2026-09-04); `next.config.ts`; Next docs L235/L282 | **P0 functional** (paid checkout is non-functional end to end) — needs `D-HOSTING` |
| S-5 | `/api/payment/verify`: HMAC optional; fallback `'direct_authorized'` signature path in the modal; `PLAN_PRICES` contradict `constants.ts`; Firestore REST writes unauthenticated and unchecked | `verify/route.ts` L13–20, L73–107, L147–230; `PaymentCheckoutModal.tsx` L171–177 | P0 once the route runs |
| S-6 | Secret-shaped literals: `src/app/api/otp/call/route.ts:42` (fallback key literal, live in the tree); history commits `2cbc780`, `45d9404`, `45ca048`, `acfd2e0`, `3fc1ef7` added `AIza…` literals to `config.ts`, `firestoreServer.ts`, `payment/verify/route.ts`, `otp/call/route.ts`, `adminUserService.ts`; the repository is **PUBLIC** | `git log --all -p -S'AIzaSy' … | grep '^+++'` (paths only) | P0 for any non-Firebase key (rotate); P2 for Firebase web keys (restrict by referrer/API in GCP) |
| S-7 | `/api/ai`: ID-token check only when the client sends a header (it never does); verifier error → continue; `checkUserCredits` fails open (`allowed:true, balance 100`) on read error | `route.ts` L69–100, `creditService.ts` L53–57 | P0 once the route runs |
| S-8 | OTP login ends in `signInAnonymously` + self-asserted `isVerified:true`; test-mode OTP accepts `123456`/`999999` when the key is unset; `verify` accepts any `test_session_*`/`voice_session_*` id | `login/page.tsx` L257–289; `otp/verify/route.ts` L47–71 | P1 (P0 if phone verification gates anything of value) |
| S-9 | `/api/ai/test` has no authentication; proxies a caller-supplied key to three providers | `src/app/api/ai/test/route.ts` | P1 once the route runs |
| S-10 | Admin AI settings store plaintext provider `apiKey` in `platformSettings/aiConfig`, which S-2 makes world-readable | `src/app/admin/ai-settings/page.tsx:105`, `aiConfigService.ts` L44–53 | P0 if any key was ever saved (owner checks the document in the console) |
| S-11 | Storage: any authenticated user may write under another user's `/portfolio/{uid}/**` and `/uploads/{uid}/**` | `storage.rules` L103, L110 | P1 |
| S-12 | `counters/*` read/write by any authenticated user; `seoAnalytics` write by any authenticated user; `conversations` + `messages` create without participant check; `activityLogs` create by anyone authenticated; `leads` create unauthenticated with no limit | `firestore.rules` L314–316, L389–392, L326, L343, L242, L188 | P2 |
| S-13 | `register-business/page.tsx:128` creates a company with `isActive: true` — works only through S-1; the S-1 fix breaks this flow unless fixed together | source | coupling hazard (fix-phase blocker) |
| S-14 | `validateJobForPublishing()` has no callers; Google Jobs completeness is unenforced | `git grep` | P3 (SEO) |
| S-15 | `thenijobs.in` apex has two A records (`2.57.91.91`, `216.198.79.1`) and fails the TLS handshake; `www.thenijobs.in` works on Vercel | `dig`, `curl` 2026-09-04 | P2 (owner: DNS) |
| S-16 | No hooks, no CI, no secret scanning, no branch protection visible; `gh` on this machine is a different account | measured | process — this skill is the only guard |
| S-17 | Production has a deployment newer than the last git push (`/pricing` CDN fill 2026-09-04 10:24 UTC vs `pushedAt` 2026-09-03 19:53 UTC) — trigger unknown from this machine (dashboard redeploy, CLI, or a hook) | `curl -sSI` | UNKNOWN_LIVE_STATE — owner confirms in the Vercel dashboard |

## 10. Reporting

```
SECURITY LANE — <phase>
Verdict: PASS | PASS_WITH_FINDINGS | BLOCKING
Findings (most severe first): ID · severity (P0/P1/P2/P3) · invariant (I#) · threat class · path:line · evidence (command + output) · fix · check that will catch a regression
Probes run: command · result · what it proves (and which were NOT run, and why)
Gates run: from gate.sh table (exit codes; first failure by name; ambient reds attributed)
Hosting truth stated: how each touched route is served in production
Not verified: explicit list
Owner decisions: from decisions.md §7 touched by this change
```

`BLOCKING` = any P0 the phase touches without closing, any new P1 without a mitigation in the
same phase, any invariant I1–I15 weakened, any secret value found in the diff, any new write path
that relies on the catch-all, any claim that a `src/app/api/**` route protects production.
