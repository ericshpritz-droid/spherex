# RLS Helpers & EXECUTE Grants

This document explains the `SECURITY DEFINER` helper functions used by our
Row-Level Security (RLS) policies and triggers, why we revoked `EXECUTE`
from the `anon` (and where applicable, `public`) role, and why the grants
that remain are safe.

## The helpers

| Function | Purpose | Used by |
|---|---|---|
| `public.current_user_phone_hash()` | Returns the peppered SHA-256 hash of the JWT-bound phone number for the calling user. | RLS on `compliments`, `messages`, `adds` (indirectly via `is_mutual_match`) |
| `public.has_role(_user_id uuid, _role app_role)` | Returns whether a user has a given role. Lives in a separate `user_roles` table to prevent privilege-escalation via profile updates. | RLS on `user_roles` and any admin-gated table |
| `public.is_mutual_match(_other text)` | Returns true when both sides have added each other (by phone hash). | RLS on `messages` |
| `public.handle_new_user_admin()` | Trigger-only. Auto-grants the seed admin role on signup. | `AFTER INSERT` trigger on `auth.users` |
| `public.validate_message_body()` | Trigger-only. Enforces emoji-only, ≤8-char message bodies. | `BEFORE INSERT/UPDATE` trigger on `messages` |
| `public.update_updated_at_column_generic()` | Trigger-only. Maintains `updated_at`. | `BEFORE UPDATE` triggers |

All helpers are declared `SECURITY DEFINER` with `SET search_path = public`
(plus `extensions` where needed). They run with the **owner's** privileges,
not the invoker's, and the locked `search_path` prevents schema-shadowing
attacks (CVE-class: search_path hijack).

## Why we revoked EXECUTE

By default, Postgres grants `EXECUTE` on new functions to `PUBLIC`. For a
`SECURITY DEFINER` function, that means **any** role that can reach the
database — including `anon` (unauthenticated REST/PostgREST clients) — can
call it and obtain the owner's privileges within that function body.

We revoked `EXECUTE` from `PUBLIC` and `anon` so that:

1. Unauthenticated clients cannot probe `has_role(<uuid>, 'admin')` to
   enumerate admins.
2. Unauthenticated clients cannot call `is_mutual_match(<hash>)` to confirm
   whether two phone hashes have matched (information disclosure).
3. `current_user_phone_hash()` is meaningless without a valid JWT, but
   removing the grant removes it from the PostgREST RPC surface area.
4. Trigger-only functions (`handle_new_user_admin`,
   `validate_message_body`, `update_updated_at_column_generic`) have **no**
   legitimate caller — they only fire from trigger context, which does not
   require `EXECUTE` on the invoker.

## Why the remaining grants are safe

`EXECUTE` is granted to `authenticated` on:

- `current_user_phone_hash()`
- `has_role(uuid, app_role)`
- `is_mutual_match(text)`

These three grants are **required** because Postgres evaluates function
permissions in RLS expressions against the **invoking role**, not the
function owner. Without the grant, a signed-in user querying their own
`compliments`, `messages`, or `user_roles` row hits
`permission denied for function ...` before RLS even runs.

The grants are safe because each helper is self-scoping:

- `current_user_phone_hash()` derives its input from `auth.jwt()`. A user
  can only ever resolve to **their own** hash; they cannot pass an
  argument to impersonate someone else.
- `has_role(_user_id, _role)` is a boolean read against `user_roles`. The
  worst a user can do is check whether a given UUID has a given role.
  No write path exists, and `user_roles` itself has admin-only write RLS.
- `is_mutual_match(_other)` only returns true when the **caller's own**
  hash (from `current_user_phone_hash()`) is on both sides of the `adds`
  pair. A user cannot use it to learn about matches they are not part of.

## How triggers stay safe without EXECUTE

Trigger functions execute in the trigger's privilege context, not the
client session's. Postgres does **not** check `EXECUTE` on the function
when firing a trigger. That is why we can fully revoke `EXECUTE` on
`handle_new_user_admin`, `validate_message_body`, and
`update_updated_at_column_generic` without breaking inserts/updates —
the trigger machinery owns the call.

## Linter warnings (intentional)

Supabase's linter raises `0029` (Function Search Path / SECURITY DEFINER)
on the three helpers granted to `authenticated`. These are acknowledged
and intentional — see `mem://security` and the migration
`20260514151910_*.sql` which restored the grants after a previous overly
aggressive revoke broke user reads.

## Change checklist

When adding a new `SECURITY DEFINER` helper:

1. `SET search_path = public` (and `extensions` if needed) in the
   function definition.
2. `REVOKE ALL ON FUNCTION public.<name>(...) FROM PUBLIC, anon;`
3. Grant `EXECUTE` to `authenticated` **only if** an RLS policy or
   client RPC needs to call it. Trigger-only helpers get no grant.
4. Document the new helper in the table at the top of this file.
