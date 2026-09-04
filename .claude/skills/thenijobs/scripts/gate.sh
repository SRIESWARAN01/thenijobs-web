#!/usr/bin/env bash
# gate.sh — the deterministic gate battery for /thenijobs. Built ONLY from commands that exist in this repository:
#   typecheck   npx tsc --noEmit
#   lint        npm run lint                 (eslint 9 flat config; lints src/ and scripts/)
#   build       npm run build                (next build → static export → out/; NEVER committed)
#   test        npm test                     ONLY if package.json defines a "test" script (none at 5b61111 — never invented)
#   test:rules  npm run test:rules           ONLY if package.json defines it (a future D-TESTS phase; emulator-backed)
#   secrets     bundle + source key-shape greps (security.md §7 G/H) — --secrets or --full
# Prints a table (name | exit | seconds | first failure line); writes logs under $THENIJOBS_GATE_OUT
# (default /tmp/thenijobs-gate/<branch>-<sha>-<ts>/). Exit code = number of failed checks (0 = all green).
#
# Usage: bash .claude/skills/thenijobs/scripts/gate.sh [--quick|--baseline|--full] [--no-build] [--secrets]
#   (default)    typecheck · lint · build · test (if defined) · test:rules (if defined)
#   --quick      typecheck + lint only
#   --baseline   same as default, labelled BASELINE (run on the untouched branch before building)
#   --full       default + secrets
#   --no-build   skip the build (e.g. while a dev server holds .next in this worktree)
#   --secrets    add the key-shape greps (paths only; values are never printed)
# Environment:
#   THENIJOBS_ENV_FILE=<path>   exported into the BUILD's environment only (real NEXT_PUBLIC_FIREBASE_* values); values never printed.
#                               Without it the build runs against projects/undefined and the table says "real Firebase config: no".
#   THENIJOBS_GATE_OUT=<dir>    log directory
#   THENIJOBS_ALLOW_PRIMARY=1   override the primary-checkout refusal (never for a real gate)
# Rules encoded here (references/hazards.md): refuses the primary checkout · never deploys · never copies .env.local ·
# never runs scripts/cleanup_demo_data.ts · never touches another worktree · never prints an env value.
set -uo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
[ -n "$ROOT" ] || { echo "gate.sh: not inside a git worktree" >&2; exit 2; }
PRIMARY="/Users/saai_siddharth/Projects/Clients/Theni Jobs"
if [ "$ROOT" = "$PRIMARY" ] && [ "${THENIJOBS_ALLOW_PRIMARY:-0}" != "1" ]; then
  echo "gate.sh: refusing to run in the primary checkout ($PRIMARY) — use a phase worktree (THENIJOBS_ALLOW_PRIMARY=1 overrides)" >&2; exit 2
fi
cd "$ROOT" || exit 2
MODE=default; BUILD=1; SECRETS=0
for a in "$@"; do case "$a" in
  --quick) MODE=quick;; --baseline) MODE=baseline;; --full) MODE=full; SECRETS=1;;
  --no-build) BUILD=0;; --secrets) SECRETS=1;; -h|--help) sed -n '2,24p' "$0"; exit 0;;
  *) echo "gate.sh: unknown flag $a" >&2; exit 2;; esac; done
BRANCH="$(git rev-parse --abbrev-ref HEAD)"; SHA="$(git rev-parse --short HEAD)"; TS="$(date +%Y%m%d-%H%M%S)"
OUT="${THENIJOBS_GATE_OUT:-/tmp/thenijobs-gate/$(echo "$BRANCH" | tr '/' '_')-$SHA-$TS}"; mkdir -p "$OUT"
ENVFILE="${THENIJOBS_ENV_FILE:-}"; REALCFG=no
if [ -n "$ENVFILE" ]; then
  if [ -f "$ENVFILE" ]; then REALCFG=yes; else echo "gate.sh: THENIJOBS_ENV_FILE=$ENVFILE does not exist" >&2; exit 2; fi
fi
[ -d node_modules ] || echo "WARNING: node_modules missing — a fresh worktree fails every check; run npm ci --no-audit --no-fund first"
HAS_TEST=$(node -e "const s=require('./package.json').scripts||{};process.stdout.write(s.test?'1':'0')" 2>/dev/null || echo 0)
HAS_RULES=$(node -e "const s=require('./package.json').scripts||{};process.stdout.write(s['test:rules']?'1':'0')" 2>/dev/null || echo 0)
echo "gate.sh mode=$MODE build=$BUILD secrets=$SECRETS  root=$ROOT  branch=$BRANCH  sha=$SHA  dirty=$(git status --porcelain | wc -l | tr -d ' ')  untracked=$(git ls-files --others --exclude-standard | wc -l | tr -d ' ')  real-firebase-config=$REALCFG  test-script=$HAS_TEST  rules-script=$HAS_RULES"
echo "logs → $OUT"
FAILS=0; ROWS=()
run() { # run <name> <command…>
  local name="$1"; shift; local log="$OUT/$(echo "$name" | tr ' /:' '___').log"; local start=$SECONDS
  ( "$@" ) >"$log" 2>&1; local rc=$?; local secs=$((SECONDS-start))
  local first=""; if [ $rc -ne 0 ]; then first="$(grep -E 'error TS[0-9]+|✖|Error:|Failed to compile|Type error|Build failed|Module not found|FAIL|failed with exit code|ERR!|Unhandled|Cannot find' "$log" | grep -vE '0 errors|warning' | head -1 | cut -c1-110 || true)"; FAILS=$((FAILS+1)); fi
  ROWS+=("$(printf '%-28s | %4s | %5ss | %s' "$name" "$rc" "$secs" "$first")")
  printf '  %-28s exit=%s (%ss)\n' "$name" "$rc" "$secs"
}
skip() { ROWS+=("$(printf '%-28s | %4s | %5ss | %s' "$1" SKIP 0 "$2")"); printf '  %-28s SKIPPED (%s)\n' "$1" "$2"; }
build_cmd() { # runs the build with the optional env file sourced in a subshell; values never echoed
  if [ -n "$ENVFILE" ]; then set +x; set -a; . "$ENVFILE"; set +a; fi
  npm run build
}
# ---- core (the only real commands in this repository)
run typecheck npx tsc --noEmit
run lint      npm run lint
if [ "$MODE" != quick ]; then
  if [ $BUILD = 1 ]; then run "build(real-config=$REALCFG)" build_cmd; else skip build "--no-build"; fi
  if [ "$HAS_TEST" = 1 ]; then run test npm test; else skip test "no test script in package.json (there is no test suite)"; fi
  if [ "$HAS_RULES" = 1 ]; then run test:rules npm run test:rules; else skip test:rules "no test:rules script (D-TESTS not built)"; fi
fi
if [ $SECRETS = 1 ]; then
  # G. bundle: Firebase web keys (AIza…) are expected in a static export; anything else is a stop
  if [ -d out/_next/static ]; then
    run "secrets:bundle" bash -c '! grep -rlE "gsk_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|rzp_live_[A-Za-z0-9]+|BEGIN (RSA |EC )?PRIVATE KEY|\"private_key\"" out/_next/static'
  else skip "secrets:bundle" "no out/_next/static (build skipped or failed)"; fi
  # H. source: key-shaped literals; paths only. Known ambient red at 5b61111: src/app/api/otp/call/route.ts (security.md S-6) — attribute, never delete the check
  run "secrets:src-literals" bash -c 'f=$(git grep -lE "AIza[0-9A-Za-z_-]{35}|gsk_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|rzp_live_[A-Za-z0-9]+" -- src scripts | grep -v "src/lib/firebase/adminUserService.ts" || true); if [ -n "$f" ]; then echo "key-shaped literal in:"; echo "$f"; exit 1; fi; echo clean'
  # I. tracked build/env artefacts must never be in the tree
  run "tracked-artefacts" bash -c 'n=$(git ls-files | grep -cE "^(out/|\.next/|\.env(\..*)?$|tsconfig\.tsbuildinfo$)" || true); [ "$n" = "0" ] && echo clean || { git ls-files | grep -E "^(out/|\.next/|\.env(\..*)?$|tsconfig\.tsbuildinfo$)"; exit 1; }'
fi
{
  echo "GATE TABLE  mode=$MODE  branch=$BRANCH  sha=$SHA  at=$TS  real-firebase-config=$REALCFG  failed=$FAILS"
  printf '%-28s | %4s | %6s | %s\n' name exit secs "first failure line"; printf '%s\n' "${ROWS[@]}"
} | tee "$OUT/summary.txt"
echo "summary → $OUT/summary.txt"
exit $FAILS
