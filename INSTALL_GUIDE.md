# 🚀 KushCloud v1.0.0 Release — Download & Install Guide

**Status**: ✅ **PRODUCTION READY**

---

## 📱 Download & Install for Android

### Direct Download
- **[kushcloud-v1.6.2-debug.apk](https://github.com/LIN4CRE/KushCloud/releases/download/v1.6.2/kushcloud-v1.6.2-debug.apk)** — For testing on Android devices
- **[kushcloud-v1.6.2-release-unsigned.apk](https://github.com/LIN4CRE/KushCloud/releases/download/v1.6.2/kushcloud-v1.6.2-release-unsigned.apk)** — For distribution (app stores)

### Browser Play
- **[Play in Browser](https://lin4cre.github.io/KushCloud/)** — No install needed, instant play

---

## 🍏 How to Install on iOS (iPhone/iPad)

### Progressive Web App (PWA) Method
KushCloud is optimized for iOS via Safari's "Add to Home Screen" feature.

1. Open **Safari** on your iOS device.
2. Navigate to **https://lin4cre.github.io/KushCloud/**
3. Tap the **Share** button at the bottom of the screen.
4. Select **Add to Home Screen**.
5. Tap **Add**.
6. The KushCloud icon will appear on your home screen. Open it for a native-like, full-screen experience.

### Developer Build (Xcode)
If you wish to build the native iOS app yourself:
1. Clone the repository on a Mac.
2. Run `npm install` and `npm run build`.
3. Run `npx cap sync ios`.
4. Run `cd ios/App && pod install`.
5. Open `ios/App/App.xcworkspace` in Xcode.
6. Connect your device and click **Run**.

---

## 📲 How to Install on Android

### Method 1: Direct Installation (Easiest)

1. Download the APK file to your Android device
2. Open the file manager and navigate to Downloads
3. Tap the `.apk` file
4. Tap **"Install"** (if prompted, enable "Unknown Sources" in Settings)
5. Wait for installation to complete
6. Tap **"Open"** or find "KushCloud" in your app drawer

### Method 2: ADB Installation (Developers)

If you have Android SDK/ADB installed:

```bash
adb install kushcloud-v1.0.0-debug.apk
# Wait for "Success" message
# Launch app from device
```

### Method 3: File Transfer + Install

1. Connect Android device to computer via USB
2. Copy `.apk` file to device storage
3. Disconnect device
4. Open file manager on device
5. Locate and tap `.apk` file
6. Tap **"Install"**

---

## ⚙️ System Requirements

- **Android Version**: 8.0 or higher
- **Storage**: ~50 MB free space
- **RAM**: 512 MB minimum (1+ GB recommended)
- **Permissions**: None required (game is offline)

---

## 🎮 First Launch

When you first open KushCloud:

1. **Splash screen** (~1.5 seconds with logo)
2. **Tutorial screen** — Learn controls
3. **Main menu** — Start playing!

**Controls**:
- Tap to flap
- Click (desktop)
- Space bar or ↑ arrow key
- Pause button (top-left in-game)

---

## 🛠️ Troubleshooting

### "Unknown app" / "Unsafe app" Warning

**Issue**: Android warns the app is from unknown source

**Solution**:
1. Go to Settings → Security (or Safety)
2. Enable "Unknown Sources" or "Install Unknown Apps"
3. Grant permission to file manager
4. Install APK again

### Installation Fails

**Issue**: "App not installed"

**Solution**:
1. Check storage space (need ~50 MB free)
2. Try different APK version (debug vs release)
3. Uninstall older version first: `adb uninstall com.linacre.kushcloud`
4. Clear Play Store cache: Settings → Apps → Play Store → Storage → Clear Cache

### App Crashes on Launch

**Issue**: "KushCloud keeps stopping"

**Solution**:
1. Restart device
2. Clear app data: Settings → Apps → KushCloud → Storage → Clear Data
3. Reinstall the APK
4. Check Android version (need 8.0+)

### Permission Denied

**Issue**: Cannot install via file manager

**Solution**:
1. Use ADB instead: `adb install kushcloud-v1.0.0-debug.apk`
2. Or grant file manager permissions in Settings

---

## 🚀 Building Your Own APK

To build the APK yourself (requires development tools):

### Prerequisites
- Node.js 20+
- npm 9+
- Java Development Kit (JDK) 17+
- Android SDK 34
- Android Studio (recommended)

### Build Steps

**Windows**:
```cmd
build-apk-fast.bat debug
```

**macOS/Linux**:
```bash
chmod +x build-apk-fast.sh
./build-apk-fast.sh debug
```

Output: `release-builds/KushCloud-v1.0.0-debug.apk`

---

## 📤 Distributing to App Stores

### Google Play Store

Requires:
1. **Signed APK** (use your signing keystore)
2. **Google Play Developer account** ($25 one-time)
3. **App privacy policy**
4. **Store listing** (screenshots, description, etc)

Once ready, upload to Google Play Console.

### F-Droid (Open Source App Store)

Requires:
1. Public GitHub repository (✅ done)
2. Signed APK (use your keystore)
3. `fastlane` metadata (for app store listing)

Submit to F-Droid build server for automated builds.

### Samsung Galaxy Store

Similar to Google Play Store. Requires signed APK + developer account.

---

## 💾 Data & Saves

**Save Location**: Device storage (localStorage for web)

**Save Data Includes**:
- Score history
- Coins and XP
- Unlocked skins
- Achievements
- Leaderboard entries (local)

**Backup**: Data is stored on-device; backup via:
```bash
adb backup com.linacre.kushcloud -f kushcloud-backup.ab
```

**Restore**: 
```bash
adb restore kushcloud-backup.ab
```

---

## 🔄 Updates

### Check for Updates

The game will prompt when a new version is available. Or check:
- **GitHub Releases**: https://github.com/LIN4CRE/KushCloud/releases
- **Web Version**: https://lin4cre.github.io/KushCloud/ (auto-updates)

### Manual Update

1. Download new APK
2. Install (will overwrite old version)
3. Your saves will be preserved

---

## 📞 Support

### Report Bugs
- [GitHub Issues](https://github.com/LIN4CRE/KushCloud/issues/new)
- Include: Device model, Android version, error message, screenshots

### Feature Requests
- [GitHub Discussions](https://github.com/LIN4CRE/KushCloud/discussions)

### Security Issues
- See [SECURITY.md](https://github.com/LIN4CRE/KushCloud/blob/main/SECURITY.md)

---

## 📋 Release Notes

### v1.0.0 (Current)

**Initial Production Release**

✨ **Features**:
- Full Flappy Bird-style game engine
- Custom canvas physics & collision
- Procedural audio synthesis
- Progression system (XP, coins, achievements)
- Shop with cosmetic skins
- Daily missions & leaderboards
- Accessibility features (reduced motion, high contrast)
- Android APK + Web versions
- Score validation (anti-cheat)

🐛 **Known Issues**: None reported

📱 **Tested On**:
- Android 8.0 (Samsung Galaxy S7)
- Android 10+ (Various devices)
- Chrome, Firefox, Safari (web)
- Edge mobile browser

---

## 🎮 Quick Game Tips

1. **Practice the rhythm** — Tap to a beat for consistent flaps
2. **Watch for leaves** — Collect 🍁 for coins
3. **Score combos** — Graze jar edges for multipliers
4. **Spend coins** — Unlock skins in the shop (cosmetic only)
5. **Daily login** — Earn streak bonuses
6. **Pause & breathe** — Use pause button to take breaks

---

## 📄 License

**MIT** — Free to download, play, and distribute

---

**Enjoy KushCloud! 🌿**

*Questions?* Open an issue or join the discussion on GitHub.
