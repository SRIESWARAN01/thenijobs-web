# CI and deploy triggers — what exists (nothing), what a future workflow may do, what it never does

**Measured 2026-09-04 at `5b61111`:** no `.github/` directory, no workflow, no hooks
(`.git/hooks` holds samples only; no `core.hooksPath`, no husky, no lefthook), no prettier, no
test script. `gh run list` and `gh workflow list` for `SRIESWARAN01/thenijobs-web` return nothing.
Two commits deleted the last workflow: `177e4fc` (2026-06-24) and `e102f5a` (2026-06-25), both
"remove github workflow to bypass token permission" — the owner's account could not push a
workflow file with the token in use. The repository is **PUBLIC**; branch protection on `main`
is not visible from this machine (`gh api …/branches/main/protection` → 404, which is what a
non-admin token sees).

## 1. What deploys today (the honest picture)

| Trigger | Effect | Class |
|---|---|---|
| push to `main` on GitHub | Vercel production build + deploy of `www.thenijobs.com` / `www.thenijobs.in` **if** a Git integration is linked with production branch `main` | INFERRED (CDN fill 4 min after `pushedAt`; the `/pricing` page carries a `5b61111`-only string). Owner confirms in Vercel → Project → Settings → Git |
| push to any other branch | a Vercel preview deployment (default for linked repos) | UNKNOWN_LIVE_STATE |
| `firebase deploy --only hosting` from a laptop | replaces the stale `thenijobs-9f01d.web.app` copy (last: 2026-08-30) — no custom domain | VERIFIED |
| `firebase deploy --only firestore:rules,storage,database` from a laptop | **changes production rules immediately** | VERIFIED behaviour of the CLI; not run by the agent |
| Vercel dashboard "Redeploy" / a deploy hook / `vercel --prod` | a production deployment without a git push (a newer-than-push deployment was observed on 2026-09-04) | UNKNOWN_LIVE_STATE |

**Consequence for the branch model:** `main` is production; the owner's push is the deploy. The
agent prints the push command and stops. `develop`/`staging` pushes may create previews; the
owner may map `staging` to a preview domain (`D-DEPLOY`).

## 2. What a future workflow MAY do (a bounded CI phase, owner-approved)

- Run `npm ci`, `npx tsc --noEmit`, `npm run lint`, `npm run build` on push and pull request for
  `develop`, `staging`, `main`, and phase branches — read-only. **The build cannot succeed without
  the eight `NEXT_PUBLIC_FIREBASE_*` values** (measured 2026-09-04: `auth/invalid-api-key` at page
  data collection); the workflow injects them as repository variables by key name (they are public
  web config, present in every served bundle) and declares that it did so. No other secret.
- Run `node scripts/governance/validate-branch-dispositions.mjs` and print its warnings.
- Run the secret grep (`security.md` §7 H) and fail on a non-Firebase key literal.
- Run any test suite the D-TESTS phase adds (rules emulator tests with a pinned JDK).
- Post a status; require it in branch protection once the owner enables protection for
  `staging` and `main` (fast-forward only: "require linear history", "restrict pushes").

## 3. What a workflow NEVER does

- **Never an unattended deploy on push.** No `firebase deploy`, no `vercel` CLI, no deploy hook
  call from a workflow. Production deploys stay an owner-initiated act (the Vercel integration on
  `main`, which the owner controls) plus a manual rules deploy the owner runs.
- Never widen `permissions:` beyond `contents: read` (plus `pull-requests: write` for a status
  comment if the owner wants one). Never add a secret without naming the key and its rotation owner.
- Never run `scripts/cleanup_demo_data.ts`, never touch the `thenijobs-9f01d` project, never use
  a Firebase service account in CI until a server-side runtime exists (`D-HOSTING`).
- Never bump, skip or delete a check to go green; attribute every red job to code · stale check ·
  missing environment · policy conflict, and record the run id in the phase report.

## 4. Reading a red run (when one exists)

```bash
gh run list --repo SRIESWARAN01/thenijobs-web --limit 20 --json name,headBranch,headSha,conclusion,createdAt,event
gh run view <run-id> --repo SRIESWARAN01/thenijobs-web --json jobs --jq '.jobs[] | "\(.conclusion)\t\(.name)"'
gh run view <run-id> --repo SRIESWARAN01/thenijobs-web --log-failed | sed 's/\x1b\[[0-9;]*m//g' | grep -B8 '##\[error\]'
```

`gh` on this machine is logged in as a different account; reading a public repository's runs
works, pushing does not. A red run is evidence, not a verdict.
