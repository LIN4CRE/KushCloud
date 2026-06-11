#!/bin/bash
# KushCloud iOS Builder
# Requires: Node.js 22+, macOS, Xcode, CocoaPods

set -e

echo "================================================================"
echo "     KushCloud iOS Builder"
echo "================================================================"

# Step 1: Install Dependencies
echo "Installing dependencies..."
npm install

# Step 2: Build Web Bundle
echo "Building web bundle..."
npm run build

# Step 3: Prepare iOS
echo "Preparing iOS platform..."
if [ ! -d "ios" ]; then
    echo "Adding iOS platform..."
    npx cap add ios
fi

echo "Syncing Capacitor..."
npx cap sync ios

# Step 4: Install CocoaPods
echo "Installing CocoaPods..."
cd ios/App && pod install && cd ../..

# Step 5: Build iOS App (Archive)
echo "Building iOS App..."
# Note: This requires a configured team ID and provisioning profile in Xcode
# For a generic build, we just open the project
echo "iOS project is ready. Open 'ios/App/App.xcworkspace' in Xcode to build and sign."

echo "================================================================"
echo "     iOS Preparation Complete"
echo "================================================================"
