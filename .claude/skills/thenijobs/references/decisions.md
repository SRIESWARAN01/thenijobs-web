# Decisions to protect — owner-made, applied defaults, superseded assumptions, open questions

Read before writing any phase contract. Classification tags are binding. Where a document in the
repository contradicts a newer verified decision here, keep the newer decision and record the
supersession — never silently reopen a closed question. **Authority order:** `CLAUDE.md` → this
file → `docs/active/BRANCH_DISPOSITIONS.md` → memory. `CURRENT` facts were measured 2026-09-04 at
`main` = `5b61111`; re-measure before quoting.

## 1. Product identity — VERIFIED_REPOSITORY_FACT

THENIJOBS is a hyperlocal **job portal, business directory, service marketplace, B2B lead and
website-builder platform** for Theni district and Tamil Nadu (Theni, Cumbum, Periyakulam,
Bodinayakanur, Chinnamanur, Uthamapalayam, Andipatti; Madurai/Dindigul reach), bilingual English +
Tamil, **live in production with real users** at `www.thenijobs.com` / `www.thenijobs.in`.
Contact and address constants: `src/lib/constants.ts` `SITE_CONTACT`.

## 2. Repository, identity, remote — OWNER_DECISION + applied defaults (GOV-3, 2026-09-04)

- Root: `/Users/saai_siddharth/Projects/Clients/Theni Jobs` (**with a space**; the handoff skill's
  `Theni-Jobs` path never existed). Worktrees: `Projects/Clients/Theni-Jobs-develop`,
  `Projects/Clients/Theni-Jobs-<phase>`.
- Remote: `https://github.com/SRIESWARAN01/thenijobs-web.git`, **PUBLIC**, default branch `main`.
  Remote branches: `main`, `feature/production-transformation-v1` (preserved, ledger row). Push
  authorization is the owner's; `gh` here is another account.
- **D-ID (OPEN; applied default):** author and committer = the repository-local
  `SRIESWARAN01 <srieswaran01@users.noreply.github.com>` (140/143 commits). Trailers: the
  session harness appends `Co-Authored-By: Claude …`; the history already carries one such trailer
  (`Claude Sonnet 5`). GOV-3 commits carry the trailer. The owner may strip trailers before the
  first push (commits are local); say which policy applies going forward.
- **D-HOME (applied default):** the skill lives at `.claude/skills/thenijobs/`; the personal
  `~/.claude/skills/thenijobs` is a symlink to the develop-worktree copy; `thenijobs-cto-handoff`
  is a pointer stub with the original kept beside it as `SKILL.superseded-2026-09-04.md`.
- **D-BRANCH (applied default; owner pushes):** `develop` → `staging` → `main`, fast-forward only,
  owner's word per promotion; `develop` and `staging` created locally at `5b61111`; nothing pushed
  by the agent. The harness denies `git push` for the agent regardless.
- **D-LEDGER (applied default):** `docs/active/BRANCH_DISPOSITIONS.md` with the claim protocol
  and a `## Promotions` table; no `PROMPTS.md`, no execution ledger.

## 3. Hosting — D-DEPLOY (VERIFIED for "which host"; INFERRED for "which push deploys")

- **Production is Vercel**, serving the **static export** (`next.config.ts`: `output: 'export'`
  under `NODE_ENV=production`; `vercel.json`: `framework nextjs`, `buildCommand next build`).
  Evidence: `server: Vercel`, `x-vercel-id: bom1::…`, `www` CNAME → `vercel-dns`, `/pricing`
  carries a string that exists only from `5b61111`.
- **Firebase Hosting** (`firebase.json`, project `thenijobs-9f01d`) holds a stale CLI deploy
  (2026-08-30) on `thenijobs-9f01d.web.app`; its rewrites, CSP and security headers apply **only
  there**. No custom domain points to it.
- **A push to `main` is a production deploy** if the Vercel Git integration is linked to `main`
  (INFERRED from timing). The owner confirms in the dashboard and states whether `staging` should
  map to a preview domain. Until confirmed, treat every push to `main` as a deploy.
- **The seven `src/app/api/**` route handlers do not exist in production** (404 `text/html`).
  `D-HOSTING (OPEN):` (a) drop `output: 'export'` on Vercel so route handlers run as functions
  (and give them a real server identity — Admin SDK / service account, never the web API key), or
  (b) move the AI gateway, payment verification and OTP into Cloud Functions / another server and
  keep the static export, or (c) retire the server features. **No phase may assume any of these.**

## 4. Surface area — VERIFIED_REPOSITORY_FACT (`5b61111`)

```
Public       /, /jobs, /jobs/[id], /businesses, /businesses/[category], /services, /marketplace, /pricing, /about, /contact,
             /daily-jobs, /privacy, /terms, /cookies, 9 × /jobs-in-<town> (+ [category] under theni & cumbum),
             /company/[slug], /companies/[slug], /[companySlug], /portfolio/[username], /portfolio/seeker/[id], sitemap.xml, robots.txt
Auth         /login (email · Google · phone OTP via /api/otp), /register, /register-business, /company/register, /forgot-password, /admin/login
Seeker       /seeker/{dashboard,profile,applications,saved-jobs,job-alerts,interviews,messages,notifications,resume,resume/builder,
             ai-coach,skills,id-card,subscription,settings,website,become-employer}
Employer     /employer/{dashboard,post-job,jobs,jobs/[id],candidates,talent-search,interviews,leads,messages,reviews,reports,
             company-profile,billing,subscription,id-card,settings,website,website/editor,website/settings,website/templates}
Admin        /admin/{dashboard,users,users/create,businesses,businesses/import,jobs,seo,leads,services,subscriptions,ads,reviews,
             reports,errors,notifications,ai-settings,ai-analytics,security,settings}
API (dev-only) /api/ai · /api/ai/test · /api/otp/{send,call,verify} · /api/payment/{create-order,verify}
```

## 5. Plans and pricing — VERIFIED_REPOSITORY_FACT; product decisions OPEN

- Sold tiers (`SUBSCRIPTION_PLANS`, `src/lib/constants.ts`): Free ₹0 · Standard ₹480/yr ·
  Premium ₹1,200/yr ("MOST POPULAR") · Enterprise ₹5,000/yr.
- `PLAN_FEATURE_MATRIX` and `SubscriptionPlanSlug` carry a 5th **legacy `basic`** tier ("kept for
  legacy Firestore records"); `PlanTier` (portfolio) has 4; `AI_PLAN_ALLOWANCES` uses uppercase
  keys including `BASIC`; `payment/verify/route.ts` `PLAN_PRICES` has `basic: 999` and prices that
  contradict `constants.ts`. **`D-PLANS (OPEN):`** which tier list is canonical, what happens to
  `basic` records, which price table is right. Flag, never silently fix.
- AI credits: 15 features, costs 1–3 (`AI_CREDIT_COSTS`); packs ₹10/25/50/100 (`AI_CREDIT_PACKS`);
  `RESUME_BUILDER_PRICE_INR = 15`. No code sets a user's `aiCredits`; no pack purchase flow calls
  the payment routes. **`D-CREDITS (OPEN):`** how credits are granted.

## 6. Security readiness — source-verified (`security.md` §9)

`MODERATION_GUARD`, `AI_GATEWAY_AND_CREDITS`, `PAYMENT_VERIFICATION`, `OTP_INTEGRITY`,
`STORAGE_OWNERSHIP`, `PLAN_GATING_SERVER_SIDE`, `SECRETS_IN_CLIENT` = **NO_GO** at `5b61111`.
The catch-all rules (S-1) and the static-export hosting truth (S-4) are the two facts every other
finding depends on. Flipping any gate is a phase with Playground/emulator evidence, never a doc edit.

## 7. Open owner decisions (do not resolve silently)

| ID | Question | Safe default while open |
|---|---|---|
| D-ID | trailers on commits | applied default in §2; local commits can be rewritten before the first push |
| D-DEPLOY | is the Vercel Git integration linked to `main`? should `staging` map to a preview domain? | treat every `main` push as a production deploy; `staging` push = preview |
| D-HOSTING | how do server features run in production (§3)? | no phase relies on `src/app/api/**` in production |
| D-RULES | approve the rules phase: remove both catch-alls, collapse duplicates, guard `subscriptionPlan`/`aiCredits`, fix `register-business` L128 in the same change, deploy with `firebase deploy --only firestore:rules,storage` (owner-run) | plan it as the first phase; nothing deployed by the agent |
| D-SECRETS | rotate the key at `otp/call/route.ts:42` and any non-Firebase key ever committed; restrict the Firebase web key in GCP | assume compromised; never print |
| D-PLANS | canonical tier list, `basic` records, price table | no plan logic changes |
| D-CREDITS | how AI credits are granted and metered without a server | no AI metering claims |
| D-OTP | keep 2Factor + anonymous session, or move to Firebase phone auth (`AuthContext.sendPhoneOTP` exists) | no phone-verification claims |
| D-TESTS | may the gate add a minimal harness (rules tests on the emulator with a pinned JDK; a smoke test for `/api/ai` credit deduction under `next dev`) as its own bounded phase? | propose only; none built in GOV-3 |
| D-DNS | fix the `thenijobs.in` apex (two A records, TLS failure) | none |
| D-DOCS | retire or rewrite `full.mf`, `admin-portal.md`, `walkthrough.md`, `README.md` | never edit them inside a feature phase |
| D-CI | add a read-only CI workflow (`ci.md` §2) once the owner's token can push workflows | none |
| D-PROTECT | enable branch protection (linear history) on `staging`/`main` | this skill is the only guard |

## 8. Superseded assumptions — must not return

- `full.mf`'s **dark theme** (`#0a0a1a`, glassmorphism, violet→cyan) — SUPERSEDED; the app is
  light (`#F8FAFC`, `--vk-*`). The handoff skill's "deep-teal/saffron per `8920a4c`" —
  SUPERSEDED by the current `globals.css` (blue `#2563EB` / emerald `#10B981` / amber `#F59E0B`).
- `admin-portal.md`'s **localStorage admin account** — SUPERSEDED; admin is Firebase Auth +
  `users/{uid}.role`.
- `full.mf`'s **monthly** pricing (₹40/₹100/₹190) and 16-collection schema — SUPERSEDED (annual
  prices; 30+ collections in the rules).
- `full.mf`'s "**Hosting: Firebase Hosting**" — SUPERSEDED; production is Vercel.
- The handoff skill's "**14 AI features**" — CORRECTED to 15 (`AIFeatureKey`).
- The handoff skill's "moderation guards are **load-bearing**" and "AI gateway is **ID-token
  verified**, payments **signature-checked**, OTP **rate-limited**" — CONTRADICTED at runtime:
  the catch-all bypasses the guards; the token check is optional; the routes are absent in
  production. Cite `security.md` §9, not the handoff text.
- The handoff skill's repository path `Projects/Clients/Theni-Jobs` — CORRECTED (space).
- "`walkthrough.md` says pushed to `origin/main` at `c235124`" — evidence about that day only.
- "**The two deploy targets are unresolved**" — RESOLVED 2026-09-04 (§3).
