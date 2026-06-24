# THENIJOBS Workspace

This repository contains two project surfaces:

- repository root - canonical production Next.js web app, Firebase Hosting/App Hosting config, Firestore/Storage rules, and Cloud Functions.
- `thenijobs-flutter/` - Flutter mobile app that uses the same Firebase backend.

## Canonical Development

From the workspace root, standard npm scripts run the canonical web app directly:

```powershell
npm run dev
npm run lint
npm run typecheck
npm run build
npm run verify
npm run functions:build
```

`npm run build` and `npm run verify` require the `NEXT_PUBLIC_FIREBASE_*` environment variables used by the app.

Run web and Firebase backend work from the repository root:

```powershell
cd E:\thenijobs-main
npm install
npm run lint
npm run typecheck
npm run build
npm run functions:build
```

Run mobile checks from the Flutter app:

```powershell
cd E:\thenijobs-main\thenijobs-flutter
D:\flutter\bin\flutter.bat pub get
D:\flutter\bin\flutter.bat test
D:\flutter\bin\flutter.bat analyze
```

`flutter analyze` currently has a known backlog and should be cleaned before release.

## Deployment Rule

Production deploys should use the repository root as the source of truth.

The root `firebase.json` points at the root Next.js app, `functions/`, Firestore indexes/rules, and Storage rules. `deploy.bat` follows the same canonical path.
