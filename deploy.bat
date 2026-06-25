@echo off
REM ============================================================
REM  THENIJOBS - Firebase build & deploy
REM  Run this from E:\thenijobs-main (double-click or run in CMD)
REM  Deploys: root Next.js Hosting + Cloud Functions
REM           + Firestore rules/indexes + Storage rules
REM  Target project: thenijobs-9f01d
REM ============================================================
setlocal

cd /d "%~dp0"

echo.
echo === [1/7] Installing web dependencies ===
call npm install || goto :error

echo.
echo === [2/7] Installing Cloud Functions dependencies ===
call npm --prefix functions install || goto :error

echo.
echo === [3/7] Building web app ===
call npm run build || goto :error

echo.
echo === [4/7] Building Cloud Functions ===
call npm --prefix functions run build || goto :error

echo.
echo === [5/7] Ensuring Firebase CLI is installed ===
where firebase >nul 2>nul || call npm install -g firebase-tools || goto :error

echo.
echo === [6/7] Firebase login (opens a browser the first time) ===
call firebase login

echo.
echo === [7/7] Deploying to project thenijobs-9f01d ===
echo --- Deploying Rules, Indexes, Database rules ---
call firebase deploy --only firestore:rules,firestore:indexes,storage,database --project thenijobs-9f01d || goto :error

echo --- Deploying Cloud Functions ---
call firebase deploy --only functions --project thenijobs-9f01d || goto :error

echo --- Deploying Hosting ---
call firebase deploy --only hosting --project thenijobs-9f01d || goto :error

echo.
echo ============================================================
echo  DONE.  Live at:
echo    https://thenijobs-9f01d.web.app
echo    https://thenijobs-9f01d.firebaseapp.com
echo ============================================================
goto :end

:error
echo.
echo *** DEPLOY FAILED - read the error message above. ***
echo Common causes: build error, missing environment variables, not logged in, or wrong project.
exit /b 1

:end
endlocal
