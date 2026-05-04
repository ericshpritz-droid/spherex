import type { CapacitorConfig } from "@capacitor/cli";

// Capacitor configuration for shipping Sphere as a native iOS app.
//
// Dev workflow:
//   1. `npm run build` (or `bun run build`) to produce `dist/`
//   2. `npx cap sync ios` to copy web assets + plugins into the iOS project
//   3. `npx cap open ios` to launch Xcode, then Run on a simulator/device
//
// During active development you can also point the WebView at the live Lovable
// preview URL by uncommenting the `server.url` block below — saves you from
// rebuilding for every change. Comment it out before producing release builds.
const config: CapacitorConfig = {
  appId: "app.lovable.sphere",
  appName: "Sphere",
  webDir: "dist",
  ios: {
    // "never" stops the WebView from auto-padding for the status bar; our CSS
    // already handles safe areas.
    contentInset: "never",
    limitsNavigationsToAppBoundDomains: false,
    // Disable the rubber-band overscroll bounce so the app feels native, not
    // like a Safari tab.
    scrollEnabled: false,
    // Match the app background so there's no white flash on launch / during
    // navigation.
    backgroundColor: "#08041C",
    // Hide the WKWebView scroll indicators.
    preferredContentMode: "mobile",
  },
  // SSR + server functions require the live server. Keep pointing at prod.
  server: {
    url: "https://mysphere.love",
    cleartext: false,
    iosScheme: "https",
  },
  backgroundColor: "#08041C",
};

export default config;
