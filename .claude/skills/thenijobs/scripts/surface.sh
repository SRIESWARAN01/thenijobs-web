#!/usr/bin/env bash
# surface.sh — classify changed files into review lanes for /thenijobs. Deterministic; the router must not "judge" this.
# Usage: bash .claude/skills/thenijobs/scripts/surface.sh [<base>] [<head>]     (defaults: develop..HEAD)
#        bash .claude/skills/thenijobs/scripts/surface.sh --files <path-list-file>   (one path per line, e.g. a contract's may_write)
# Output: one line per file "<lane[,lane]>\t<path>" then "LANES: <space-separated>" (empty → LANES: none).
# Lanes: security (references/security.md §2) · uiux · feedback · seo · rules · api · config · skill · docs
# bash 3.2 compatible (macOS): no associative arrays.
set -uo pipefail
if [ "${1:-}" = "--files" ]; then [ -f "${2:-}" ] || { echo "surface.sh: --files needs a readable file" >&2; exit 2; }; FILES="$(cat "$2")"; else
  BASE="${1:-develop}"; HEAD="${2:-HEAD}"
  FILES="$(git diff --name-only "$BASE".."$HEAD" 2>/dev/null || git diff --name-only "$BASE" "$HEAD" 2>/dev/null || true)"; fi
LANES=""
lane() { case " $LANES " in *" $1 "*) ;; *) LANES="$LANES $1";; esac; }
while IFS= read -r f; do [ -z "$f" ] && continue; out=""
  case "$f" in
    firestore.rules|storage.rules|database.rules.json) out="security,rules"; lane security; lane rules;;
  esac
  case "$f" in
    src/app/api/*) out="${out:+$out,}security,api"; lane security; lane api;;
  esac
  case "$f" in
    firebase.json|vercel.json|next.config.ts|package.json|package-lock.json|.gitignore|.firebaserc|eslint.config.mjs|tsconfig.json|postcss.config.mjs)
      out="${out:+$out,}security,config"; lane security; lane config;;
  esac
  case "$f" in
    src/lib/ai/*|src/lib/firebase/*|src/contexts/AuthContext.tsx|src/hooks/useAuth.ts|src/lib/plans.ts|src/lib/constants.ts|\
    src/app/login/*|src/app/register/*|src/app/register-business/*|src/app/company/register/*|src/app/forgot-password/*|src/app/admin/*|\
    src/components/payment/*|src/components/auth/*|src/lib/seo/indexingApi.ts|src/lib/firebase/identityService.ts|scripts/*|.github/*)
      case "$out" in *security*) ;; *) out="${out:+$out,}security"; lane security;; esac;;
  esac
  case "$f" in
    src/app/globals.css|src/components/*|src/lib/types/portfolio.ts|src/app/layout.tsx|public/*)
      out="${out:+$out,}uiux"; lane uiux;;
    src/app/*.tsx) case "$f" in src/app/api/*) ;; *) out="${out:+$out,}uiux"; lane uiux;; esac;;
  esac
  case "$f" in
    src/lib/seo/*|src/app/sitemap.ts|src/app/robots.ts|src/components/seo/*|src/app/jobs-in-*|src/app/jobs/*) out="${out:+$out,}seo"; lane seo;;
  esac
  case "$f" in
    *.tsx|src/contexts/ToastContext.tsx|src/contexts/NotificationContext.tsx|src/lib/constants.ts|src/lib/branding/*)
      case "$f" in src/app/api/*) ;; *) out="${out:+$out,}feedback"; lane feedback;; esac;;
  esac
  case "$f" in
    .claude/skills/*|docs/active/BRANCH_DISPOSITIONS.md|scripts/governance/*|CLAUDE.md) out="${out:+$out,}skill"; lane skill;;
  esac
  case "$f" in
    *.md|*.mf) out="${out:+$out,}docs"; lane docs;;
  esac
  printf '%s\t%s\n' "${out:-none}" "$f"
done <<< "$FILES"
echo "LANES:${LANES:- none}"
