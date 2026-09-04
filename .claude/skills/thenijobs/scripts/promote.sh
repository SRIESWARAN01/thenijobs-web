#!/usr/bin/env bash
# promote.sh — fast-forward-only promotion: staging ← develop, main ← staging. Never pushes without an explicit confirmation
# variable set by the session AFTER the owner's word in the same message. Never deploys (a push to main IS the Vercel
# production deploy when the Git integration is linked — references/promote.md §4). See references/promote.md.
# Usage: bash .claude/skills/thenijobs/scripts/promote.sh <staging|main> [--push]
#   --push requires THENIJOBS_PROMOTE_CONFIRM=<target> in the environment (set it only after the owner's word).
set -uo pipefail
T="${1:-}"; PUSH=0; [ "${2:-}" = "--push" ] && PUSH=1
case "$T" in staging) SRC=develop;; main) SRC=staging;; *) sed -n '2,6p' "$0"; exit 2;; esac
R="$(git rev-parse --show-toplevel)"; fail() { echo "ABORT: $*" >&2; exit 1; }
for b in "$SRC" "$T"; do git -C "$R" show-ref --verify --quiet "refs/heads/$b" || fail "branch $b missing"; done
HOLDER="$(git -C "$R" worktree list | grep -w "\[$T\]" | awk '{print $1}' || true)"
git -C "$R" merge-base --is-ancestor "$T" "$SRC" || fail "$T has commits that are not in $SRC — promotion must be a fast-forward; investigate the divergence"
FROM="$(git -C "$R" rev-parse "$T")"; TO="$(git -C "$R" rev-parse "$SRC")"
ART="$(git -C "$R" ls-tree -r "$TO" --name-only | grep -cE '^(out/|\.next/|\.env(\..*)?$|tsconfig\.tsbuildinfo$)' || true)"
[ "$ART" = "0" ] || fail "$SRC tracks $ART build/env artefact(s) — never promote them"
if [ "$FROM" = "$TO" ]; then echo "$T already at $SRC ($TO)"; else
  echo "--- $T will move $(git -C "$R" rev-parse --short "$FROM") → $(git -C "$R" rev-parse --short "$TO"):"; git -C "$R" log --oneline "$FROM".."$TO" | head -60
  if git -C "$R" diff --name-only "$FROM" "$TO" | grep -qE '^(firestore\.rules|storage\.rules|database\.rules\.json)$'; then
    echo "NOTE: this promotion changes Firebase security rules — a git push does NOT deploy them. Print for the owner (never run):"
    echo "      firebase deploy --only firestore:rules,storage --project thenijobs-9f01d"
  fi
  if [ -n "$HOLDER" ]; then echo "worktree $HOLDER holds $T — fast-forwarding inside it"; git -C "$HOLDER" merge --ff-only "$SRC" || fail "ff-only merge failed inside $HOLDER"
  else git -C "$R" fetch . "$SRC:$T" || fail "ff update refused"; fi
  echo "$T now at $(git -C "$R" rev-parse --short "$T")"
fi
case "$T" in
  main) echo "deploy consequence of pushing main: PRODUCTION deploy on Vercel if the Git integration is linked to main (INFERRED — owner confirms)";;
  staging) echo "deploy consequence of pushing staging: a Vercel preview build if the integration builds all branches (UNKNOWN_LIVE_STATE)";;
esac
if [ $PUSH = 1 ]; then
  [ "${THENIJOBS_PROMOTE_CONFIRM:-}" = "$T" ] || fail "THENIJOBS_PROMOTE_CONFIRM=$T is not set — the owner's word for THIS promotion is required in the same message"
  echo "pushing origin $T (no hooks exist in this repository; nothing is bypassed)"
  git -C "$R" push origin "$T" || fail "push failed (the harness denies git push for the agent — the owner runs: git push origin $T)"
  echo "pushed. Record the Promotions row (date · source → target · source SHA · pushed · owner's word · deploy consequence · evidence)."
else echo "push NOT done. After the owner's word: THENIJOBS_PROMOTE_CONFIRM=$T bash $0 $T --push   — or the owner runs: git push origin $T"; fi
