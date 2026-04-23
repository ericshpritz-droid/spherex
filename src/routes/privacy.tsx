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
          <strong>Lightweight message data</strong> — the short emoji-only messages you choose to send, along with delivery metadata such as timestamps and sender/recipient hashes, so the service can deliver conversations. <br/>
          <strong>Basic technical data</strong> (timestamps, error logs) needed to operate the service.
        </Section>

        <Section title="2. What we don't collect">
          We don't collect your address book in bulk, your location, your contacts' names, or any social-graph data beyond the specific numbers you choose to add one at a time. We also do not store raw added phone numbers in our database.
        </Section>

        <Section title="3. How hashing works">
          When you add a phone number, our server combines it with a secret key (the "pepper"), runs SHA-256, and stores only the resulting hex digest. Without the pepper — which is held only as a runtime secret — no one (including us) can reverse a hash back to a phone number. This means a database leak alone would not reveal who anyone has added.
        </Section>

        <Section title="4. How matches work">
          A match is created when the hash of a number you added equals the hash of the account holder's own phone number, AND they have done the same with yours. The matches view returns only opaque hashes; your device maps those hashes back to readable numbers using the local list of phones you yourself uploaded. We never reveal another user's raw number to you.
        </Section>

        <Section title="5. Messaging">
          Sphere supports lightweight messaging in the form of short emoji-only messages between mutual matches. Those messages are stored so they can be delivered in real time and shown in your thread history. Message records include message content, timestamps, and hashed routing information; they do not expose another user's raw phone number.
        </Section>

        <Section title="6. Who can see your data">
          Other users can never read your adds or your matches — every row is protected by per-user row-level security in the database. Sphere staff have administrative database access for operational reasons but cannot read who you've added because contact data is stored only as peppered hashes.
        </Section>

        <Section title="7. Service providers">
          We use a backend platform (Supabase, hosted on infrastructure operated by them and their cloud provider) to store account and hashed-contact data, and an SMS provider to deliver login codes. These providers process data on our behalf under their own privacy commitments.
        </Section>

        <Section title="8. Security safeguards">
          Lightweight messages and hashed contact data are encrypted in transit using HTTPS/TLS and protected at rest by the security controls of our hosting providers and database systems. Internally, access is limited to authorized personnel who need it for operating, securing, or supporting Sphere, and hashed contact data is designed so raw added phone numbers are not available from database records.
        </Section>

        <Section title="9. Hosting and international transfers">
          Sphere is hosted on infrastructure operated by our backend and communications service providers. Depending on where you use the app and where those providers maintain systems or support personnel, your data may be processed or transferred internationally. When that happens, we rely on provider safeguards and contractual protections intended to protect personal data during those transfers.
        </Section>

        <Section title="10. Retention and deletion">
          We keep your account, hashed adds, and lightweight message history for as long as your account exists, unless a shorter retention period is required by law or operational necessity. You can delete your account at any time from the profile screen; when you tap delete, we remove your account record, the hashed contacts you added, and your lightweight emoji message history from our active systems. Encrypted backups that may still contain that data automatically expire and roll off within 30 days of deletion.
        </Section>

        <Section title="11. Children">
          Sphere is not intended for users under 17, and we do not knowingly collect data from children.
        </Section>

        <Section title="12. Your rights">
          Depending on where you live (e.g., GDPR / CCPA jurisdictions), you may have rights to access, correct, port, or delete your personal data. Email <a className="underline" href="mailto:privacy@mysphere.love">privacy@mysphere.love</a> and we'll respond within 30 days.
        </Section>

        <Section title="13. Contact permissions">
          If you choose to use contact-related features, Sphere uses the phone numbers you explicitly enter or choose to import to help identify mutual matches. Contact names stay on your device unless you separately choose to share them; matching is based on hashed phone numbers, not raw contact records stored in our database.
        </Section>

        <Section title="14. Changes">
          If we materially change this policy we'll notify you in the app before the changes take effect.
        </Section>

        <Section title="15. Contact">
          Questions or requests? Email <a className="underline" href="mailto:privacy@mysphere.love">privacy@mysphere.love</a>.
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
