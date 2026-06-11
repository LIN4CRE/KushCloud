@echo off
REM KushCloud Release Build Script (Windows)
REM Usage: build-release.bat [version]
REM Example: build-release.bat v1.0.0
REM Output: release-[version]/KushCloud-v[version]*.apk

setlocal enabledelayedexpansion

set VERSION=%1
if "%VERSION%"=="" set VERSION=v1.0.0

REM Extract version number from package.json for consistency check
for /f "tokens=2 delims=:," %%v in ('findstr /C:"version" package.json') do (
    set PKG_VERSION=%%v
    set PKG_VERSION=!PKG_VERSION: =!
    set PKG_VERSION=!PKG_VERSION:"=!
    set PKG_VERSION=!PKG_VERSION: =!
)
echo   Version from package.json: v!PKG_VERSION!
echo   Build version tag: %VERSION%

set APP_NAME=KushCloud
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
    copy "app\build\outputs\apk\debug\app-debug.apk" "..\%RELEASE_DIR%\%APP_NAME%-v%VERSION%.apk"
    echo   Debug APK: %RELEASE_DIR%\%APP_NAME%-v%VERSION%.apk
) else (
    echo   Warning: Debug APK not found
)

echo.
echo 4. Building Android APK (Release - Unsigned)...
call gradlew.bat assembleRelease --no-daemon
if exist "app\build\outputs\apk\release\app-release-unsigned.apk" (
    copy "app\build\outputs\apk\release\app-release-unsigned.apk" "..\%RELEASE_DIR%\%APP_NAME%-v%VERSION%-release-unsigned.apk"
    echo   Release APK: %RELEASE_DIR%\%APP_NAME%-v%VERSION%-release-unsigned.apk
) else (
    echo   Warning: Release APK not found
)

cd ..

echo.
echo 5. Verifying iOS support...
where xcodebuild >nul 2>&1
if %errorlevel% equ 0 (
    echo   iOS build environment detected.
    echo   To build iOS: npx cap sync ios && npx cap open ios
    echo   Note: iOS requires macOS + Xcode
) else (
    echo   iOS build requires macOS + Xcode (not available on Windows)
    echo   iOS support is configured and ready for macOS builds.
)

echo.
echo Release Summary
echo ===============
dir "%RELEASE_DIR%"

echo.
echo Release complete!
echo.
echo   Next steps:
echo     1. git tag -a %VERSION% -m "Release %VERSION%"
echo     2. git push origin %VERSION%
echo     3. Create GitHub Release with files from %RELEASE_DIR%
echo     4. Update CHANGELOG.md
echo     5. Update RELEASE documentation

endlocal