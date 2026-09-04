# `run` mode — the self-paced loop (`/loop /thenijobs run`)

One tick = **one bounded step** of the current phase, evidence written to disk, state advanced,
next wake scheduled. Never one whole phase per tick. Never an unbounded step.

## 1. Where the truth lives (never in the conversation)

```
~/.thenijobs/run/<programme>/state.json    the programme: contracts, phase states, evidence paths, config, budgets, tick log
~/.thenijobs/run/<programme>/STATUS.md     human heartbeat, rewritten every tick (the owner reads this)
~/.thenijobs/run/<programme>/logs/         gate tables, probe outputs, per-tick notes
the repository                             branches, ledger rows, commits — the only durable record of work
```

Every tick **starts** with `bash .claude/skills/thenijobs/scripts/state.sh show <programme>`,
`git -C <worktree> status --porcelain | wc -l`, `git -C <worktree> log -1`, and
`git -C <develop-worktree> rev-parse develop`. If the conversation and the disk disagree, the disk
wins. Context compaction is expected; it must never change what happens next.

## 2. `state.json` shape

```json
{
  "programme": "<name>", "created": "<iso>", "base_develop": "<sha>",
  "config": { "push_develop": false, "max_ticks": 300, "max_hours": 72, "max_ticks_per_phase": 50,
              "wake_seconds": 300, "allow_dev_server": true, "env_file": null },
  "phases": [ { "id": "X-1", "title": "…", "state": "PLANNED|CLAIMED|BUILT|SELF_GATED|LANES_PASSED|VERIFIED|MERGED_DEVELOP|E2E_DEVELOP|BLOCKED|STOPPED",
                "branch": "thenijobs/x1-…", "worktree": "…/Theni-Jobs-x1", "depends_on": [], "contract": { …SKILL §2.2… },
                "step": "<next step id>", "ticks": 0, "evidence": { "gate": "logs/…", "lanes": {…}, "merge": "…" },
                "blocked_reason": null } ],
  "promotions": [], "ticks": 0, "started": "<iso>", "stop": null, "tick_log": [ {"t":"<iso>","phase":"X-1","step":"…","result":"…"} ]
}
```

`config.env_file` is the path the owner named for real `NEXT_PUBLIC_FIREBASE_*` values (or
`null`). The loop never copies `.env.local` on its own; `gate.sh` reads `THENIJOBS_ENV_FILE`
only when the config names it, and every report states whether real credentials were used.

## 3. The tick

1. Load state. If `stop` is set → `ScheduleWakeup stop` and end.
2. Budget check: `ticks ≥ max_ticks` or elapsed ≥ `max_hours` or the phase's `ticks ≥
   max_ticks_per_phase` → `STOPPED(budget)`.
3. Pick the current phase: the first phase not in a terminal state whose `depends_on` are all
   `MERGED_DEVELOP`/`E2E_DEVELOP`. `BLOCKED` phases are skipped while an independent one remains;
   if none remains → `STOPPED(all remaining phases blocked)`.
4. Execute **one** step for its state (table below), using the mode's reference.
5. Write evidence paths, advance `state`/`step`, append the tick log, rewrite `STATUS.md`
   (`state.sh status`).
6. `ScheduleWakeup` with `delaySeconds` = `config.wake_seconds`, `noop:false` when anything
   changed, `reason` naming phase and step.

| State | Step(s) — one per tick unless trivially small |
|---|---|
| PLANNED | collision check → worktree add → `npm ci` → identity check → claim row commit → `CLAIMED` |
| CLAIMED | `gate.sh --baseline` → read contract files → `BUILT` begins: one workstream per tick (commit each) |
| BUILT | `gate.sh` after the last commit → `SELF_GATED` (or fix one red per tick; two consecutive reds on the same check → `STOPPED`) |
| SELF_GATED | one lane per tick (`security` → `uiux` → `feedback`), each writing its report to `logs/` → `LANES_PASSED` (any `BLOCKING` → fix in ≤ 2 ticks or `BLOCKED`) |
| LANES_PASSED | VERIFY per `cto.md` §2 with fresh evidence (revert-and-watch, may_write diff, probes) → `VERIFIED` or back to `BUILT` with findings |
| VERIFIED | `merge-develop.sh` → commit → checks → ledger bookkeeping → worktree removal → `MERGED_DEVELOP` (push `develop` only if `config.push_develop`) |
| MERGED_DEVELOP | `npm run dev` in the develop worktree (only if `config.allow_dev_server` and `env_file` is set), exercise the phase's journeys in the browser preview, stop the server → `E2E_DEVELOP`; without an env file → `E2E_DEVELOP` is recorded as `NOT_RUN (no credentials)` and the phase stays `MERGED_DEVELOP` until the owner provides one |

## 4. Hard stop conditions (write the reason to `STATUS.md`, set `stop`, end the loop)

- an owner decision is required and no independent phase remains
- the same gate or check is red on two consecutive ticks for the same step
- an unattributed change appears in a worktree the loop uses, or `develop` moved by a commit the
  loop did not make and the contract's `may_write` overlaps it
- a permission is denied, a command hangs past its time box (default 30 min), or disk headroom
  drops below 15 GB (`df -h /`)
- another `ACTIVE` claim or a topically overlapping branch appears for the current scope
- a merge conflict lands in a file the phase does not own
- any secret-shaped value is encountered in a diff, a log, or an env dump (`security.md` §7 G)
- a step would need to write to the `thenijobs-9f01d` project (Firestore, Storage, Auth, Hosting)
- the programme is complete (every phase `E2E_DEVELOP` or `MERGED_DEVELOP` with `NOT_RUN`) → `stop`
  with a completion summary

`BLOCKED` (not stop): a phase needs an owner decision (`decisions.md` §7), real credentials, the
hosting decision (`D-HOSTING`), or a fix outside its `may_write`. Record the reason, move on if
something independent remains.

## 5. What the loop may and may never do

**May:** create/remove phase worktrees (porcelain commands only) · `npm ci` in a worktree · commit
on phase branches · merge into `develop` inside `Theni-Jobs-develop` · push `develop` when
`config.push_develop` is true · run `gate.sh`, `tsc`, `lint`, `build`, any test the phase added ·
run `next dev` in a worktree and open the browser preview · read-only `curl` against the live site
· read-only `firebase`/`gh` subcommands · write under `~/.thenijobs/run/` and the phase worktree.

**Never:** push `staging` or `main` · **deploy anywhere** (`firebase deploy`, `vercel`, deploy
hooks) · run `scripts/cleanup_demo_data.ts` or `scripts/processLogo.js` · write to Firestore,
Storage, RTDB, Auth, or Hosting of `thenijobs-9f01d` (no REST writes, no admin SDK, no emulator
import into production) · touch the primary checkout `Projects/Clients/Theni Jobs` · copy
`.env.local` unless `config.env_file` names it · `rm -rf` a worktree, `git clean`, `reset --hard`,
`update-ref`, delete a branch · install toolchain · change `config` values it did not start with ·
continue after a stop condition.

## 6. Permissions for unattended operation

The loop only runs unattended when the harness will not prompt. Run the session in auto mode and
keep the project allowlist (`.claude/settings.local.json`, gitignored) covering the loop's safe
command set: `git -C * worktree add|remove|prune *`, `git -C * merge *`, `git -C * commit *`,
`git -C * push origin develop`, `npm ci *`, `npm run lint|build|dev`, `npx tsc *`,
`bash .claude/skills/thenijobs/scripts/*`, `node scripts/governance/*`, `curl -sS *`, `df -h *`.
Never allowlist `git push origin staging|main`, `firebase deploy*`, `vercel*`, `npx tsx
scripts/cleanup_demo_data.ts`, `rm -rf`, or any `reset`/`clean`.

## 7. Starting, watching, stopping

```
/thenijobs plan: <the whole ask>      → writes state.json with the phase contracts; changes nothing in the repo
/loop /thenijobs run                  → self-paced ticks until DONE or STOP
cat ~/.thenijobs/run/<programme>/STATUS.md
/thenijobs run stop                   → sets stop; the next tick ends the loop (or ScheduleWakeup stop immediately)
```

`STATUS.md` carries: programme · tick count and elapsed · current phase/state/step · last evidence
paths · blocked phases with reasons · promotions · the last 10 tick-log lines · the stop reason.
