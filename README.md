# SphereX

A privacy-first mutual-match messaging app. Add someone by phone number — if they add you back, you become a mutual match and can exchange short emoji-only messages in real time.

Live app: [spherex.lovable.app](https://spherex.lovable.app)

---

## ✨ Features

- **Phone-based mutual matching** — add contacts by phone; matches happen only when both sides add each other.
- **Privacy by design** — raw phone numbers are never stored. Every phone is hashed server-side with a secret pepper before it touches the database.
- **Emoji-only messaging** — messages are limited to 8 characters and validated as emoji at the database layer.
- **Realtime updates** — new matches and incoming messages stream in via Supabase Realtime, scoped per-user with RLS.
- **iOS-ready** — wrapped with Capacitor for native iOS builds, with native contact import and haptics.
- **Phone OTP authentication** — sign-in via SMS one-time code (Twilio).

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Framework | [TanStack Start](https://tanstack.com/start) (React 19 + Vite 7, SSR on Cloudflare Workers) |
| Routing | TanStack Router (file-based) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| State / Data | TanStack Query |
| Backend | [Lovable Cloud](https://docs.lovable.dev/features/cloud) (Supabase: Postgres, Auth, Realtime, Edge Functions) |
| Native shell | Capacitor 8 (iOS) |
| SMS / OTP | Twilio (via Supabase Auth) |
| Language | TypeScript (strict) |

---

## 🏗️ Architecture

### Privacy model

The app's core guarantee is that **the server never stores raw phone numbers**.

1. The client collects a phone (manual entry or native contact picker).
2. It calls a server function over RPC with a Bearer token.
3. The server normalizes to E.164, then computes `SHA-256(PHONE_PEPPER + "+" + digits)`.
4. Only the hash is written to `adds`, `messages`, and `invite_conversions`.

A user's own phone hash is derived inside Postgres via `current_user_phone_hash()`, which reads the `phone` claim from the JWT — meaning RLS policies cannot be tricked by a client passing a different hash.

### Mutual-match logic

A pair `(A, B)` is mutual iff both `(A → B)` and `(B → A)` rows exist in `adds`. The `is_mutual_match(_other text)` SECURITY DEFINER function checks this against the caller's JWT-derived hash, so a user can only ever ask "am I mutual with X?", never "is A mutual with B?".

### Realtime channels

Each user subscribes to two private channels named with their full phone hash:

- `adds-for-<hash>` — fires when someone adds them (potential new match)
- `msgs-for-<hash>` — fires when a new message arrives

A Realtime RLS policy on `realtime.messages` ensures a session can only join channels whose topic matches its own JWT-derived hash.

---

## 📁 Project Structure

```
src/
├── routes/                    # TanStack Router file-based routes
│   ├── __root.tsx             # Root shell + providers
│   ├── _app.tsx               # Authenticated layout
│   ├── _app.home.tsx          # Mutuals + messaging
│   ├── _app.add.tsx           # Add a contact
│   ├── _app.contacts.tsx      # Native contact picker
│   ├── _app.thread.$hash.tsx  # 1:1 emoji thread
│   ├── _app.profile.tsx       # Profile + invite stats
│   ├── _app.phone.tsx         # Phone sign-in
│   ├── _app.code.tsx          # OTP verification
│   └── i.$hash.tsx            # Public invite landing page
├── mutual/
│   ├── AppContext.tsx         # Global state, realtime subscriptions
│   ├── auth.ts                # Phone normalization (E.164)
│   ├── dataApi.ts             # Client-side data API
│   ├── dataApi.functions.ts   # Server functions (hashing, queries)
│   ├── dataApi.rpc.ts         # Auth-bearer RPC wrappers
│   ├── messages.functions.ts  # Send / load messages
│   ├── invites.functions.ts   # Invite conversion tracking
│   └── native/                # Capacitor native bridges
├── integrations/
│   ├── supabase/              # Client + server Supabase clients, auth middleware
│   └── phone/hash.server.ts   # Server-only phone hashing (uses PHONE_PEPPER)
└── components/ui/             # shadcn/ui primitives

supabase/
├── config.toml
└── migrations/                # SQL migrations (schema, RLS, functions)

capacitor.config.ts            # iOS native config
```

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 20+
- A Lovable Cloud / Supabase project (auto-provisioned if you fork on Lovable)

### Install & run

```bash
bun install
bun run dev
```

The app runs at `http://localhost:8080`.

### Environment variables

`.env` is auto-managed by Lovable Cloud and contains:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
```

Server-side secrets (managed in Lovable Cloud → Backend → Secrets):

| Secret | Purpose |
|---|---|
| `SUPABASE_URL` | Server-side Supabase URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side admin client |
| `PHONE_PEPPER` | Secret pepper used when hashing phones (≥16 chars) |
| `TWILIO_API_KEY` | Phone OTP delivery (via Twilio connector) |
| `LOVABLE_API_KEY` | Lovable AI Gateway (reserved for future features) |

### Database pepper (one-time setup)

The Postgres function `current_user_phone_hash()` also needs the pepper. Run this once in the Supabase SQL editor:

```sql
ALTER DATABASE postgres SET app.phone_pepper = '<same value as PHONE_PEPPER>';
```

The server pepper and DB pepper **must match**, otherwise client-uploaded hashes won't match RLS-derived hashes and messaging will silently fail.

---

## 📜 Scripts

```bash
bun run dev          # Start Vite dev server
bun run build        # Production build
bun run preview      # Preview production build locally
bun run lint         # ESLint
bun run format       # Prettier
```

---

## 📱 iOS Build (Capacitor)

```bash
bun run build
bunx cap sync ios
bunx cap open ios
```

Then build & archive in Xcode. The bundle ID and app name live in `capacitor.config.ts`.

For TestFlight & App Store submission, you'll also need:

- Apple Developer account
- App Store Connect entry with privacy nutrition labels (Contacts: linked to identity, used for app functionality)
- Phone-number permission usage strings already configured in the Capacitor project

---

## 🔐 Security Model

| Concern | Mitigation |
|---|---|
| Raw phones in DB | Never stored — only `SHA-256(pepper + e164)` |
| Cross-user data access | RLS on every table; `current_user_phone_hash()` derives identity from JWT |
| Realtime channel hijacking | RLS on `realtime.messages` matches full hash, no prefix collision |
| Caller spoofing in `is_mutual_match` | Function takes only the *other* hash; "self" comes from JWT |
| Message spam | DB trigger enforces ≤8 chars, emoji-only |
| Privilege escalation | Roles stored in separate `user_roles` table, checked via `has_role()` SECURITY DEFINER |

---

## 🧪 Database Schema (high level)

- `adds` — one row per "I added this hash". Pair of rows in both directions = mutual match.
- `matches` — view that surfaces mutual pairs to the current user.
- `messages` — emoji-only messages between mutuals.
- `invite_conversions` — tracks signups that came through a shared invite link.
- `user_roles` — admin/user role grants.
- `app_settings` — global toggles (e.g. `test_mode`).

See `supabase/migrations/` for the full schema.

---

## 🤝 Contributing

This project is developed on [Lovable](https://lovable.dev) with bidirectional GitHub sync — pushes to `main` flow back into the Lovable editor and vice versa.

To work locally:

1. Clone the repo
2. `bun install && bun run dev`
3. Make changes on a branch
4. Open a PR — once merged to `main`, Lovable picks it up automatically

---

## 📄 License

Private / proprietary. All rights reserved.
