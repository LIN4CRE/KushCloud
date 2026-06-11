#!/bin/bash

# KushCloud APK Builder - Fast Track Version
# Requires: Node.js 20+, npm 9+, Android SDK 34, JDK 17+
#
# Usage: ./build-apk-fast.sh [debug|release]
# Output: release-builds/KushCloud-v<version>.apk

set -e

APP_NAME="KushCloud"
OUTPUT_DIR="release-builds"
BUILD_TYPE=${1:-"debug"}

# Read version from package.json
VERSION=$(node -e "console.log('v' + require('./package.json').version)" 2>/dev/null || echo "v0.0.0")
echo "   Detected version: $VERSION"

mkdir -p "$OUTPUT_DIR"

# Step 1: Check Prerequisites
echo ""
echo "Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js not found. Please install Node.js 20+"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "ERROR: npm not found. Please install npm 9+"
    exit 1
fi

echo "   Node: $(node --version)"
echo "   npm: $(npm --version)"

# Step 2: Install Dependencies
echo ""
echo "Installing dependencies..."
npm ci --prefer-offline --no-audit

# Step 3: Build Web Bundle
echo ""
echo "Building web bundle..."
npm run build
echo "   Web bundle: dist/"

# Step 4: Prepare Android
echo ""
echo "Preparing Android build environment..."

if [ ! -d "android" ]; then
    echo "Adding Android platform..."
    npx cap add android
fi

echo "Syncing Capacitor..."
npx cap sync android

# Step 5: Build APK
echo ""
cd android
chmod +x gradlew

if [ "$BUILD_TYPE" = "release" ]; then
    echo "Building Release APK (unsigned)..."
    ./gradlew assembleRelease --no-daemon -x test -x lint
    
    if [ -f "app/build/outputs/apk/release/app-release-unsigned.apk" ]; then
        cp "app/build/outputs/apk/release/app-release-unsigned.apk" "../${OUTPUT_DIR}/${APP_NAME}-${VERSION}-release-unsigned.apk"
        echo "   Release APK: ${OUTPUT_DIR}/${APP_NAME}-${VERSION}-release-unsigned.apk"
    else
        echo "ERROR: Release APK build failed"
    fi
else
    echo "Building Debug APK..."
    ./gradlew assembleDebug --no-daemon -x test -x lint
    
    if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
        cp "app/build/outputs/apk/debug/app-debug.apk" "../${OUTPUT_DIR}/${APP_NAME}-${VERSION}.apk"
        echo "   Debug APK: ${OUTPUT_DIR}/${APP_NAME}-${VERSION}.apk"
    else
        echo "ERROR: Debug APK build failed"
    fi
fi

cd ..

# Step 6: Summary
echo ""
echo "================================================"
echo "     Build Complete!"
echo "================================================"
echo ""
echo "Output Directory: $OUTPUT_DIR"
ls -lh "$OUTPUT_DIR" 2>/dev/null || echo "   (no files found)"
echo ""
echo "Next Steps:"
echo "  1. Test the APK on an Android device"
echo "  2. Create a GitHub Release tag"
echo "  3. Upload to Google Play Store (requires signing key)"
echo ""
echo "Enjoy KushCloud!"
echo ""