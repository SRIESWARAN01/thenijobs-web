@echo off
set JAVA_HOME=D:\jdk21
cd android
echo Building Release APK...
call gradlew.bat assembleRelease
echo Building Release AAB...
call gradlew.bat bundleRelease
echo Done! Output files are located at:
echo APK: android\app\build\outputs\apk\release\app-release.apk
echo AAB: android\app\build\outputs\bundle\release\app-release.aab
pause
