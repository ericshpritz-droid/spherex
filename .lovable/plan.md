
# Native iOS pass + 22-screen pixel-diff

Two parallel workstreams against `handoff-3.md` and `screens/01.png`–`22.png`. Keeping `_app.thread.$hash.tsx` and `_app.matches.tsx` as approved extensions per your call.

---

## Workstream A — Native iOS feel (touches every screen)

A1. **Foundation layer** (one-shot, then every screen benefits)
- New `src/sphere/native/` helpers:
  - `iosTransitions.ts` — push (slide-in-right, parallax back) + modal (slide-up) presets using framer-motion / CSS vars
  - `useSwipeBack.ts` — edge-swipe gesture → `router.history.back()` with rubber-band
  - `useKeyboardInset.ts` — Capacitor `Keyboard` plugin → CSS var `--kb-inset` for keyboard avoidance
  - `useStatusBar.ts` (extend existing) — per-route light/dark style
- Install `@capacitor/keyboard` if not already present
- Global CSS in `styles.css`: `-webkit-tap-highlight-color: transparent`, `touch-action: manipulation`, `user-select: none` on chrome, momentum scroll, disable double-tap zoom, safe-area utilities (`pt-safe`, `pb-safe`, `pb-tab-safe`)
- Wire `Haptics` (already present) into `<PrimaryButton>`, `<GhostButton>`, `<Chip>`, `Sheet` open/close, toast success/error — light tap on press, success on commit, warning on errors

A2. **Stack-style page transitions**
- Wrap `<Outlet />` in `_app.tsx` with an `AnimatePresence` stack that detects forward vs back and animates accordingly
- Modal routes (`/upgrade`, `/profile/delete`, `/sphere/add`) get the slide-up presentation style with backdrop dim + corner radius

A3. **Sheets → real iOS bottom sheets**
- Rebuild `Sheet.tsx` with drag-to-dismiss (rubber-band past threshold), velocity check, snap points, scrim tap-to-close, focus trap. Use framer-motion `drag="y"`.
- Apply to AddChoiceSheet (07), Upgrade (16), Delete (19), Received Compliment (13)

A4. **Keyboard + inputs (iOS-native feel)**
- Phone field (`PhoneField.tsx`): `inputMode="tel"`, `autocomplete="tel"`, `enterKeyHint="next"`
- Code field: `inputMode="numeric"`, `autocomplete="one-time-code"`, `pattern="\d{6}"` (already partly there)
- Manual phone, IG handle: correct `inputMode`, `autocapitalize`, `autocorrect="off"`, `spellcheck=false`
- Delete-confirm input: `autocapitalize="characters"`
- Every form scrolls focused field above keyboard via `--kb-inset`
- Back button on phone screen reveals iOS-style `< Back`

A5. **Status bar + safe areas**
- Light status bar on dark screens (welcome video bg, mutual reveal 17, explainer 05)
- Dark status bar everywhere else (paper bg)
- `pt-safe` on every screen header, `pb-tab-safe` above TabBar, `pb-safe` on bottom CTAs

A6. **Tab bar polish**
- Slight blur backdrop, hairline top, active state with subtle scale, haptic on switch

---

## Workstream B — Pixel-diff all 22 screens

For each screen NN: open `screens/NN.png`, screenshot our route at iPhone 14 viewport (390×844), diff, fix discrepancies in copy/spacing/typography/layout. Batch by flow:

- **Onboarding (01–05)** — welcome, phone, code, instagram, explainer modal
- **Add flow (06–11)** — home empty, add sheet, contacts, manual, confirm, intent
- **Compliment (12–14)** — composer, received modal, patience
- **Filled + payoff (15–17)** — home filled, upgrade, mutual
- **Account (18–20)** — profile, delete, invite
- **SMS (21–22)** — visual mockups only; we already chose to skip server impl

For each: capture a "before" screenshot, fix, capture "after". Adjust spacing, font weights, copy strings, eyebrow tracking, button text, intent card labels, etc. to match exactly. Color audit against the strict B&W palette + `#7A1F1F` for "Delete account" only.

---

## Order of execution

1. A1 + A4 (foundation + input/keyboard) — invisible plumbing, enables the rest
2. A3 (real bottom sheets) — biggest perceptible iOS upgrade
3. A2 (page transitions) — second biggest perceived upgrade
4. A5 + A6 (status bar, safe areas, tab bar) — polish
5. B (pixel-diff) — flow by flow, with screenshot captures so you can sanity-check

---

## Out of scope (intentional)

- SMS server impl (21/22) — needs Twilio creds, separate ask
- Stripe checkout wiring on /upgrade
- Mutual route `[id]` param + realtime — leaving `_app.match.tsx` as-is unless you flag it
- Removing `_app.thread.$hash.tsx` / `_app.matches.tsx` — you said keep

---

## Risks / things to confirm

- **Size**: this is ~25–35 file edits + new helpers + 22 visual passes. Realistically 2–3 turns of work. I'll do A1–A6 in this turn, then B in follow-ups so you can review the iOS feel before I touch every screen's pixels.
- **framer-motion**: already in the project. If not, I'll `bun add` it.
- **Capacitor Keyboard plugin**: may need install + native sync (you'd run `npx cap sync ios` outside the sandbox).

Sound right? Reply "go" and I'll start with A1.
