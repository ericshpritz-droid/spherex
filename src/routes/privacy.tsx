import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Sphere" },
      { name: "description", content: "How Sphere collects, hashes, and protects your data." },
      { property: "og:title", content: "Privacy Policy — Sphere" },
      { property: "og:description", content: "How Sphere collects, hashes, and protects your data." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-ink text-white">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <Link to="/" className="text-fg-55 text-[14px]">← Back</Link>
        <h1 className="mt-4 text-3xl font-bold tracking-sora-display">Privacy Policy</h1>
        <p className="mt-1 text-fg-55 text-[13px]">Last updated: April 18, 2026</p>

        <Section title="The short version">
          Your login number is used only to send you a sign-in code. Phone numbers you add are one-way hashed on our servers with a secret key (a "pepper") before they touch our database — even our admins can't read them. Matches happen by comparing hashes, never raw numbers. We don't sell your data, ever.
        </Section>

        <Section title="1. What we collect">
          <strong>Your phone number</strong>, used solely to send your one-time sign-in code and to identify your account. <br/>
          <strong>Hashed contacts</strong> you add — stored as opaque codes (SHA-256 with a server-side secret pepper). The raw numbers never reach our database. <br/>
          <strong>Basic technical data</strong> (timestamps, error logs) needed to operate the service.
        </Section>

        <Section title="2. What we don't collect">
          We don't collect your address book in bulk, your location, your messages, your contacts' names, or any social-graph data beyond the specific numbers you choose to add one at a time.
        </Section>

        <Section title="3. How hashing works">
          When you add a phone number, our server combines it with a secret key (the "pepper"), runs SHA-256, and stores only the resulting hex digest. Without the pepper — which is held only as a runtime secret — no one (including us) can reverse a hash back to a phone number. This means a database leak alone would not reveal who anyone has added.
        </Section>

        <Section title="4. How matches work">
          A match is created when the hash of a number you added equals the hash of the account holder's own phone number, AND they have done the same with yours. The matches view returns only opaque hashes; your device maps those hashes back to readable numbers using the local list of phones you yourself uploaded. We never reveal another user's raw number to you.
        </Section>

        <Section title="5. Who can see your data">
          Other users can never read your adds or your matches — every row is protected by per-user row-level security in the database. Sphere staff have administrative database access for operational reasons but cannot read who you've added because contact data is stored only as peppered hashes.
        </Section>

        <Section title="6. Service providers">
          We use a backend platform (Supabase, hosted on infrastructure operated by them and their cloud provider) to store account and hashed-contact data, and an SMS provider to deliver login codes. These providers process data on our behalf under their own privacy commitments.
        </Section>

        <Section title="7. Retention and deletion">
          We keep your account and hashed adds for as long as your account exists. You can delete your account at any time from the profile screen; doing so removes your account record and all hashed adds linked to it. Backups roll off within 30 days.
        </Section>

        <Section title="8. Children">
          Sphere is not intended for users under 17, and we do not knowingly collect data from children.
        </Section>

        <Section title="9. Your rights">
          Depending on where you live (e.g., GDPR / CCPA jurisdictions), you may have rights to access, correct, port, or delete your personal data. Email <a className="underline" href="mailto:privacy@sphere.app">privacy@sphere.app</a> and we'll respond within 30 days.
        </Section>

        <Section title="10. Changes">
          If we materially change this policy we'll notify you in the app before the changes take effect.
        </Section>

        <Section title="11. Contact">
          Questions or requests? Email <a className="underline" href="mailto:privacy@sphere.app">privacy@sphere.app</a>.
        </Section>

        <div className="mt-10 text-fg-45 text-[13px]">
          See also our <Link to="/terms" className="underline">Terms of Service</Link>.
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-[18px] font-semibold">{title}</h2>
      <div className="mt-2 text-[15px] text-fg-70" style={{ lineHeight: 1.6 }}>{children}</div>
    </section>
  );
}
