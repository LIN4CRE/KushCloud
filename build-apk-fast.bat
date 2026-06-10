@echo off
REM KushCloud APK Builder — Windows Fast Track Version
REM Requires: Node.js 20+, npm 9+, Android SDK 34, JDK 17+

setlocal enabledelayedexpansion

cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║     🌿 KushCloud v1.0.0 — APK Builder                           ║
echo ║     Fast Track Build for Production Release                    ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

set VERSION=v1.0.0
set APP_NAME=KushCloud
set OUTPUT_DIR=release-builds
set BUILD_TYPE=%1
if "%BUILD_TYPE%"=="" set BUILD_TYPE=debug

if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

REM Step 1: Check Prerequisites
echo 📋 Checking prerequisites...
where node >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found. Please install Node.js 20+
    exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    echo ❌ npm not found. Please install npm 9+
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ Node: %NODE_VERSION%
echo ✅ npm: %NPM_VERSION%

REM Step 2: Install Dependencies
echo.
echo 📦 Installing dependencies...
call npm ci --prefer-offline --no-audit
if errorlevel 1 (
    echo ❌ npm install failed
    exit /b 1
)

REM Step 3: Build Web Bundle
echo.
echo 🏗️  Building web bundle...
call npm run build
if errorlevel 1 (
    echo ❌ Web build failed
    exit /b 1
)
echo ✅ Web bundle complete: dist\

REM Step 4: Prepare Android
echo.
echo 📱 Preparing Android build environment...

if not exist "android" (
    echo Adding Android platform...
    call npx cap add android
)

echo Syncing Capacitor...
call npx cap sync android
if errorlevel 1 (
    echo ❌ Capacitor sync failed
    exit /b 1
)

REM Step 5: Build APK
echo.
if "%BUILD_TYPE%"=="release" (
    echo 🔨 Building Release APK (unsigned)...
    cd android
    call gradlew.bat assembleRelease --no-daemon -x test -x lint
    
    if exist "app\build\outputs\apk\release\app-release-unsigned.apk" (
        copy "app\build\outputs\apk\release\app-release-unsigned.apk" "..\%OUTPUT_DIR%\KushCloud-v1.0.0-release-unsigned.apk"
        echo ✅ Release APK: %OUTPUT_DIR%\KushCloud-v1.0.0-release-unsigned.apk
    ) else (
        echo ❌ Release APK build failed
    )
) else (
    echo 🔨 Building Debug APK...
    cd android
    call gradlew.bat assembleDebug --no-daemon -x test -x lint
    
    if exist "app\build\outputs\apk\debug\app-debug.apk" (
        copy "app\build\outputs\apk\debug\app-debug.apk" "..\%OUTPUT_DIR%\KushCloud-v1.0.0-debug.apk"
        echo ✅ Debug APK: %OUTPUT_DIR%\KushCloud-v1.0.0-debug.apk
    ) else (
        echo ❌ Debug APK build failed
    )
)

cd ..

REM Step 6: Summary
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║     ✅ Build Complete!                                          ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo 📂 Output Directory: %OUTPUT_DIR%
dir %OUTPUT_DIR%
echo.
echo 📤 Next Steps:
echo   1. Test the APK on an Android device
echo   2. Create a GitHub Release tag
echo   3. Upload to Google Play Store (requires signing key)
echo.
echo 🎮 Enjoy KushCloud!
echo.

endlocal
