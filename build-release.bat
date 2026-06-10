@echo off
REM KushCloud Release Build Script (Windows)
REM Usage: build-release.bat [version]
REM Example: build-release.bat v1.0.0

setlocal enabledelayedexpansion

set VERSION=%1
if "%VERSION%"=="" set VERSION=v1.0.0

set RELEASE_DIR=release-%VERSION%

echo.
echo Building KushCloud Release: %VERSION%
echo ========================================

if not exist "%RELEASE_DIR%" mkdir "%RELEASE_DIR%"

echo.
echo 1. Installing dependencies...
call npm ci

echo.
echo 2. Building web bundle...
call npm run build
xcopy /E /I /Y dist\* "%RELEASE_DIR%\"
echo Web bundle: %RELEASE_DIR%\

echo.
echo 3. Building Android APK (Debug)...
call npx cap sync android
cd android
call gradlew.bat assembleDebug --no-daemon
if exist "app\build\outputs\apk\debug\app-debug.apk" (
    copy "app\build\outputs\apk\debug\app-debug.apk" "..\%RELEASE_DIR%\kushcloud-debug-%VERSION%.apk"
    echo Debug APK: %RELEASE_DIR%\kushcloud-debug-%VERSION%.apk
) else (
    echo Warning: Debug APK not found
)

echo.
echo 4. Building Android APK (Release - Unsigned)...
call gradlew.bat assembleRelease --no-daemon
if exist "app\build\outputs\apk\release\app-release-unsigned.apk" (
    copy "app\build\outputs\apk\release\app-release-unsigned.apk" "..\%RELEASE_DIR%\kushcloud-release-unsigned-%VERSION%.apk"
    echo Release APK: %RELEASE_DIR%\kushcloud-release-unsigned-%VERSION%.apk
) else (
    echo Warning: Release APK not found
)

cd ..

echo.
echo Release Summary
echo ===============
dir "%RELEASE_DIR%"

echo.
echo ^✓ Release complete!
echo.
   echo Next steps:
   echo   1. git tag -a %VERSION% -m "Release %VERSION% - Real-time leaderboard integration, statistics dashboard, power user features"
   echo   2. git push origin %VERSION%
   echo   3. Create GitHub Release with files from %RELEASE_DIR%
   echo   4. Update CHANGELOG.md
   echo   5. Update RELEASE_v1.0.0.md with changes
   echo.
   echo Release Documentation:
   echo   - Detailed release notes: RELEASE_GUIDE.md
   echo   - Changelog: CHANGELOG.md
   echo   - Version history: RELEASE_v1.0.0.md
   
   endlocal
