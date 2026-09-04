# `promote` mode — `staging` ← `develop`, `main` ← `staging` (fast-forward only, owner's word)

Promotion is a **git fast-forward plus a push**, and under D-DEPLOY the push to `main` **is the
production deploy** when the Vercel Git integration is linked to `main`. The loop never promotes.
A promotion request without the owner's word in the **same message** produces the plan, the
deploy consequence, and the question — nothing else. **The agent never runs `firebase deploy`,
`vercel`, `vercel --prod`, or a deploy hook.**

## 1. Why fast-forward only

The SHA that passed local end-to-end on `develop` is the SHA that reaches `staging`; the SHA that
was checked on `staging` is the SHA that reaches `main`. No merge commit, no direct commit, no
cherry-pick on `staging`/`main` — a hotfix goes through a phase branch → `develop` → promotion like
everything else, just faster. If `git merge-base --is-ancestor <target> <source>` is false, the
promotion is refused and the divergence is a finding.

## 2. Preconditions

| Target | Must be true (by command) |
|---|---|
| `staging` ← `develop` | every phase merged since the last promotion is `E2E_DEVELOP` · `scripts/gate.sh` on the `develop` tip: no red that is not an attributed ambient red (`hazards.md`) · ledger rows `MERGED_DEVELOP` with SHAs filled · `node scripts/governance/validate-branch-dispositions.mjs` warnings read · no new P0 in `security.md` §9 introduced since the last promotion · owner's word |
| `main` ← `staging` | `staging` == the SHA recorded in `## Promotions` for the last staging push · the staging checklist (§4) done **or** the owner explicitly accepts the "no staging preview yet" exception for this SHA, quoted · `SECRETS_IN_CLIENT` not newly red (`security.md` §7 probe G on the built `out/`) · `out/` and `.env.local` absent from the tree · a rollback plan naming the previous `main` SHA · owner's word |

## 3. Procedure (`scripts/promote.sh <staging|main> [--push]`)

```
1  source=develop|staging  target=staging|main
2  git worktree list | grep -w "\[$target\]"            # if a worktree holds the target: step 4 runs INSIDE it with merge --ff-only
3  git merge-base --is-ancestor "$target" "$source" || refuse ("target has commits not in source")
4  git fetch . "$source:$target"                         # ff-only by construction; refuses if the target is checked out anywhere
5  git log --oneline "$target@{1}".."$target"            # what moved — quote it in the report
6  --push (only after the owner's word): THENIJOBS_PROMOTE_CONFIRM=<target> bash scripts/promote.sh <target> --push
   → git push origin "$target"   (no hooks exist in this repository; nothing is bypassed)
7  ledger: append a row to ## Promotions (date · source → target · source SHA · pushed · owner's word quoted ·
   deploy consequence · evidence) on develop as a bookkeeping commit; state.json: promotions[] entry
```

## 4. Host-specific checklist (D-DEPLOY, measured 2026-09-04 at `5b61111`)

**Which push deploys what (CURRENT / INFERRED — the owner confirms in the Vercel dashboard):**

| Push | Consequence | Evidence class |
|---|---|---|
| `git push origin main` | **Production deploy on Vercel** (`www.thenijobs.com`, `www.thenijobs.in`) if the Git integration's production branch is `main` | INFERRED: `server: Vercel`; CDN cache filled 2026-09-03 19:57:41 UTC, 4 min after `pushedAt` 19:53:54 UTC; `/pricing` carries a `5b61111`-only string. No `.vercel/` directory, no `vercel` CLI, no dashboard access from this machine |
| `git push origin staging` | a Vercel **preview** build if the integration builds all branches (the owner may map `staging` to a preview domain) | UNKNOWN_LIVE_STATE |
| `git push origin develop` | same as staging (preview) | UNKNOWN_LIVE_STATE |
| `firebase deploy --only hosting` | replaces the stale copy on `thenijobs-9f01d.web.app` (last deployed 2026-08-30 04:11 UTC); **no custom domain points there** | VERIFIED (DNS + headers) |
| `firebase deploy --only firestore:rules,storage,database` | **changes production security rules immediately** | rules are the only server-side control that runs in production — treat as a production deploy |

**Before the owner pushes `main`** (the agent prints this; never runs it):

1. `out/` is never committed (`git ls-files out | wc -l` = 0). Vercel builds from source with
   `next build` (`vercel.json`), so the build must be green in `gate.sh` on the exact SHA.
2. `SECRETS_IN_CLIENT`: after `npm run build` in the worktree, `grep -rlE 'AIza[0-9A-Za-z_-]{35}|rzp_live_|gsk_|sk-[A-Za-z0-9]{20,}' out/_next/static` — Firebase web API keys are expected in the bundle by design; anything else is a stop.
3. Rules: if the SHA changes `firestore.rules`/`storage.rules`/`database.rules.json`, the push does
   **not** deploy them (Vercel ignores them). Print the exact command for the owner:
   ```
   firebase deploy --only firestore:rules,storage --project thenijobs-9f01d
   ```
   and require a Rules Playground check before and after. Never run it.
4. Firebase Hosting: only if the owner wants the `.web.app` copy refreshed:
   ```
   npm run build && firebase deploy --only hosting --project thenijobs-9f01d
   ```
   Printed, never run. Note that `firebase.json` rewrites/headers apply only there.
5. Rollback plan: the previous `main` SHA and the Vercel "Promote to Production" / "Instant
   Rollback" path (owner-operated). Git-level rollback is a new forward promotion, never a force push.

**Smoke after a production push (owner or agent, read-only):** `curl -sSI https://www.thenijobs.com/`
(`server: Vercel`, 200) · `/pricing`, `/jobs`, `/businesses` 200 · `/sitemap.xml` and `/robots.txt`
200 · a `/company/<known-slug>` 200 · `/api/ai` still 404 (expected under the static export) ·
homepage copy matches the SHA.

## 5. Report

```
PROMOTE — <target> ← <source>
moved: <from>..<to> (<n> commits, listed)   ff check: ok   worktree holding target: none|<path>
preconditions: table (each with the command and result)
deploy consequence of the push: production|preview|none (with the evidence class)
push: NOT DONE (awaiting the owner's word) | done; remote ref <sha>
commands printed for the owner (never run): firebase deploy … | none needed
ledger Promotions row: line <n>, commit <sha>
```
