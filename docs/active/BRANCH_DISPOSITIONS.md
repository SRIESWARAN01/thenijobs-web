# Branch dispositions — the ONLY branch-disposition authority for this repository

Created by phase GOV-3 on 2026-09-04 (OWNER_DECISION D-LEDGER, applied default). Before this file
existed, no record in the repository said what should happen to any branch; branch disposition
lived in one person's head and in one AI session's private memory. **This file is the authority.
Session memory is not.** Operating rules: `.claude/skills/thenijobs/references/merge.md` (rows,
claims, worktree lifecycle) and `references/promote.md` (the `## Promotions` table). Checked by
`scripts/governance/validate-branch-dispositions.mjs` (warnings only; read them).

## The rules

- **A branch absent from this file has NO disposition and MUST NOT be merged.** Absence is not
  neutral. Find out before merging it.
- **Only the owner changes a disposition.** A session may ADD a row for a branch it just created.
  A session may never CHANGE another branch's `Status` cell, not even to correct it. Flag and ask.
- **CLAIM BEFORE YOU START — the row is a lock, not a receipt.** See the claim protocol.
- **Phase branches merge into `develop`, never into `main`** (OWNER_DECISION D-BRANCH,
  2026-09-04). `staging` and `main` move only by fast-forward promotion with the owner's word in
  the same message, recorded in `## Promotions`. A merge commit or a direct commit on `staging` or
  `main` is a defect.
- **Nothing in this file authorizes a deploy.** `main` = production on Vercel (see the `main` row).
  The agent never runs `firebase deploy`, `vercel --prod`, or any equivalent.

## Claim protocol — read this before creating a branch

1. **Re-read the `## Branches` table.** Check for a row whose `Why` cell overlaps the work you are
   about to start, whatever its `Status`.
2. **If an overlapping row exists and is `ACTIVE`, STOP and ask the owner.** Two sessions on one
   scope is the failure mode, not a merge conflict to resolve later.
3. **Collision check by command, not memory:** `git worktree list` · `git branch --list
   'thenijobs/*'` · the `ACTIVE` rows below. A row on an unmerged branch is invisible from
   `develop`, so all three are mandatory.
4. **Add your row as the FIRST commit on the new branch**, `Status` = `ACTIVE`, `SHA` = the base
   commit, `Why` naming the files or directories you expect to touch and the collision check you
   ran. Commit it with a pathspec: `git commit -- docs/active/BRANCH_DISPOSITIONS.md`.
5. **Then do the work.** Expand the `Why` cell with findings as you go; commit ledger edits
   immediately, never leave the ledger dirty.
6. **Committing directly to `main` is a defect under this model**, not a phase. If it ever happens,
   add a row naming the commit so the next session can see it.
7. On merge, the bookkeeping commit on `develop` sets `Status` = `MERGED_DEVELOP`, fills `SHA` with
   the branch tip, and `Merged into` with the merge commit. No placeholder may survive the merge.

## Status tokens

| Token | Meaning |
|---|---|
| `ACTIVE` | claimed, unmerged; the `SHA` cell is the base at claim time until the bookkeeping commit |
| `MERGED_DEVELOP` | contained in `develop`; `Merged into` = the `--no-ff` merge commit on `develop` |
| `ENVIRONMENT` | `develop`, `staging`, `main` themselves; moved only by merge (develop) or fast-forward promotion |
| `PRESERVED_REFERENCE` | holds commits absent from `develop`; **never merge without a new owner decision**; never delete |
| `SUPERSEDED_BY:<branch>` | replaced by another branch; kept as history |
| `ARCHIVED_TAG:<tag>` | tagged and retired |

## Branch model (OWNER_DECISION D-BRANCH, 2026-09-04, applied default — owner pushes)

`thenijobs/<phase>` → `--no-ff` merge into `develop` (inside the develop worktree) → fast-forward-only
promotion `develop` → `staging` → `main`, each promotion with the owner's word in the same message.
`main` never receives a merge commit or a direct commit. `develop` and `staging` were created at the
production tip `5b611114` by GOV-3 and exist locally until the owner pushes them.

## Branches

| Branch | SHA | Status | Decided | Decided by | Why | Merged into |
|---|---|---|---|---|---|---|
| `develop` | `5b611114` | ENVIRONMENT | 2026-09-04 | owner (D-BRANCH, applied default) | Created at the production tip `5b611114` by GOV-3 (`git branch develop main`). Integration + local end-to-end. Checked out in `/Users/saai_siddharth/Projects/Clients/Theni-Jobs-develop`. Unpushed until the owner pushes. | N/A |
| `staging` | `5b611114` | ENVIRONMENT | 2026-09-04 | owner (D-BRANCH, applied default) | Created at `5b611114` by GOV-3. Pre-production; moves only by `promote staging` (fast-forward). Unpushed until the owner pushes; a push may create a Vercel preview (D-DEPLOY). | N/A |
| `main` | `5b611114` | ENVIRONMENT | 2026-09-04 | owner (D-BRANCH) | Production pointer. Served by **Vercel** (verified 2026-09-04: `server: Vercel`, `x-vercel-id: bom1::…`, `www.thenijobs.com` CNAME → `vercel-dns`, the `/pricing` page carries a string introduced only in `5b611114`). A push to `main` is a production deploy if the Vercel Git integration is linked to `main` (INFERRED from a CDN cache fill 4 min after `pushedAt`; not visible from this machine — owner confirms in the Vercel dashboard). Firebase Hosting `thenijobs-9f01d.web.app` holds a stale CLI deploy from 2026-08-30 and serves no custom domain. Moves only by `promote main`. | N/A |
| `thenijobs/gov3-thenijobs-skill-and-branch-model` | `f8bb57b` | MERGED_DEVELOP | 2026-09-04 | GOV-3 (this phase) | **Merged 2026-09-04** into `develop` as `a0c08fd` inside `Theni-Jobs-develop` (5 commits `f1d3154..f8bb57b`; first-parent diff 21 files, all in scope; overlap 0; resurrection check forbidden=0 dark-theme=0 workflows=0). Gate at `f8bb57b` (no env file): typecheck 0 · lint 1 (12 ambient errors in 7 untouched `src/` files) · build 1 (environment: `auth/invalid-api-key` at page-data collection — a fresh checkout cannot build without `.env.local`) · secrets:src-literals 1 (S-6 `src/app/api/otp/call/route.ts`) · tracked-artefacts 0 · test/test:rules/secrets:bundle SKIP. Phase worktree removed after the four preconditions. Scope: build the single operating skill `.claude/skills/thenijobs/` (`SKILL.md`, `references/{cto,worker,security,feedback,uiux,merge,promote,run,ci,decisions,hazards}.md`, `scripts/{gate,surface,state,merge-develop,promote}.sh`), this ledger, `scripts/governance/validate-branch-dispositions.mjs`, root `CLAUDE.md` (short rules; keeps the `@AGENTS.md` include), `.gitignore` (`.claude/settings.local.json`, `.claude/worktrees/`). No `.prettierignore` (no prettier, no hooks in this repository — measured). Collision check at claim: `git worktree list` = primary checkout only (`main`); `git branch --list 'thenijobs/*'` = empty; no ledger existed. Worktree: `/Users/saai_siddharth/Projects/Clients/Theni-Jobs-gov3`. Never touches `src/`, the rules files, `firebase.json`, `vercel.json`, `next.config.ts`, or `package.json`. | N/A — pending |
| `thenijobs/gov3b-validator-environment-rows` | `f541838` | ACTIVE | 2026-09-04 | GOV-3b (this phase) | Fix one validator defect found by GOV-3's own bookkeeping: `scripts/governance/validate-branch-dispositions.mjs` compared an ENVIRONMENT row's recorded SHA with the branch tip, which moves by design after every merge/promotion, producing a permanent false warning. Change: ENVIRONMENT rows record their creation SHA and the validator checks that it is an **ancestor** of the live tip (same rule as ACTIVE rows). Touches only that script and this row. Collision check at claim: `git worktree list` = primary + `Theni-Jobs-develop`; `git branch --list 'thenijobs/*'` = the merged GOV-3 branch only; no other `ACTIVE` row. Worktree: `/Users/saai_siddharth/Projects/Clients/Theni-Jobs-gov3b`. | N/A — pending |
| `origin/feature/production-transformation-v1` (remote only) | `b31cb86` | PRESERVED_REFERENCE | 2026-09-04 | GOV-3 (recorded; disposition needs the owner) | Remote-only branch, last commit 2026-07-26 "Phase 1: Create unified design system tokens". At `5b611114` it is 99 commits ahead of and 44 behind `main` (`git rev-list --count`). Its content was never integrated. Never merge without an owner decision; if it is ever adopted, it enters through a phase branch into `develop`. No local branch exists, so the validator reports it as informational. | N/A |

## Promotions

| Date | Source → target | Source SHA | Pushed | Owner's word (quoted) | Deploy consequence | Evidence |
|---|---|---|---|---|---|---|
| — | — | — | — | — | — | none yet |
