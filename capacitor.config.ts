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
      // "native" pushes the WebView up like a real iOS app instead of resizing.
      resize: "native",
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
    },
  },
};

export default config;
