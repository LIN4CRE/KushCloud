import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.linacre.kushcloud',
  appName: 'KushCloud',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    loggingBehavior: 'none',
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'APK',
    },
  },
  ios: {
    // iOS-specific configuration for feature parity with Android
    backgroundColor: '#064e3b',
    preferredContentMode: 'mobile',
    // Note: WKWebView limitations:
    //   - localStorage is limited to ~5MB (sufficient for game saves)
    //   - No WebAudio autoplay without user gesture (handled by audio.resume())
    //   - No vibration API (cosmetic only, not used)
    //   - Canvas performance may differ; test on target devices
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#064e3b',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
  },
};

export default config;