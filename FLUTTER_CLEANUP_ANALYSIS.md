# Flutter Project Cleanup & Duplicate Removal — Analysis Report

**Date:** 2026-06-10
**Repository:** `E:\thenijobs-main`
**Task:** Identify and remove a duplicate Flutter project, keep the one that matches the Node/Next.js website.

---

## 1. Outcome (read this first)

> **No duplicate Flutter project exists in this repository.**
> A full, git-ignore-aware scan of the entire tree found **exactly one** Flutter
> application: `thenijobs-flutter/`. **No deletion was performed** — there is nothing
> to delete, and removing anything would destroy the only mobile app.
>
> This also satisfies the task's own safety rule: *"If confidence is below 95%, stop
> deletion."* Confidence that a deletable duplicate exists is **~1%**.

---

## 2. How the repository was scanned

Search used ripgrep, which automatically honours `.gitignore` (so `node_modules/`,
`build/`, `.next/`, `.dart_tool/` etc. are excluded — exactly the noise you'd want gone),
**and** still includes untracked-but-not-ignored files. A second *source* project would
have its own `pubspec.yaml` and would have appeared.

| Signal (whole repo) | Matches found | Interpretation |
|---|---|---|
| `pubspec.yaml` (Flutter project root) | **1** — `thenijobs-flutter/pubspec.yaml` | One Flutter project |
| `lib/main.dart` (Flutter entry point) | **1** — `thenijobs-flutter/lib/main.dart` | One app entry point |
| `package.json` (Node project root) | **1** — `./package.json` (Next.js 16 site) | One Node/Next.js app |
| `firebase.json` | **1** — `./firebase.json` | Single Firebase config |
| `AndroidManifest.xml` | **3** — all under `thenijobs-flutter/android/app/src/{main,debug,profile}/` | **Standard build variants of one app** — not two apps |

### The "two projects" misconception — explained
Two things commonly look like a second project but are not:

1. **Three `AndroidManifest.xml` files.** Every Flutter Android app ships three: `main`
   (the real one), `debug`, and `profile` (tiny variant overrides for those build modes).
   This is one app, not three.
2. **`scripts/run-canonical-app.mjs` references a nested `thenijobs-main/` folder.** That
   path **does not exist** on disk (verified — `thenijobs-main/package.json` and
   `thenijobs-main/thenijobs-flutter/pubspec.yaml` both return *file not found*). The script
   is a **stale wrapper** left over from a refactor; the canonical Next.js app is the repo
   **root** itself (root `package.json` contains `next: 16.2.7` and the real build scripts).

---

## 3. The single Flutter project — status

**`thenijobs-flutter/`** — `name: thenijobs`, Flutter SDK `^3.11.0`.

| Dimension | Status vs. Next.js website |
|---|---|
| API integration | ✅ Same backend — Firebase Auth, Cloud Firestore, Cloud Functions (`asia-south1`), Storage, FCM, Analytics via `FirestoreService`. |
| Authentication | ✅ Email/password, Google, Phone-OTP; role-based routing (seeker / employer / business / admin). |
| Navigation | ✅ GoRouter with shell bottom-nav + full public + seeker + employer + admin route tree. |
| Screens / pages | ✅ Public + auth flows are real; 🟡 most seeker/employer/admin portal screens were data-driven stubs (now being replaced by the `lib/redesign/` premium UI). |
| Business logic | ✅ Apply, save, company register, reviews, leads, applications, gamification — wired to the same cloud functions/collections as the site. |
| Env / config | ✅ `core/config/firebase_config.dart`; functions region pinned; single `firebase.json`. |
| Assets | ✅ `assets/images/logo.png`, launcher icons. |
| Dependencies | ✅ Riverpod, GoRouter, Dio, Firebase suite, google_sign_in, file_picker, intl, google_fonts, + redesign deps (cached_network_image, shimmer, speech_to_text, flutter_secure_storage). |
| **Completion estimate** | **~80–85%** of website parity (public/auth/core flows complete; deep portal editors + redesign integration in progress). |

There is no second project to compare it against.

---

## 4. Retention decision

| | |
|---|---|
| **Keep** | `thenijobs-flutter/` (the only Flutter app — 100% of the mobile codebase) |
| **Delete** | **Nothing.** No duplicate, backup, experimental, or unused Flutter project was found. |
| **Confidence** | ~99% there is only one project; ~1% that a deletable duplicate exists. |

---

## 5. Safe cleanup execution — NOT performed (and why)

No destructive action was taken, for two independent reasons:

1. **Nothing to delete** — there is no duplicate project.
2. **Pre-conditions can't be met right now** — the Linux sandbox is offline (disk space),
   so the task's mandatory steps could not run:
   - ❌ Create backup archive (needs `zip`/`tar`)
   - ❌ `flutter pub get` dependency cleanup
   - ❌ `flutter build` verification

If a duplicate is later confirmed, the safe procedure (run when the sandbox is back) is:

```bash
# 1. Backup the duplicate first
cd /path/to/thenijobs-main
tar -czf flutter-duplicate-backup-$(date +%Y%m%d).tar.gz <DUPLICATE_FOLDER>

# 2. Remove it
rm -rf <DUPLICATE_FOLDER>

# 3. Clean caches/artifacts of the retained app
cd thenijobs-flutter
flutter clean && flutter pub get

# 4. Verify build
flutter analyze
flutter build apk --debug
```

---

## 6. Build verification

Not run — sandbox offline. To verify the retained app:

```bash
cd thenijobs-flutter
flutter pub get
flutter analyze        # expect: no errors
flutter build apk --debug
```

---

## 7. Final project structure (tracked source)

```
thenijobs-main/                 ← Next.js 16 website (PRIMARY reference)
├── src/                        ← web app (App Router)
├── functions/                  ← Firebase Cloud Functions (Node)
├── scripts/run-canonical-app.mjs  ← STALE wrapper (points at a non-existent nested folder)
├── firebase.json, firestore.rules, storage.rules
├── package.json                ← the real Next.js project
└── thenijobs-flutter/          ← THE ONE Flutter app (KEEP)
    ├── lib/
    │   ├── core/ features/ shared/
    │   └── redesign/           ← new premium mobile-first UI module
    ├── android/app/src/{main,debug,profile}/AndroidManifest.xml  ← 3 = normal variants
    ├── ios/  web/  assets/
    └── pubspec.yaml
```

## 8. Recommended (non-destructive) follow-ups
- Delete or fix the stale `scripts/run-canonical-app.mjs` (it delegates to a missing folder).
- Run `flutter clean` to drop regenerable caches (`build/`, `.dart_tool/`) — already git-ignored.
