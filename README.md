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
