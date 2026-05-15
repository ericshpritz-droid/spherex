import type { CapacitorConfig } from "@capacitor/cli";

// Capacitor configuration for shipping Sphere as a native iOS app.
const config: CapacitorConfig = {
  appId: "app.lovable.sphere",
  appName: "Sphere",
  webDir: "dist",
  ios: {
    contentInset: "never",
    limitsNavigationsToAppBoundDomains: false,
    // Kill WebView rubber-band overscroll bounce.
    scrollEnabled: false,
    backgroundColor: "#08041C",
    preferredContentMode: "mobile",
    // Don't let long-press selection / callout interrupt taps.
    allowsLinkPreview: false,
    handleApplicationNotifications: false,
  },
  server: {
    url: "https://mysphere.love",
    cleartext: false,
    iosScheme: "https",
  },
  backgroundColor: "#08041C",
  plugins: {
    Keyboard: {
      // "none" = WebView stays full-screen; we lift CTAs ourselves via --kb-inset.
      // Avoids double-shift when both iOS and our CSS pad for the keyboard.
      resize: "none",
      style: "DARK",
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#08041C",
      overlaysWebView: true,
    },
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: "#08041C",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true,
      fadeOutDuration: 250,
    },
  },
};

export default config;
