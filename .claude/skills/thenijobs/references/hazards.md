# Hazards and standing rules — read before gates, greps, merges, installs

Every item here was measured in this repository on 2026-09-04 at `5b61111` unless dated otherwise.
Measured facts carry the commit. **Not a substitute for measuring again.**

## Checkouts, worktrees, paths

- **The primary checkout is the owner's desk**: `/Users/saai_siddharth/Projects/Clients/Theni Jobs`
  — note the **space**. Quote every path. It holds the only `.env.local`, its own `node_modules`
  (833 MB), a `.next/dev` cache, and an untracked `Documents/` folder (4 `.xlsx`, a Python script,
  a `requirements.txt`) that belongs to the owner. Never build, merge, commit, run gates, or run
  `next build` there (it would write `out/` and `.next/` under the owner's running dev server).
- Worktrees live beside the checkout as `Theni-Jobs-develop` and `Theni-Jobs-<phase>` (no
  spaces). `git worktree add` fails if the branch is checked out elsewhere — never send its output
  to `/dev/null`; use `git -C "<dir>"` for every command, never `cd`.
- A fresh worktree has **no `node_modules` and no `.env.local`**. `npm ci --no-audit --no-fund`
  takes a few minutes (414 packages, ~850 MB, lockfile v3); npm 11 prints an `allow-scripts`
  warning for `unrs-resolver`'s postinstall — it is blocked by default and the build still passes
  (measure again if lint or build behave differently).
- Without `.env.local`: `next dev` throws `auth/invalid-api-key` ~2 s after first paint (deferred
  `requestIdleCallback` listener in `AuthContext.tsx`); **`next build` fails** at "Collecting page
  data for /api/ai" with `FirebaseError: auth/invalid-api-key` thrown at module evaluation
  (`src/lib/firebase/config.ts` calls `initializeApp` with empty strings; `/api/ai/route.ts`
  imports it; measured 2026-09-04 at `9b8ba5d`, 53 s in). **A fresh checkout cannot build**, and any
  CI must inject the eight `NEXT_PUBLIC_FIREBASE_*` keys by name (`ci.md` §2). The green build
  needs `THENIJOBS_ENV_FILE=<path>` (sourced into the build process only). **Every report states
  whether real Firebase config was used.** Never commit `.env.local` (`git check-ignore .env.local`
  must print it).
- `out/`, `.next/`, `tsconfig.tsbuildinfo`, `.firebase/` are gitignored; never force-add them.
- Worktree lifecycle has four steps; step 4 (`git worktree remove` + `prune`) is part of the merge.
  Never `rm -rf` a worktree; never delete merged branch refs; archive untracked content before
  removal; `df -h` before/after (`du` lies under APFS).

## Git, identity, hooks

- **No hooks, no CI, no prettier, no commit-msg check.** The skill is the only guard: typed
  commits (`type(scope): subject`), pathspec commits for the ledger, `git show --stat HEAD` after
  every commit, identity check after the first commit in a worktree.
- The repository-local `user.name`/`user.email` are set; the global config is **unset** — a
  worktree inherits the local values (shared `.git`), but a fresh clone would not. Check before the
  first commit anywhere else.
- `git add` aborts the whole command on a pathspec that matches nothing → always check the
  commit, not the tree. `$?` after a pipe is the last command's.
- **A conflict-free merge is not proof; ancestry is not content.** Verify the result tree
  (`merge.md` §2.1). Before committing any merge, re-read the target ref and compare it with the
  worktree HEAD; after committing, `git diff --name-status <first-parent> <merge>` must list only the
  phase's files.
- The remote is **public**. Anything committed is visible immediately once pushed; the history
  already carries key literals (`security.md` S-6). Never add another.
- `gh` on this machine is logged in as a different GitHub account: reads of the public repo work;
  pushes are the owner's; branch-protection queries 404.

## Measuring and greps

- In zsh, quote `'--include=*.ts'` — an unquoted glob prints `no matches found` and the grep never
  runs (it happened twice on 2026-09-04).
- Count callers, not definitions: `validateJobForPublishing` has a definition and **zero callers**;
  12 of the 19 files in `src/components/ui/` (`EmptyState`, `LoadingSkeleton`, `Modal`,
  `StatusBadge`, `FeatureGate`, `StatsCard`, `DataTable`, `SearchInput`, `Sidebar`, `Breadcrumb`,
  `FileUpload`, `Chart`) have **zero importers** (pages hand-roll their own) — a "canonical
  component" that nothing uses is not canonical; say so. In zsh, `$c[...]` inside double quotes is
  an array subscript — write `${c}` or the count silently reads 0.
- **Read the whole rule file before asserting rule behaviour.** Firestore/Storage rules are
  additive: a later `match /{document=**}` or a duplicate block with a wider `allow` wins over the
  careful block above it. Thirteen careful blocks are advisory today for exactly this reason.
- Firebase REST probes need the web API key; the harness may deny extracting it from the live
  bundle (it did on 2026-09-04). Use the Rules Playground (owner-run, quoted) or the emulator.
  Never probe with a write. Never fetch documents that contain PII to "prove" a read rule — use a
  non-PII path (`counters/theniJobsId_company`).
- `x-vercel-cache: HIT` responses carry a `last-modified` equal to the CDN fill time, not the
  deployment time; a query string does not bust it. Correlate content (a string unique to a
  commit), not timestamps, to say what SHA is live.
- Line numbers in this skill were measured at `5b61111`; `firestore.rules` is 400 lines,
  `storage.rules` 120, `globals.css` 1458. Re-measure after any edit.

## Gates and builds

- Real gates: `npx tsc --noEmit` · `npm run lint` (eslint 9 flat config; `eslint` with no
  arguments lints the whole tree including `scripts/*.js|mjs` — a new script must pass it) ·
  `npm run build` (`next build` sets `NODE_ENV=production` → `output: 'export'` → `out/`).
- **There is no test suite.** `npm test` does not exist; `gate.sh` runs it only when
  `package.json` defines it. A report that says "tests passed" without a `test` script is false.
- **`npm run lint` is red on the production tip** (`5b61111`, measured 2026-09-04 by GOV-3's
  gate: 12 errors, 758 warnings). The 12 errors are ambient, in files no governance phase touches:
  `src/app/employer/candidates/page.tsx` (665, 668 `react-hooks/immutability`),
  `src/app/global-error.tsx` (71 `no-html-link-for-pages`),
  `src/app/seeker/resume/builder/page.tsx` (118 use-before-declare),
  `src/app/sitemap.ts` (123, 156 `prefer-const`), `src/components/home/TrendingJobs.tsx` (399),
  `src/components/portfolio/SeekerSiteEditor.tsx` (921 ×2) and
  `templates/SeekerPortfolioRenderer.tsx` (683 ×2, `react/no-unescaped-entities`). Attribute them
  by name in every gate table; a phase that touches one of these files fixes that file's errors;
  never weaken `eslint.config.mjs` to go green. The 758 warnings are mostly unused imports and
  unused `eslint-disable` directives — a lint-hygiene phase of its own, never bundled.
- `next build` under the static export fails on a dynamic route without `generateStaticParams`;
  the seven existing `POST` handlers are collected during the build (the owner's builds succeed
  with real config) and are absent from the served output (production 404s them). Do not read a
  green build as "the API works". The build's own Firebase init failure (above) is the first thing
  a fresh checkout hits — before any route logic.
- Ambient gate state at `5b61111`/`9b8ba5d` (2026-09-04, no env file): `typecheck` 0 ·
  `lint` 1 (12 ambient errors, listed below) · `build` 1 (environment: no `.env.local`) ·
  `secrets:src-literals` 1 (S-6, `src/app/api/otp/call/route.ts`) · `tracked-artefacts` 0 ·
  `test`/`test:rules`/`secrets:bundle` SKIP. Attribute each by name; none is a phase's regression
  unless the phase touched the file.
- `tsconfig.json` excludes `scripts/`; `tsc` proves nothing about `scripts/*.ts`.
- Build time is minutes, not seconds; give `gate.sh` a 20-minute time box.
- `firebase emulators:exec` needs a JDK the current `firebase-tools` accepts; JDK 17 is installed
  and the memory note says 21 is required (CLAIMED_NOT_VERIFIED). Never run the emulator with
  `--import` of production data; never run `firebase deploy`.

## Application traps

- `register-business/page.tsx:128` creates companies with `isActive: true`; it works only because
  of the catch-all. The rules fix and this line change together, or the flow breaks in production.
- `checkUserCredits()` fails **open** (`allowed: true, balance 100`) on a read error.
- `PaymentCheckoutModal.tsx` opens Razorpay checkout with a placeholder key when no order key is
  returned, and calls verify with `'direct_authorized'` when the script is missing — a "successful
  payment" under `next dev` with no env proves nothing.
- The OTP routes return "success" in test mode; `123456`/`999999` verify anything.
- `platformSettings/aiConfig` may contain plaintext provider keys if an admin ever saved one; the
  document is world-readable. Never `cat` it into a report.
- `scripts/cleanup_demo_data.ts` deletes eight collections and every non-admin user when
  `DRY_RUN=false`. Never run it in any mode. `scripts/processLogo.js` has a Windows-only source
  path. `scripts/testAppRoutes.js` expects a dev server on :3001.
- `firebase.json` rewrites (`/companies/** → _fallback.html` etc.) do not run on Vercel; an unknown
  slug is a 404 there. `next.config.ts` disables the export in `next dev` for the same reason.
- `globals.css` L330–400 forces readable form controls with `!important`; portal pages still carry
  dark Tailwind classes. Do not "clean up" the override in a feature phase.
- `html { overflow-x: hidden }` only; adding it to `body` breaks `position: sticky` site-wide
  (fixed in `5b61111`).

## Claim protocol reality

The ledger row is a lock, but **a row on an unmerged branch is invisible from `develop`**. Before
scoping: `git worktree list` + `git branch --list 'thenijobs/*'` + the ledger's `ACTIVE` rows, read
for topic overlap. Never repair another branch's row.
