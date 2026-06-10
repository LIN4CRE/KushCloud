# KushCloud Production Deployment Guide

## 🎯 Deployment Overview

This guide provides comprehensive instructions for deploying the KushCloud game application to production environments. It covers web deployment, Android APK builds, and release management processes.

## 🚀 Web Deployment

### Prerequisites

- **Node.js** 20 or higher
- **npm** 9 or higher
- **Git** for version control

### Local Development

```bash
# Clone the repository
git clone https://github.com/LIN4CRE/KushCloud.git
cd KushCloud

# Install dependencies
npm install

# Start development server
npm run dev
# → http://localhost:5000
```

### Production Build

```bash
# Build for production
npm run build
# Outputs to ./dist/

# Preview production build locally
npm run preview
# → http://localhost:4173
```

### GitHub Pages Deployment

The web application is automatically deployed to GitHub Pages on every push to the `main` branch:

- **Live URL**: https://lin4cre.github.io/KushCloud/
- **Source**: https://github.com/LIN4CRE/KushCloud/tree/main

## 🤖 Android APK Deployment

### Prerequisites

- **Android Studio** with SDK 34+ and JDK 17+
- **Capacitor** CLI for building Android APKs
- **Git** for version control

### Local APK Build

```bash
# Build for development
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
# APK → android/app/build/outputs/apk/debug/app-debug.apk
```

### Release APK Build

```bash
# Build for release
npm run build
npx cap sync android
cd android && ./gradlew assembleRelease
# APK → android/app/build/outputs/apk/release/app-release-inaction
```

### Using Build Scripts

#### Linux/macOS

```bash
# Build debug APK
cd KushCloud
chmod +x build-apk-fast.sh
./build-apk-fast.sh debug
```

#### Windows

```cmd
# Build debug APK
cd KushCloud
build-apk-fast.bat debug
```

## 📦 Cross-Platform Build Scripts

### `build-apk-fast.sh` (Linux/macOS)

Automated script for building Android APKs:

```bash
#!/bin/bash

# KushCloud APK Build Script
# Usage: ./build-apk-fast.sh [debug|release]
# Example: ./build-apk-fast.sh debug

set -e

BUILD_TYPE=${1:-debug}
VERSION="v1.0.0"
RELEASE_DIR="./release-${VERSION}"

echo "🚀 Building KushCloud ${BUILD_TYPE} APK: ${VERSION}"
echo "========================================"

# Create release directory
mkdir -p "$RELEASE_DIR"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build web bundle
echo "🏗️  Building web bundle..."
npm run build

# Sync Capacitor
echo "🔗 Syncing Capacitor..."
npx cap sync android

# Build Android APK
cd android
chmod +x gradlew
./gradlew assemble${BUILD_TYPE^:0:1^^:s:#}${BUILD_TYPE:0:1} --no-daemon

# Copy APK
echo "📱 Building Android ${BUILD_TYPE} APK..."
APK_PATH="app/build/outputs/apk/${BUILD_TYPE}/${BUILD_TYPE:0:1^^:s:#}${BUILD_TYPE:0:1}.apk"

if [ -f "$APK_PATH" ]; then
    cp "$APK_PATH" "../$RELEASE_DIR/kushcloud-${BUILD_TYPE}-${VERSION}.apk"
    echo "✅ ${BUILD_TYPE^:0:1^^:s:#}${BUILD_TYPE:0:1} APK: $RELEASE_DIR/kushcloud-${BUILD_TYPE}-${VERSION}.apk"
else
    echo "⚠️  ${BUILD_TYPE^:0:1^^:s:#}${BUILD_TYPE:0:1} APK not found"
fi

cd ..

# Summary
echo ""
echo "📋 Build Summary"
echo "=================="
ls -lh "$RELEASE_DIR"
echo ""

echo "✅ ${BUILD_TYPE^:0:1^^:s:#}${BUILD_TYPE:0:1} build complete!"
```

### `build-release.sh` (Linux/macOS)

Automated script for creating full release bundles:

```bash
#!/bin/bash

# KushCloud Release Build Script
# Usage: ./build-release.sh [version]
# Example: ./build-release.sh v1.0.0

set -e

VERSION=${1:-"v1.0.0"}
RELEASE_DIR="./release-${VERSION}"

echo "🚀 Building KushCloud Release: ${VERSION}"
echo "========================================"

# Create release directory
mkdir -p "$RELEASE_DIR"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build web bundle
echo "🏗️  Building web bundle..."
npm run build
cp -r dist/* "$RELEASE_DIR/"
echo "✅ Web bundle: $RELEASE_DIR/"

# Build Android APKs
echo "🤖 Building Android APKs..."
npx cap sync android
cd android
chmod +x gradlew
./gradlew assembleDebug --no-daemon
./gradlew assembleRelease --no-daemon

# Copy APKs
echo "📱 Copying APKs..."
cp "app/build/outputs/apk/debug/app-debug.apk" "../${RELEASE_DIR}/kushcloud-debug-${VERSION}.apk"
cp "app/build/outputs/apk/release/app-release-unsigned.apk" "../${RELEASE_DIR}/kushcloud-release-unsigned-${VERSION}.apk"

echo "✅ Debug APK: $RELEASE_DIR/kushcloud-debug-${VERSION}.apk"
echo "✅ Release APK: $RELEASE_DIR/kushcloud-release-ungeed-${VERSION}.apk"

cd ..

# Summary
echo ""
echo "📋 Release Summary"
echo "=================="
ls -lh "$RELEASE_DIR"
echo ""
echo "✅ Release complete!"
echo ""
echo "📤 Next steps:"
echo "  1. git tag -a ${VERSION} -m \"Release ${VERSION}\""
echo "  2. git push origin ${VERSION}"
echo "  3. Create GitHub Release with files from ${RELEASE_DIR}"
```

### `build-release.bat` (Windows)

Windows equivalent of the release build script:

```cmd
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
echo   1. git tag -a %VERSION% -m "Release %VERSION%"
echo   2. git push origin %VERSION%
echo   3. Create GitHub Release with files from %RELEASE_DIR%
echo.
echo Release Documentation:
echo   - Detailed release notes: RELEASE_GUIDE.md
echo   - Changelog: CHANGELOG.md
echo   - Version history: RELEASE_v1.0.0.md

endlocal
```

## 🖥️ Deployment Platforms

### GitHub Actions

The project includes GitHub Actions for automated CI/CD:

#### `build-apk.yml`

- **Trigger**: Push to `main` branch, version tags, manual trigger
- **What happens**:
  - Builds Android APK in debug mode
  - Uploads APK as workflow artifact
  - Creates GitHub Release with version tag

#### `deploy-web.yml`

- **Trigger**: Push to `main` branch, manual trigger
- **What happens**:
  - Builds Vite bundle
  - Deploys to GitHub Pages
  - Invalidates CDN cache

### Cloud Providers

#### AWS Amplify

```yaml
# amplify.yml
appId: d1234567890abcdef
appName: kushcloud
region: us-east-1

frontend:
  frontendType: react
  buildCommand: npm run build
  startCommand: npm run preview
  environmentVariables:
    REACT_APP_API_URL: https://api.kushcloud.com
```

#### Netlify

```yaml
# netlify.toml
[[plugins]]
package = "@netlify/vite-plugin"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Vercel

```yaml
# vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/vite"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

## 🔧 Environment Configuration

### Local Development

```env
# .env.development
VITE_FIREBASE_API_KEY=your-api-key-dev
VITE_FIREEX_AUTH_DOMAIN=your-project-dev.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project-dev-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your-project-id-dev
VITE_FIREBASE_STORAGE_BUCKET=your-project-dev.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id-dev
VITE_FIREBASE_APP_ID=your-app-id-dev
```

### Production

```env
# .env.production
VITE_FIREBASE_API_KEY=your-api-key-prod
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Feature Flags

```env
# .env
VITE_ENABLE_FEATURE_X=true
VITE_ENABLE_FEATURE_Y=false
VITE_MAINTENANCE_MODE=false
VITE_RATE_LIMIT_ENABLED=true
```

## 📊 Monitoring & Analytics

### Google Analytics

```javascript
// Google Analytics 4
import { initializeApp, getAnalytics } from 'firebase/analytics';

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Track page views
const { onRouteChange } = await import('wouter');
onRouteChange((location) => {
  const { pathname } from location;
  gtag('config', 'GA_MEASUREMENT_ID', {
    page_path: pathname,
  });
});
```

### Sentry

```javascript
// Sentry error tracking
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'https://your-sentry-dsn@sentry.io/your-project-id',
  integrations: [Sentry.reactRouterBrowserTracingIntegration()],
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
```

## 🛡️ Security Configuration

### Firebase Security Rules

```json
{
  "rules_version": "2",
  "service_cloud_functions": {
    "httpsFunction": {
      "https://us-central1-your-project.cloudfunctions.net": "allow request"
    }
  },
  "databases": {
    "$(database)": {
      "leaderboards": {
        "$(period)": {
          "*": "read"
        }
      },
      "users": {
        "*": {
          "name": "read",
          "bestScore": "read",
          "totalGames": "read",
          "level": "read",
          "createdAt": "read",
          "updatedAt": "read"
        }
      }
    }
  }
}
```

### CORS Configuration

```nginx
# nginx.conf
server {
  listen 80;
  server_name your-domain.com;

  location / {
    proxy_pass http://localhost:5000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
  }
}
```

## 📱 Mobile App Configuration

### Android Manifest

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<manifest>
  <uses-permission android:name="android.permission.INTERNET" />
  <uses-permission android:name="android.permission.WAKE_LOCK" />
  <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
  <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

  <application
    android:allowBackup="true"
    android:icon="@mipmap/ic_launcher"
    android:label="@string/app_name"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:supportsRtl="true"
    android:theme="@style/AppTheme"
    android:hardwareAccelerated="true"
    android:largeHeap="true">

    <activity
      android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode|navigation|density"
      android:name=".MainActivity"
      android:label="@string/title_activity_main"
      android:theme="@style/AppTheme.NoActionBarLaunch"
      android:launchMode="singleTask"
      android:exported="true"
      android:screenOrientation="portrait"
      android:windowSoftInputMode="adjustResize">

      <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
      </intent-filter>

    </activity>

  </application>
</manifest>
```

### Capacitor Configuration

```typescript
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.linacre.kushcloud',
  appName: 'KushCloud',
  web: {
    path: 'index.html',
  },
  server: {
    url: 'https://lin4cre.github.io/CUSHCLOUD/',
    cleartext: false,
  },
  android: {
    packageName: 'com.linacre.kushcloud',
  },
};

export default config;
```

## 🔧 Backup & Recovery

### Database Backups

```bash
# Create daily database backup
sh -c 'cp -r /path/to/firebase-backup $(date +%Y-%m-%d)-backup.tar.gz'

# Create weekly database backup
sh -c 'tar -czf $(date +%Y-%W)-backup.tar.gz /path/to/firebase-backup'
```

### File Backups

```bash
# Create application data backup
cp -r ./dist ./android ./package.json ./package-lock.json ./backup-$(date +%Y-%m-%d)

# Create configuration backup
mkdir -p ./config-backup
tar -czf ./config-backup/config-$(date +%Y-%m-%d).tar.gz ./src/config ./capacitor.config.ts ./vite.config.ts
```

## 🚨 Troubleshooting

### Common Issues

#### Build Errors

**Problem**: "Cannot find module 'firebase'"

**Solution**: Ensure Firebase is installed:
```bash
npm install firebase@10.12.2
```

**Problem**: "EACCESSPER_ENOENT: Permission denied"

**Solution**: Check file permissions:
```bash
chmod +x gradlew
chmod +x build-apk-fast.sh
```

**Problem**: "ENOSYSNOTFOUND: System file: ssl-cert-sspi-commons-client509.crt"

**Solution**: Install OpenSSL:
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install -y openssl

# macOS
brew install openssl
```

#### Runtime Issues

**Problem**: "Firebase configuration missing"

**Solution**: Create .env file:
```bash
echo "VITE_FIREBASE_API_KEY=your-api-key" > .env
echo "VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com" >> .env
echo "VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com" >> .env
```

**Problem**: "Network connection failed"

**Solution**: Check internet connectivity:
```bash
ping -c 3 github.com
curl -I https://github.com
```

#### Browser Issues

**Problem**: "Content Security Policy"

**Solution**: Update CSP headers in server configuration

**Problem**: "Cannot read property of undefined"

**Solution**: Add error boundaries:
```javascript
componentDidCatch(error, errorInfo) {
  console.error('Application error:', error, errorInfo);
  this.setState({ hasError: true });
}
```

## 📊 Deployment Checklist

### Pre-Deployment
- [ ] Update version numbers in package.json and config files
- [ ] Create release notes and documentation
- [ ] Run all tests and ensure they pass
- [ ] Verify Firebase configuration
- [ ] Check build scripts for errors
- [ ] Update GitHub Actions workflows if needed

### During Deployment
- [ ] Build web application
- [ ] Build Android APKs
- [ ] Create release archives
- [ ] Update GitHub Releases
- [ ] Deploy to staging environment
- [ ] Run smoke tests

### Post-Deployment
- [ ] Monitor application performance
- [ ] Check error logs
- [ ] Verify user functionality
- [ ] Update documentation
- [ ] Clean up temporary files
- [ ] Archive build artifacts

## 🆘 Support & Contact

### Support Channels
- **GitHub Issues**: https://github.com/LIN4CRE/CUSHCLOUD/issues
- **GitHub Discussions**: https)