# `worker` mode — implement one bounded phase

You execute exactly one phase contract (SKILL §2.2). No contract → write one first (`cto.md` §5)
and show it; a described problem without a request to change is `status`, not `worker`.

## 1. Preflight (all of it, every phase)

1. **Re-read the integration tip**: `git -C <develop-worktree> rev-parse --short develop` and
   compare with the contract's `base`. If it moved, rebase the plan, not the branch — note the delta.
2. **Collision check**: `git worktree list`, `git branch --list 'thenijobs/*'`, the ledger's
   `ACTIVE` rows. Overlap → STOP and report.
3. **Worktree is mandatory.** `git -C "<root>" worktree add "<parent>/Theni-Jobs-<phase>" -b
   thenijobs/<id>-<slug> refs/heads/develop` (the root path contains a space — quote it; never send
   the output to `/dev/null`). Then `npm ci --no-audit --no-fund` in the worktree (~830 MB, lockfile v3).
4. **Identity**: `git -C <wt> config user.name` / `user.email` must be the repository-local values
   (SKILL §0.2); `D-ID` in `decisions.md` governs trailers.
5. **Claim row = first commit.** Add the ledger row (`merge.md` §3) with `Status` = `ACTIVE`, `SHA`
   = the base, a `Why` naming the files you expect to touch and the collision check you ran,
   `Merged into` = `N/A — pending`. Commit with a pathspec: `git commit -m "docs(repo): claim phase
   <ID> — <slug>" -- docs/active/BRANCH_DISPOSITIONS.md`. Then `git show --stat HEAD`.
6. **`.env.local` and real credentials.** A fresh worktree has no `.env.local`. State in the
   report whether the phase used real `NEXT_PUBLIC_FIREBASE_*` values: copy the file from the
   primary checkout **only if the owner said so for this phase**, never commit it (it is
   gitignored — verify with `git check-ignore .env.local`). Without it: `next dev` renders the
   first paint and throws `auth/invalid-api-key` ~2 s later; `next build` runs `generateStaticParams`
   against `projects/undefined` and exports pages with no dynamic params. No provider, Razorpay or
   2Factor key exists locally in any case — every API route runs in fallback/test mode under
   `next dev`, and **does not exist at all in the production static export**.
7. **Baseline the gates on the untouched branch**: `bash .claude/skills/thenijobs/scripts/gate.sh
   --baseline` (records the ambient state so the phase's delta is measurable; `hazards.md`).
8. Read every file in the contract's `files to read` list **in full** — whole functions, whole
   rule blocks, whole configs. Then read the callers of anything you will change (`grep -rn
   --include='*.ts' --include='*.tsx'`, quoted, because zsh expands the glob).

## 2. Implementation discipline — mirror existing patterns by exact path

- Touch only `may_write`. Anything else you discover goes into the report as a finding.
- **Rules**: a new moderated collection mirrors `firestore.rules` L37–73 (`safe*Create`,
  `*ModerationUnchanged`) and the per-collection shape at L85–111; a new storage path mirrors
  `storage.rules` L46–91 (`isOwner`/`isCompanyOwner` + type + size). Never add a rule whose
  behaviour the catch-all already grants — remove the catch-all in the same phase or say the rule
  is advisory. Keep the client write in the same phase as the rule that constrains it
  (`register-business/page.tsx:128` vs `safeCompanyCreate()`).
- **AI**: new features go through `src/lib/ai/aiClient.ts` → `src/app/api/ai/route.ts` with a
  prompt file under `src/lib/ai/prompts/` and an `AI_CREDIT_COSTS` entry; never a provider SDK in a
  `'use client'` file. State how the route is served in production (today: it is not).
- **Payments/OTP**: never trust a client flag; prices come from `SUBSCRIPTION_PLANS`; a phase that
  touches `PLAN_PRICES` in `payment/verify/route.ts` must reconcile it with `constants.ts` or stop
  on `D-PLANS`.
- **Plan gating**: enforce where the write happens; `src/lib/plans.ts` helpers are UI hints until
  a rule or server path checks the same thing.
- **Design system** (`uiux.md`): light theme only; tokens from `globals.css` (`--vk-*`, role
  pillars); components from `src/components/ui/`; a new component = stop and report
  (`ZERO_NEW_COMPONENTS`). Every user-facing label that has a `tamilLabel` sibling in `constants.ts`
  keeps both languages; flag every new Tamil string for human review.
- **Feedback** (`feedback.md`): toasts via `useToast()` from `src/contexts/ToastContext.tsx`;
  never `alert()`; never render `err.message` raw to a user unless it is one of the app's own
  user-safe strings.
- **SEO**: a public page carries `generateMetadata`/`metadata` and, for jobs, JSON-LD from
  `src/lib/seo/jobSchema.ts`; a new public route is added to `src/app/sitemap.ts`; a private route
  is added to `robots.ts` `disallow`.
- **Static export**: every dynamic route needs `generateStaticParams`; no route handler that reads
  `Request`; no `headers()`/`cookies()`; `images.unoptimized` stays. `firebase.json` rewrites are
  dead config in production (Vercel) — never rely on them.
- Never edit `full.mf`, `admin-portal.md`, `walkthrough.md` to "update" them; they are stale
  evidence. Never run `scripts/cleanup_demo_data.ts` or `scripts/processLogo.js`.
- Keep the ledger `Why` cell growing with findings; commit ledger edits immediately with a pathspec.

## 3. Testing discipline

- Real commands: `npx tsc --noEmit` · `npm run lint` · `npm run build`. There is no test suite.
  If the phase adds one (D-TESTS, `decisions.md`), its files must exist, its runner must be in
  `package.json`, and its run must print a count — `gate.sh` picks it up automatically when
  `package.json` has a `test` script.
- For each fix: reproduce **before** (the check fails or the probe shows the defect), fix, the same
  check passes after. Record both outputs. A check that never failed proves nothing.
- Rules changes: a Rules Playground result (owner-run, quoted) or an emulator run
  (`firebase emulators:exec --only firestore,storage '<cmd>'` — needs a JDK the emulator accepts;
  JDK 17 is installed and the requirement is CLAIMED_NOT_VERIFIED) — a passing build is not
  evidence about rules.
- `scripts/gate.sh` after the **last** commit; keep the table. Compare with the baseline; every new
  red is yours until attributed.
- If the phase touches a screen: `npm run dev` in the worktree **after** gates (build deletes
  nothing here, but `out/` must never be committed), open it in the browser preview at 320 / 390 /
  768 / 1024 / 1440, record what you saw, and state whether real Firebase credentials were used.

## 4. Commits

- Small, typed commits: `type(scope): subject` ≤ 100 chars (`feat|fix|chore|docs|refactor|perf|
  test|revert`; scopes `rules|api|ai|payment|otp|seeker|employer|admin|portfolio|seo|ui|repo|skill`).
  No hook enforces this — the skill does. Trailers per `D-ID`. `git show --stat HEAD` after each.
- Never stage a file you did not change for this phase. `git status --porcelain` before `git add`.
  Never stage `.env.local`, `out/`, `.next/`, `tsconfig.tsbuildinfo`, `Documents/`.

## 5. Completion report (chat; exact paths, never pasted documents)

```
WORKER COMPLETION REPORT — <phase>
A. Execution mode (SINGLE AGENT · subagents NO · delegation NO · background NO · worktrees NO · workflows NO)
B. Starting branch/commit (and develop tip at start)      C. Final branch/commit
D. Pre-existing working-tree state and proof it was preserved (primary checkout untouched)
E. Files created   F. Files updated   G. Files deleted
H. Firestore / Storage / RTDB rules changes (exact blocks, by line, and whether the catch-all still exists)
I. AI gateway changes (AIFeatureKey entries, credit costs, prompt files, provider config)
J. Payment / OTP changes
K. Plan-gating changes (PLAN_FEATURE_MATRIX / TEMPLATE_PLAN_ACCESS diffs, and where enforced)
L. Commands executed   M. Exit codes   N. What each check actually proves
O. Real Firebase credentials used: yes/no (which env keys by name; never values)
P. Remaining work   Q. Blockers   R. Owner decisions required
S. Moderation / AI-credit / payment / OTP / secret caveats
T. Gate recommendation (never GO on your own word)
U. Worktree disposition — path · branch · `merge-base --is-ancestor <branch> develop` · porcelain count
   at removal · `git worktree remove` result · `prune` run · df -h before/after — or "N/A — no merge in scope"
V. Findings outside scope (path:line each) and "I did not verify …" statements
```

A report that omits failures is worse than no report.
