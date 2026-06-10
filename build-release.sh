#!/bin/bash

# KushCloud Release Build Script
# Usage: ./build-release.sh [version]
# Example: ./build-release.sh v1.0.0

set -e

VERSION=${1:-"v1.0.0"}
RELEASE_DIR="./release-${VERSION}"

echo "🚀 Building KushCloud Release: $VERSION"
echo "========================================"

# Create release directory
mkdir -p "$RELEASE_DIR"

echo "📦 Installing dependencies..."
npm ci

echo "🏗️  Building web bundle..."
npm run build
cp -r dist/* "$RELEASE_DIR/"
echo "✅ Web bundle: $RELEASE_DIR/"

echo ""
echo "🔨 Building Android APK (Debug)..."
npx cap sync android
cd android
chmod +x gradlew
./gradlew assembleDebug --no-daemon
APK_DEBUG="app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_DEBUG" ]; then
    cp "$APK_DEBUG" "../$RELEASE_DIR/kushcloud-debug-$VERSION.apk"
    echo "✅ Debug APK: $RELEASE_DIR/kushcloud-debug-$VERSION.apk"
else
    echo "⚠️  Debug APK not found"
fi

echo ""
echo "🔨 Building Android APK (Release - Unsigned)..."
./gradlew assembleRelease --no-daemon
APK_RELEASE="app/build/outputs/apk/release/app-release-unsigned.apk"
if [ -f "$APK_RELEASE" ]; then
    cp "$APK_RELEASE" "../$RELEASE_DIR/kushcloud-release-unsigned-$VERSION.apk"
    echo "✅ Release APK: $RELEASE_DIR/kushcloud-release-unsigned-$VERSION.apk"
else
    echo "⚠️  Release APK not found"
fi

cd ..

echo ""
echo "📋 Release Summary"
echo "=================="
ls -lh "$RELEASE_DIR"
echo ""
echo "✅ Release complete!"
echo ""
echo "📤 Next steps:"
echo "  1. git tag -a $VERSION -m \"Release $VERSION - Real-time leaderboard integration, statistics dashboard, power user features\""
echo "  2. git push origin $VERSION"
echo "  3. Create GitHub Release with files from $RELEASE_DIR"
echo "  4. Update CHANGELOG.md"
echo "  5. Update RELEASE_v1.0.0.md with changes"
echo ""
echo "📝 Release Documentation:"
echo "  - Detailed release notes: RELEASE_GUIDE.md"
echo "  - Changelog: CHANGELOG.md"
echo "  - Version history: RELEASE_v1.0.0.md"