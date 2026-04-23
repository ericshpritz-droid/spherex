# SphereX

SphereX is a privacy-first social app built around mutual intent: add someone by phone number, and only when they add you back do you unlock the connection.

- **Live app:** [spherex.lovable.app](https://spherex.lovable.app)
- **Platform:** Web + Capacitor iOS shell
- **Status:** Active Lovable project with GitHub sync and TestFlight automation

## What the app does

SphereX focuses on lightweight, private interactions:

- add people by phone number
- reveal connections only when interest is mutual
- support onboarding, invites, and match flows
- use phone-based authentication
- support native iOS capabilities like contacts and haptics

## Tech stack

| Layer | Stack |
|---|---|
| App framework | TanStack Start + React 19 |
| Build tooling | Vite 7 |
| Routing | TanStack Router |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Data/auth/backend | Lovable Cloud |
| Native shell | Capacitor 8 for iOS |
| Language | TypeScript + JSX |

## Key project areas

```text
src/
├── routes/                  # App routes and page entry points
├── mutual/                  # Core product flows, screens, data logic, native helpers
├── components/ui/           # Shared UI primitives
├── integrations/            # Backend and server-side integrations
├── hooks/                   # Shared React hooks
└── styles.css               # Global design tokens and styling

public/                      # Static assets, favicon, manifest
scripts/                     # Validation and workflow helper scripts
supabase/                    # Backend config and migrations
.github/workflows/           # CI/TestFlight automation
```

## Local development

### Prerequisites

- Bun recommended
- Node.js 20+
- Lovable Cloud connected for backend-backed flows

### Install

```bash
bun install
```

### Run the app

```bash
bun run dev
```

### Useful scripts

```bash
bun run dev         # Start local dev server
bun run build       # Run phone-flow check, then production build
bun run build:dev   # Development-mode build
bun run preview     # Preview the production build locally
bun run lint        # Lint the codebase
bun run format      # Format files with Prettier
```

## Backend and secrets

This project uses Lovable Cloud for backend services, authentication, and data storage.

Runtime environment values are managed by the platform. Sensitive values such as phone hashing secrets and provider credentials should be stored as project secrets rather than committed to the repo.

## iOS workflow

The project is configured for Capacitor iOS builds and TestFlight delivery.

Typical local iOS flow:

```bash
bun run build
bunx cap sync ios
bunx cap open ios
```

The GitHub Actions workflow handles automated TestFlight packaging and now includes:

- frontend-focused path filters
- iOS workspace and scheme preflight checks
- signing asset validation before `xcodebuild`
- retry logic for archive, export, and upload steps
- automatic IPA discovery
- uploaded debug artifacts including logs, dSYMs, and symbolication details

### iOS GitHub Actions workflow, step by step

The iOS workflow is designed to run when the app UI changes in ways that affect the shipped mobile build.

#### 1. What triggers the workflow

The workflow starts in two cases:

- **Push to `main`** when UI-relevant files change, such as routes, shared components, hooks, styles, public assets, Capacitor config, Vite config, and related frontend build files
- **Manual run** through `workflow_dispatch`

This keeps TestFlight builds focused on changes that can actually affect the app users install.

#### 2. Environment and dependency setup

Once triggered, GitHub Actions prepares the macOS build runner by:

1. checking out the repository
2. installing Bun and Node.js
3. creating temporary directories for logs and exported build outputs
4. verifying that required Apple signing and App Store Connect secrets are present
5. installing web dependencies with `bun install --frozen-lockfile`

#### 3. Web app build

Before the native iOS archive is created, the workflow builds the frontend:

1. runs the production web build
2. ensures the iOS Capacitor platform exists
3. syncs the latest web assets into the iOS project
4. installs CocoaPods dependencies for the native workspace

This guarantees the native archive includes the latest shipped web code.

#### 4. iOS preflight validation

The workflow fails early if the native project is not ready. It checks for:

- the required Xcode workspace at `ios/App/App.xcworkspace`
- the expected Xcode scheme name

If either is missing, it stops before expensive build steps begin and saves the Xcode inspection output in the workflow logs.

#### 5. Signing asset preparation

The workflow then prepares release signing materials by:

1. decoding the distribution certificate and provisioning profile from GitHub secrets
2. writing the App Store Connect authentication key to a temporary file
3. creating and unlocking a temporary keychain
4. importing the signing certificate into that keychain
5. installing the provisioning profile into the macOS runner
6. extracting profile metadata such as the profile name for later archive/export steps

#### 6. Signing validation before build

Before `xcodebuild` runs, the workflow validates that signing is usable:

- confirms at least one valid code-signing identity was imported
- inspects the provisioning profile
- checks that the profile team ID matches the configured Apple team
- checks that the profile’s application identifier matches the bundle identifier, including valid wildcard cases

This catches common signing mistakes early, with clear logs instead of a later archive failure.

#### 7. Archive step with retries

The workflow archives the app with `xcodebuild archive` using manual signing settings.

- it archives the app into a temporary `.xcarchive`
- if the archive fails due to a transient issue, it retries up to 3 times
- each retry uses a short incremental delay
- logs from every attempt are appended to `archive.log`

#### 8. Export IPA with retries

After a successful archive, the workflow exports the installable IPA:

1. creates an export options plist for App Store distribution
2. runs `xcodebuild -exportArchive`
3. retries export up to 3 times if needed
4. saves export diagnostics to `export.log`

#### 9. TestFlight upload

Once the IPA is available, the workflow uploads it to TestFlight using App Store Connect credentials.

- it verifies the IPA exists before upload starts
- it retries the upload up to 3 times for transient App Store Connect failures
- upload activity is captured in `testflight-upload.log`

#### 10. dSYM and symbolication artifacts

To improve crash debugging after TestFlight releases, the workflow also collects symbol files from the archive:

1. copies generated `.dSYM` bundles out of the `.xcarchive`
2. zips them for easy download
3. records UUIDs and related symbolication information in a dedicated log

These files make it much easier to match production crash reports to the exact build symbols.

#### 11. Uploaded artifacts

At the end of the run, the workflow uploads a debug artifact bundle containing the most useful investigation files, including:

- iOS build logs
- exported IPA
- zipped dSYMs
- symbolication logs

That means even failed or flaky runs leave behind enough information to diagnose signing issues, export problems, upload failures, and TestFlight crash symbolication needs.

## GitHub sync

This repository is connected to Lovable with bidirectional sync:

- changes made in Lovable sync to GitHub
- changes pushed to GitHub sync back into Lovable

That makes GitHub the right place for collaboration, PR review, Actions, and release workflow history.

## Notes for contributors

- keep route changes inside `src/routes/`
- keep reusable UI in `src/components/` or `src/components/ui/`
- avoid editing generated backend client files
- prefer small, focused changes because this project syncs continuously between Lovable and GitHub

## License

Private / proprietary. All rights reserved.
