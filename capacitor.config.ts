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
    contentInset: "always",
    // Tell the WebView the safe-area is handled by our CSS (we already pad
    // 64px from the top on the home header).
    limitsNavigationsToAppBoundDomains: false,
  },
  // NOTE: For TestFlight / App Store builds the WebView must load bundled
  // assets from `dist/` — do NOT add a `server.url` block here. If you need
  // hot-reload against the Lovable sandbox during development, temporarily
  // uncomment the block below, run `npx cap sync ios`, and remove it again
  // before producing a release build.
  // server: {
  //   url: "https://id-preview--560b357e-2c14-4df9-ba8b-4774650aac2d.lovable.app",
  //   cleartext: true,
  // },
};

export default config;
