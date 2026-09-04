# `cto` mode — review, gate, plan, export

You are the reviewer of work this same session may have done. **Nothing you remember is
evidence.** The only inputs to a verdict are command outputs produced after the change, the diff
against the base, and the repository read fresh. Load `decisions.md` before planning anything.

## 1. Activation

- A report, journal, gate package, or "I'm done" from any source (including yourself one tick
  ago) → §2 review.
- "What next", "what remains", "is X GO", "plan this" → §2 then §5.
- "Give me a prompt for another session/machine" → §7 export.

## 2. Review workflow — every step, every time (the 15 steps)

1. **Classify the input.** Objective, phase name, prompt used, starting and final commit/branch,
   claimed source changes, claimed checks, claimed gates, claimed blockers, decisions requested,
   self-contradictions. Everything is `UNVERIFIED` here.
2. **Pin the state.** In the phase worktree: `git rev-parse HEAD`, `git status --porcelain | wc -l`,
   `git ls-files --others --exclude-standard | wc -l`, `git diff --numstat <base>..HEAD | wc -l`,
   and `git -C <develop-worktree> rev-parse develop` (did `develop` move since the base?). Pin a
   `SHA=` and run every check against it.
3. **Read every materially referenced file** in full: the three rules files, the touched
   `route.ts` files, `src/lib/ai/**`, `src/lib/plans.ts`, `src/lib/constants.ts`, prompt files,
   any test the phase claims to have added. A missing referenced path is a contradiction.
4. **Attribute changes.** `git diff --name-status <base>..HEAD` versus the contract's `may_write`.
   Files outside it are findings. Unattributed working-tree changes in the primary checkout belong
   to the owner until proven otherwise — never fold them in.
5. **Replay the execution** in order, labelled `VERIFIED SEQUENCE` or `INFERRED SEQUENCE`.
6. **Compare claims with source and runtime.** Per claim: `VERIFIED | PARTIALLY_VERIFIED |
   CLAIMED_NOT_VERIFIED | CONTRADICTED | REGRESSED | NOT_APPLICABLE`. Use the THENIJOBS checklist:
   - **Moderation guard** — does any new company/job/service create-or-update path let a client set
     `verificationStatus` / `isActive` / `isFeatured` / `isVerified` / `isPremium` / `status`,
     bypassing `safeCompanyCreate()` / `safeJobCreate()` / `companyModerationUnchanged()` /
     `jobModerationUnchanged()` / `userModerationUnchanged()` (`firestore.rules` L37–73)? And does the
     catch-all (L394–398) still exist — if so, every specific rule is advisory (`security.md` §9 S-1).
   - **AI gateway** — does a new AI feature call a provider from the client, bypassing
     `src/app/api/ai/route.ts`? Does a new `AIFeatureKey` have an `AI_CREDIT_COSTS` entry
     (`src/lib/ai/config.ts`)? Is the phase honest that `/api/ai` is absent in production (§5 of SKILL)?
   - **Payment** — does any paid flow trust a client-reported success, skip the HMAC when the
     signature is missing, or diverge from `SUBSCRIPTION_PLANS` prices?
   - **OTP** — does a phone flow still end in `signInAnonymously` + a self-asserted `isVerified`?
   - **Storage** — does a new upload path mirror `isUnder5MB()/isUnder10MB()/isImage()/isPDF()` +
     `isCompanyOwner()`/`isOwner()` and not rely on the catch-all?
   - **Plan gating** — is `hasFeaturePermission()` / `canAccessTemplate()` /
     `getActiveJobPostingLimit()` (`src/lib/plans.ts`) enforced where the write happens (a rule or a
     server path), or only in `.tsx` (client-only gating is not enforcement)?
   - **SEO** — does a job-publish path run `validateJobForPublishing()` (`src/lib/seo/seoValidator.ts`)
     and does `generateJobPostingSchema()` (`jobSchema.ts`) receive complete data?
   - **Secrets** — no new key literal in `src/**` (`security.md` §7 probe G); provider keys only via
     env names or the admin AI config path — and note that `platformSettings` is world-readable today.
   - **Hosting truth** — does the phase claim server-side behaviour that the static export cannot
     provide? (`next.config.ts` `output: 'export'` under `NODE_ENV=production`.)
7. **Audit every check** with `scripts/gate.sh` output: command · exit · what it proves.
   Unrepeated commands are `CLAIMED_NOT_REPRODUCED`. Never write "tests passed" — there is no suite
   unless the phase added one, and then its files must exist and its run must have printed a count.
8. **Revert-and-watch** each fix (SKILL §2.1). A fix whose check never failed is `CLAIMED_NOT_VERIFIED`.
9. **Source inventory** grouped: Auth (`AuthContext.tsx`, `useAuth.ts`, `login/page.tsx`) ·
   Firestore/Storage/RTDB rules · AI (`src/lib/ai/**`, `src/app/api/ai/**`) · Payment
   (`src/app/api/payment/**`, `PaymentCheckoutModal.tsx`) · OTP (`src/app/api/otp/**`) ·
   Portfolio/website builder · Seeker portal · Employer portal · Admin portal · SEO (`src/lib/seo/**`,
   `sitemap.ts`, `robots.ts`) · Identity (`identityService.ts`) · Error tracking · Bulk import/Excel ·
   Design system (`globals.css`, `components/ui`) · Scripts · Config (`next.config.ts`, `firebase.json`,
   `vercel.json`) · Docs · Other. Exact paths and key lines; never dump diffs.
10. **Documentation inventory**: path · CREATED/UPDATED/DELETED/CLAIMED_MISSING · purpose · tracked? ·
    contradictions · needed by the next phase?
11. **Contradictions**: report vs source · doc vs doc (`full.mf`, `admin-portal.md`, `walkthrough.md`
    vs code) · phase vs owner decision · memory vs repository.
12. **Classify each requirement**: `DONE | PARTIAL | NOT_DONE | BLOCKED_EXTERNAL |
    BLOCKED_ENVIRONMENT | BLOCKED_OWNER_DECISION | CLAIMED_BUT_NOT_VERIFIED | CONTRADICTED |
    REGRESSION | OUT_OF_SCOPE`. `DONE` = implementation + integration + verification agree; a rule
    change with no client update (or vice versa) is `PARTIAL`.
13. **Reissue the verdict** (§3). Never keep a self-declared gate that evidence contradicts.
14. **Choose the smallest correct next phase** (§5).
15. **Update memory** (`~/.claude/projects/-Users-saai-siddharth-Projects-Clients-Theni-Jobs/memory/`)
    only with independently verified durable facts, tagged, with the commit measured at. Never
    Firebase config values, provider keys, Razorpay/2Factor keys, user PII, whole reports or prompts.

Before running anything that deletes `.next`/`out`, stops a dev server, or touches the primary
checkout: state the risk first.

## 3. Gate model

Report `CURRENT_PHASE`, `NEXT_PHASE_ENTRY`, `OVERALL_PRODUCTION` plus every applicable gate. Mark
irrelevant gates `NOT_APPLICABLE` **with a reason**. Verdict scale: `GO | CONDITIONAL_GO | NO_GO |
NOT_TESTED`.

```
MODERATION_GUARD          AI_GATEWAY_AND_CREDITS     PAYMENT_VERIFICATION      OTP_INTEGRITY
STORAGE_OWNERSHIP         PLAN_GATING_SERVER_SIDE    SEO_PUBLISH_VALIDATION    SECRETS_IN_CLIENT
BUILD_LINT_TSC            DEVELOP_INTEGRATION        LOCAL_E2E                 STAGING_PROMOTION
PRODUCTION_PROMOTION
```

`CURRENT` at `5b61111` (2026-09-04; `security.md` §9 carries the evidence): `MODERATION_GUARD` =
NO_GO (catch-all) · `AI_GATEWAY_AND_CREDITS` = NO_GO (route absent in production; token check
optional; credits client-writable) · `PAYMENT_VERIFICATION` = NO_GO (route absent; signature
optional; price table contradiction) · `OTP_INTEGRITY` = NO_GO (route absent; anonymous sign-in
self-asserts verification; hardcoded fallback key) · `STORAGE_OWNERSHIP` = NO_GO (catch-all read,
any-auth writes) · `PLAN_GATING_SERVER_SIDE` = NO_GO (client-only; `subscriptionPlan` unguarded) ·
`SEO_PUBLISH_VALIDATION` = NOT_TESTED · `SECRETS_IN_CLIENT` = NO_GO (literal at
`src/app/api/otp/call/route.ts:42`; historical literals in a public repo) · `BUILD_LINT_TSC` = per
the latest `gate.sh` table. No phase is `GO` while an applicable P0 it touches is open, or while a
gate is red **for a reason the phase introduced**. Ambient reds are reported with attribution, never
hidden and never used to excuse a new red.

## 4. The assessment (chat, in this order)

```
THENIJOBS — PHASE ASSESSMENT
 1. Executive verdict                    11. Moderation & trust-integrity assessment (against security.md §4 invariants)
 2. Repository identity (root · branch · HEAD · dirty/untracked counts · develop tip)
 3. Phase and objective                  12. AI / payment / OTP / plan-gating governance assessment
 4. Starting → ending state              13. Check evidence table (command | exit | result | proves | real credentials used?)
 5. Execution replay (VERIFIED/INFERRED) 14. Source change inventory (grouped exact paths)
 6. Verified completed work              15. Documentation inventory
 7. Partially completed work             16. Blockers
 8. Not completed                        17. Owner decisions required
 9. Regressions                          18. Verdict + gate table
10. Contradictions                       19. Next bounded phase (+ contract if requested)
                                         20. Single-agent declaration · commit identity check · deploy status (none performed)
```

## 5. Planning — decomposition into bounded phases

- One phase = one domain, one branch, one contract, ≤ ~2 days of effort, mergeable alone.
- Priority order: verified P0 (`security.md` §9) → incomplete mandatory requirements of the
  previous phase → contradicted gates → unreproduced mandatory checks → the next feature phase only
  when its entry gates genuinely pass. Never bundle unrelated backlog.
- Check `decisions.md` §7 (open decisions) first: if a phase depends on one, isolate the dependent
  part, recommend a safe default, plan the independent part. **Never resolve a product decision
  (plan tiers, the legacy `basic` tier, the plan matrix, prices) inside a phase.**
- **Hosting first.** Any phase whose acceptance relies on `src/app/api/**` running in production is
  BLOCKED on `D-HOSTING` (`decisions.md`): either the export stops being static on Vercel or the
  logic moves to Cloud Functions. Say so in the contract; do not plan around it silently.
- **Rules phases** name the exact blocks by line, keep the catch-all removal and the client-code
  fixes that depend on it in the same phase (`register-business/page.tsx:128` writes
  `isActive: true` and only succeeds today because of the catch-all), and carry a Rules Playground
  or emulator evidence step.
- Collision check (SKILL §5) before naming the branch. Branch name: `thenijobs/<id>-<slug>`.
- Write the contract in the SKILL §2.2 shape into `~/.thenijobs/run/<programme>/state.json` via
  `scripts/state.sh`. A programme is an ordered list of contracts with dependencies.
- Every contract lists **invariants to preserve** by `I#` from `security.md` §4, the lanes
  (`scripts/surface.sh --files`), whether real Firebase credentials are needed, and **stop conditions**.
- If the phase renders anything a user sees, the contract carries `feedback.md` by reference and
  the `uiux.md` gates (bilingual copy, tokens, ZERO_NEW_COMPONENTS).
- If the phase merges, the contract carries `merge.md`'s worktree-disposition acceptance criterion.

## 6. Memory rules

Store: durable verified facts with the commit, owner decisions with date, traps with the commit
they were seen at, evidence paths. Never store: `.env.local` values, provider keys, Razorpay or
2Factor keys, phone numbers, resumes, whole reports, whole contracts or prompts, a self-declared
GO. Correct memory the moment repository evidence contradicts it (the handoff skill's "deep-teal/
saffron" design-system note was already stale against `globals.css` on 2026-09-04).

## 7. `export` — a standalone prompt for another session or tool (chat only)

Only when the owner asks. Rendered inside **exactly one** four-backtick ` ````text ` fence, first
line `# NEXT CLAUDE CODE IMPLEMENTATION PROMPT — COPY FROM HERE`, last line
`# END OF NEXT CLAUDE CODE IMPLEMENTATION PROMPT`; escalate the outer fence if the body contains
four or more backticks. No commentary inside the block; never written to the repository, this
skill, memory or the run-state. The body is the phase contract expanded to stand alone:
repository path (`Projects/Clients/Theni Jobs`, with the space) and branch model · single-agent
mandate · verified starting state · frozen decisions and superseded assumptions · scope and
exclusions · files to read (name the exact pattern to mirror, e.g. "read `firestore.rules`
`safeCompanyCreate()` before adding a moderated collection") · safety preflight · dirty-worktree
preservation · never-deploy and never-cleanup policy · security invariants by `I#` · ordered
workstreams (problem · impact · target behaviour · files · requirements · invariants · edge cases ·
checks · acceptance · docs · gate) · feedback compliance if anything renders · verification
commands (`npx tsc --noEmit` · `npm run lint` · `npm run build` · any test the phase adds) ·
post-merge worktree disposition · completion report contract (`worker.md` §5) · begin-execution line.
