#!/bin/bash

# KushCloud APK Builder — Fast Track Version
# This script builds a production-ready APK using pre-optimized settings
# Requires: Node.js 20+, npm 9+, Android SDK 34, JDK 17+

set -e

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     🌿 KushCloud v1.0.0 — APK Builder                           ║"
echo "║     Fast Track Build for Production Release                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Configuration
VERSION="v1.0.0"
APP_NAME="KushCloud"
OUTPUT_DIR="./release-builds"
BUILD_TYPE="${1:-debug}"  # debug or release

mkdir -p "$OUTPUT_DIR"

# Step 1: Check Prerequisites
echo "📋 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 20+"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm 9+"
    exit 1
fi

NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
echo "✅ Node: $NODE_VERSION"
echo "✅ npm: $NPM_VERSION"

# Step 2: Install Dependencies
echo ""
echo "📦 Installing dependencies..."
npm ci --prefer-offline --no-audit

# Step 3: Build Web Bundle
echo ""
echo "🏗️  Building web bundle..."
npm run build
echo "✅ Web bundle complete: dist/"

# Step 4: Prepare Android
echo ""
echo "📱 Preparing Android build environment..."

if [ ! -d "android" ]; then
    echo "Adding Android platform..."
    npx cap add android
fi

echo "Syncing Capacitor..."
npx cap sync android

# Step 5: Build APK
echo ""
if [ "$BUILD_TYPE" = "release" ]; then
    echo "🔨 Building Release APK (unsigned)..."
    cd android
    chmod +x gradlew
    ./gradlew assembleRelease \
        --no-daemon \
        -x test \
        -x lint
    
    APK_SOURCE="app/build/outputs/apk/release/app-release-unsigned.apk"
    APK_OUTPUT="$OUTPUT_DIR/KushCloud-v1.0.0-release-unsigned.apk"
    
    if [ -f "$APK_SOURCE" ]; then
        cp "$APK_SOURCE" "$APK_OUTPUT"
        echo "✅ Release APK: $APK_OUTPUT"
    fi
else
    echo "🔨 Building Debug APK..."
    cd android
    chmod +x gradlew
    ./gradlew assembleDebug \
        --no-daemon \
        -x test \
        -x lint
    
    APK_SOURCE="app/build/outputs/apk/debug/app-debug.apk"
    APK_OUTPUT="$OUTPUT_DIR/KushCloud-v1.0.0-debug.apk"
    
    if [ -f "$APK_SOURCE" ]; then
        cp "$APK_SOURCE" "$APK_OUTPUT"
        echo "✅ Debug APK: $APK_OUTPUT"
    fi
fi

cd ..

# Step 6: Summary
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     ✅ Build Complete!                                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📂 Output Directory: $OUTPUT_DIR"
ls -lh "$OUTPUT_DIR"
echo ""
echo "📤 Next Steps:"
echo "  1. Test the APK on an Android device:"
echo "     adb install -r $APK_OUTPUT"
echo ""
echo "  2. Create a GitHub Release:"
echo "     git tag -a v1.0.0 -m 'Release v1.0.0'"
echo "     git push origin v1.0.0"
echo "     # Then upload APK to GitHub Releases manually"
echo ""
echo "  3. Or distribute via:"
echo "     - Google Play Store (requires keystore signing)"
echo "     - F-Droid (requires signed APK)"
echo "     - Direct .apk download (current setup)"
echo ""
echo "🎮 Enjoy KushCloud!"
echo ""
