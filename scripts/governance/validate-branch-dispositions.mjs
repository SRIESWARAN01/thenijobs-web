#!/usr/bin/env node
/**
 * validate-branch-dispositions.mjs — branch-disposition guard for the develop → staging → main model (GOV-3, 2026-09-04).
 *
 * docs/active/BRANCH_DISPOSITIONS.md is the repository's only record of what should happen to each branch. This script
 * re-derives the live facts from git and checks them against the file, printing warnings for a human. It checks:
 *   1. Every live local branch has a row in the "## Branches" table (a branch without a row has no disposition).
 *   2. Every local-branch row still names a live branch; a row whose branch starts with `origin/` is remote-only and is
 *      checked against refs/remotes instead (informational).
 *   3. Recorded SHAs: for ACTIVE rows the SHA is the base at claim time and must be an ancestor of the live tip; for every
 *      other row it must match the live tip.
 *   4. MERGED_DEVELOP rows are ancestors of `develop`.
 *   5. PRESERVED_REFERENCE rows are ancestors of neither `develop` nor `main` (the "merged anyway" incident pattern).
 *   6. Fast-forward model: `staging` and `main` are each an ancestor of `develop`; `main` is an ancestor of `staging`.
 *   7. ENVIRONMENT rows exist for develop, staging and main once those branches exist.
 *
 * EXIT CODE IS ALWAYS 0. Warnings are printed, never enforced. This repository has no CI; the skill's merge and promote
 * modes read this output and quote it. Run: node scripts/governance/validate-branch-dispositions.mjs
 */
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const DISPOSITIONS_PATH = "docs/active/BRANCH_DISPOSITIONS.md";
const ENVIRONMENTS = ["develop", "staging", "main"];

function git(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

function refExists(ref) {
  try {
    execFileSync("git", ["show-ref", "--verify", "--quiet", ref], { cwd: ROOT, stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

function isAncestorOf(sha, ref) {
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", sha, ref], { cwd: ROOT, stdio: "pipe" });
    return true;
  } catch (error) {
    if (error.status === 1) return false;
    return "error";
  }
}

function readDispositionsFile() {
  try {
    return readFileSync(resolve(ROOT, DISPOSITIONS_PATH), "utf8");
  } catch {
    return null;
  }
}

function parseBranchRows(source) {
  const lines = source.split("\n");
  const startIdx = lines.findIndex((line) => line.trim() === "## Branches");
  if (startIdx === -1) return [];
  const rows = [];
  for (let i = startIdx + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.startsWith("## ")) break;
    if (!line.trim().startsWith("|")) continue;
    if (/^\|\s*-+\s*\|/.test(line)) continue;
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    if (cells.length < 3 || cells[0] === "Branch") continue;
    const firstBacktick = (cell) => {
      const match = cell.match(/`([^`]+)`/);
      return match ? match[1] : null;
    };
    const branch = firstBacktick(cells[0]);
    const sha = firstBacktick(cells[1]);
    const status = cells[2].replace(/`/g, "").trim();
    if (!branch) continue;
    rows.push({ branch, sha, status, lineNumber: i + 1 });
  }
  return rows;
}

function listLocalBranches() {
  const output = git(["branch", "--format=%(refname:short) %(objectname)"]);
  const branches = new Map();
  for (const line of output.split("\n")) {
    if (!line.trim()) continue;
    const spaceIdx = line.indexOf(" ");
    branches.set(line.slice(0, spaceIdx), line.slice(spaceIdx + 1).trim());
  }
  return branches;
}

const warnings = [];
const notes = [];
const source = readDispositionsFile();

if (source === null) {
  warnings.push(`${DISPOSITIONS_PATH} does not exist. No branch disposition is recorded for ANY branch — every merge is unauthorized by the ledger's own rule.`);
} else {
  const rows = parseBranchRows(source);
  const liveBranches = listLocalBranches();
  const recorded = new Set(rows.map((row) => row.branch));

  for (const [name] of liveBranches) {
    if (!recorded.has(name)) {
      warnings.push(`No disposition row for live branch "${name}" — it has no disposition and must not be merged. Add a row (claim protocol).`);
    }
  }

  for (const row of rows) {
    if (row.branch.startsWith("origin/")) {
      const exists = refExists(`refs/remotes/${row.branch}`);
      notes.push(`remote-only row "${row.branch}" (${row.status}) — ${exists ? "remote ref present" : "remote ref NOT present locally (fetch to verify)"}`);
      if (exists && row.status === "PRESERVED_REFERENCE") {
        const tip = git(["rev-parse", `refs/remotes/${row.branch}`]);
        for (const env of ENVIRONMENTS) {
          if (refExists(`refs/heads/${env}`) && isAncestorOf(tip, env) === true) {
            warnings.push(`INCIDENT PATTERN: ${DISPOSITIONS_PATH}:${row.lineNumber} marks "${row.branch}" as PRESERVED_REFERENCE but its tip is an ancestor of ${env} — it was merged despite that disposition. Escalate to the owner.`);
          }
        }
      }
      continue;
    }

    const liveSha = liveBranches.get(row.branch);
    if (liveSha === undefined) {
      warnings.push(`${DISPOSITIONS_PATH}:${row.lineNumber} records "${row.branch}", but that branch does not exist locally. If it was retired, move the row to an ARCHIVED_TAG disposition; if it lives only on the remote, prefix it with origin/.`);
      continue;
    }

    if (row.sha) {
      const matches = liveSha.startsWith(row.sha) || row.sha.startsWith(liveSha);
      if (row.status === "ACTIVE") {
        if (!matches && isAncestorOf(row.sha, liveSha) !== true) {
          warnings.push(`${DISPOSITIONS_PATH}:${row.lineNumber} ACTIVE row "${row.branch}" records base ${row.sha}, which is not an ancestor of its live tip ${liveSha.slice(0, 9)} — the claim does not describe this branch.`);
        }
      } else if (!matches) {
        warnings.push(`${DISPOSITIONS_PATH}:${row.lineNumber} records "${row.branch}" at SHA ${row.sha}, but its live tip is ${liveSha.slice(0, 9)}. The row is stale — update it if you own it; otherwise flag it.`);
      }
    }

    if (row.status === "MERGED_DEVELOP" && refExists("refs/heads/develop") && isAncestorOf(liveSha, "develop") === false) {
      warnings.push(`${DISPOSITIONS_PATH}:${row.lineNumber} marks "${row.branch}" as MERGED_DEVELOP, but its tip ${liveSha.slice(0, 9)} is NOT an ancestor of develop. Re-verify before trusting the row.`);
    }

    if (row.status === "PRESERVED_REFERENCE") {
      for (const env of ["develop", "main"]) {
        if (!refExists(`refs/heads/${env}`)) continue;
        const result = isAncestorOf(liveSha, env);
        if (result === "error") {
          warnings.push(`${DISPOSITIONS_PATH}:${row.lineNumber} — could not determine whether "${row.branch}" is an ancestor of ${env}.`);
        } else if (result === true) {
          warnings.push(`INCIDENT PATTERN: ${DISPOSITIONS_PATH}:${row.lineNumber} marks "${row.branch}" as PRESERVED_REFERENCE (never merge without a new owner decision), but it IS an ancestor of ${env}. Escalate to the owner; do not change the Status yourself.`);
        }
      }
    }

    if (ENVIRONMENTS.includes(row.branch) && row.status !== "ENVIRONMENT") {
      warnings.push(`${DISPOSITIONS_PATH}:${row.lineNumber} — "${row.branch}" must carry Status ENVIRONMENT, found "${row.status}".`);
    }
  }

  for (const env of ENVIRONMENTS) {
    if (liveBranches.has(env) && !recorded.has(env)) {
      warnings.push(`Environment branch "${env}" exists but has no ENVIRONMENT row in ${DISPOSITIONS_PATH}.`);
    }
  }

  if (liveBranches.has("develop")) {
    for (const env of ["staging", "main"]) {
      if (!liveBranches.has(env)) continue;
      const result = isAncestorOf(liveBranches.get(env), "develop");
      if (result === false) {
        warnings.push(`Fast-forward model violated: "${env}" (${liveBranches.get(env).slice(0, 9)}) is not an ancestor of develop — a commit reached ${env} without passing through develop.`);
      }
    }
    if (liveBranches.has("staging") && liveBranches.has("main") && isAncestorOf(liveBranches.get("main"), "staging") === false) {
      warnings.push(`Fast-forward model violated: "main" is not an ancestor of staging — main moved without a staging promotion.`);
    }
  } else {
    notes.push("develop does not exist locally — the branch model is not yet in effect in this checkout");
  }
}

for (const note of notes) console.log(`note: ${note}`);
if (warnings.length === 0) {
  console.log(`branch-dispositions: OK — ${DISPOSITIONS_PATH} agrees with git (0 warnings)`);
} else {
  console.log(`branch-dispositions: ${warnings.length} warning(s)`);
  for (const warning of warnings) console.log(`  - ${warning}`);
}
process.exit(0);
