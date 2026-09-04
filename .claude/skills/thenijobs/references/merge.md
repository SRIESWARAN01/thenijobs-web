# `merge` mode — integrate a VERIFIED phase into `develop`

`develop` is the only merge target for phase branches. `staging` and `main` never receive merge
commits (`promote.md`). Every merge happens **inside the worktree that holds `develop`**
(`/Users/saai_siddharth/Projects/Clients/Theni-Jobs-develop`), never by moving a ref from outside,
never in the primary checkout (`Projects/Clients/Theni Jobs`, the owner's desk).

## 1. Preconditions (all verified by command, none by memory)

1. Phase state is `VERIFIED` in `state.json` (or, outside the loop, the assessment says so): gate
   table captured after the last commit; every attached lane `PASS` or `PASS_WITH_FINDINGS`; no
   `BLOCKING`.
2. The ledger row exists on the branch with `Status` = `ACTIVE` and a `Why` that matches what was
   built. No placeholder may survive the merge.
3. `git -C <develop-wt> status --porcelain | wc -l` = 0 and
   `git -C <develop-wt> ls-files --others --exclude-standard | wc -l` = 0.
4. `git -C <develop-wt> rev-parse --abbrev-ref HEAD` = `develop` and `git worktree list` shows
   exactly one `[develop]`.
5. Collision re-check: another `ACTIVE` row or branch with the same scope merged since the base?
   `git log --oneline <base>..develop` read in full.
6. `out/`, `.next/`, `.env.local`, `tsconfig.tsbuildinfo` are not in the branch's tree
   (`git ls-tree -r <branch> --name-only | grep -cE '^(out/|\.next/|\.env|tsconfig\.tsbuildinfo)'` = 0).

## 2. Procedure (`scripts/merge-develop.sh <branch>` does steps 1–7 and stops before the commit)

```
1  D=…/Theni-Jobs-develop; PRE=$(git -C "$D" rev-parse HEAD)          # pin the pre-merge tip
2  BASE=$(git -C "$D" merge-base develop <branch>)
   comm -12 <(git -C "$D" diff --name-only "$BASE"..develop | sort) \
           <(git -C "$D" diff --name-only "$BASE".."<branch>" | sort)  # overlap → gate.sh must run on the RESULT if non-empty
3  git -C "$D" merge --no-ff --no-commit <branch>                       # inspection window
4  conflicts: resolve ONLY inside the phase's own files; for the ledger, union rows and confirm no row was lost
5  [ "$(git -C "$D" rev-parse refs/heads/develop)" = "$PRE" ] || abort     # the ref did not move under you
6  git -C "$D" commit -m "Merge branch '<branch>' into develop"
7  M=$(git -C "$D" rev-parse HEAD)
   git -C "$D" diff --name-status "$PRE" "$M"                            # must be ⊆ phase files (+ ledger)
   resurrection check (§2.1) = 0
   git -C "$D" reflog show develop -1                                    # reads "commit (merge)"
8  overlap non-empty → bash .claude/skills/thenijobs/scripts/gate.sh in the develop worktree at "$M" (needs node_modules there)
9  ledger bookkeeping commit on develop: Status ACTIVE → MERGED_DEVELOP, SHA cell = branch tip,
   "Merged into" = "$M" — `docs(repo): record <ID> merged into develop as <M>` (pathspec commit)
10 worktree disposition (§4); then, if run.md config allows, `git -C "$D" push origin develop`
   (a push to develop may trigger a Vercel preview build if the Git integration is linked — say so)
```

### 2.1 Stale-document resurrection check

The merge result must not resurrect content the repository has already moved past. After the
commit, on `$M`:

```
git -C "$D" ls-tree -r "$M" --name-only | grep -cE '^(out/|\.next/|\.env(\..*)?$|NEXT_PROMPT\.md|PHASE_.*_PROMPT\.md|\.github/workflows/)'   # must be 0 (workflows only via a CI phase, ci.md)
git -C "$D" grep -c -E '#0a0a1a|glassmorphism' "$M" -- 'src/**' | head                                      # full.mf's dark theme must not re-enter src/
git -C "$D" grep -n -E "localStorage\.(getItem|setItem)\('(admin_|tj_admin)" "$M" -- 'src/app/admin/**'    # admin-portal.md's localStorage admin must not return
git -C "$D" diff --stat "$PRE" "$M" -- full.mf admin-portal.md walkthrough.md README.md               # stale docs are not "updated" by a phase
```

A merge that fails any check is undone with `git -C "$D" merge --abort` (before commit) — never
with `reset --hard` after commit; after commit, re-merge on top with the correction and report
both SHAs.

## 3. The ledger — `docs/active/BRANCH_DISPOSITIONS.md`

Seven columns: `Branch | SHA | Status | Decided | Decided by | Why | Merged into`. Rules:

- **The row is the claim; write it as the first commit.** Name the files you expect to touch and
  the collision check you ran.
- **Never change another branch's `Status` cell** — flag and ask.
- Status tokens: `ACTIVE` · `MERGED_DEVELOP` (contained in `develop`; `Merged into` = merge SHA) ·
  `ENVIRONMENT` (`develop`/`staging`/`main`) · `PRESERVED_REFERENCE` (never merge without a new
  owner decision) · `SUPERSEDED_BY:<branch>` · `ARCHIVED_TAG:<tag>`.
- Promotions are recorded in the ledger's `## Promotions` table (date · source → target · source
  SHA · pushed · owner's word quoted · deploy consequence · evidence), not per row.
- `scripts/governance/validate-branch-dispositions.mjs` re-derives facts from git: every live local
  branch has a row; recorded SHAs match tips (`ACTIVE` rows may record the base); `MERGED_DEVELOP`
  rows are ancestors of `develop`; `PRESERVED_REFERENCE` rows are ancestors of neither `develop`
  nor `main`; `staging` and `main` are ancestors of `develop` (fast-forward model). Exit code is
  always 0 (warnings for a human) — read them and quote them.

## 4. Worktree lifecycle — the merge is not done until the desk is cleared

Four preconditions, then the porcelain command, in the same session that merged:
```
git merge-base --is-ancestor <branch> develop            # contained
git -C <wt> status --porcelain | wc -l                   # 0
git -C <wt> ls-files --others --exclude-standard | wc -l # 0 (untracked = STOP: archive outside the repo first, verify, then proceed)
git worktree remove <wt> && git worktree prune           # never rm -rf; refusing on dirty is a safety feature
```
`df -h` before and after. Never delete the merged branch ref. Never remove the primary checkout,
`Theni-Jobs-develop`, or any worktree holding an in-flight phase. A merge phase that leaves its
worktree standing is `PARTIAL`.

## 5. Report

```
MERGE — <phase>
develop before: <PRE>  after: <M>   merge-base: <BASE>   overlap files: <n> (list)   gates run on the result: yes/no (table)
first-parent diff: <n> files, all within phase scope (or: exceptions listed)   resurrection check: 0
ledger: row line <n> → MERGED_DEVELOP, bookkeeping commit <sha>   validator warnings: <n> (listed)
worktree: <path> removed (preconditions 4/4) · df before/after   push develop: yes/no (+ preview deploy consequence)
```
