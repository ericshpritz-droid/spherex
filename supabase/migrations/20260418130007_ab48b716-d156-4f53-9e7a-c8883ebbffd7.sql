create table if not exists public.invite_conversions (
  id uuid primary key default gen_random_uuid(),
  inviter_phone_hash text not null,
  invitee_phone_hash text not null,
  invitee_id uuid not null,
  created_at timestamptz not null default now(),
  unique (inviter_phone_hash, invitee_phone_hash)
);

create index if not exists invite_conversions_inviter_idx
  on public.invite_conversions (inviter_phone_hash, created_at desc);

alter table public.invite_conversions enable row level security;

-- Inviters see rows whose inviter_phone_hash matches their own phone hash.
-- We compare via the matches view's user_id ↔ phone-hash relation isn't available,
-- so instead we check via the adds table: a row exists where the invitee added
-- the inviter (which consumeInvite always creates), AND the current user is that
-- invitee. Simpler: allow read when there exists any add row with adder_id = auth.uid()
-- and adder_phone_hash = invitee_phone_hash AND added_phone_hash = inviter_phone_hash.
-- That's effectively "I am the invitee" — wrong direction. We want "I am the inviter".
--
-- The clean approach: store inviter's user_id is unknown at insert time (we only
-- have their hash). So gate SELECT on "the inviter_phone_hash equals the hash of
-- my own phone". We expose that via a SECURITY DEFINER helper that looks up the
-- caller's phone from auth.users and compares the hash. To keep the DB free of
-- the pepper, we instead rely on the existing `adds` rows: the inviter always
-- has at least one row in `adds` where adder_id = inviter and adder_phone_hash
-- = inviter_phone_hash. So: I can read a conversion row iff there exists an
-- adds row with adder_id = auth.uid() and adder_phone_hash = inviter_phone_hash.
create policy "Inviters can read their own conversions"
on public.invite_conversions
for select
to authenticated
using (
  exists (
    select 1 from public.adds
    where adds.adder_id = auth.uid()
      and adds.adder_phone_hash = invite_conversions.inviter_phone_hash
    limit 1
  )
);

-- No client-side INSERT/UPDATE/DELETE policies: only the server (service role)
-- writes to this table from the consumeInvite handler.