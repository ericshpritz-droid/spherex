import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Sphere" },
      { name: "description", content: "The terms that govern your use of Sphere." },
      { property: "og:title", content: "Terms of Service — Sphere" },
      { property: "og:description", content: "The terms that govern your use of Sphere." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-dvh bg-ink text-white">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <Link to="/" className="text-fg-55 text-[14px]">← Back</Link>
        <h1 className="mt-4 text-3xl font-bold tracking-sora-display">Terms of Service</h1>
        <p className="mt-1 text-fg-55 text-[13px]">Last updated: April 18, 2026</p>

        <Section title="1. Who can use Sphere">
          You must be at least 17 years old to use Sphere. By creating an account you represent that you meet that age requirement and that you have the legal right to enter into these Terms.
        </Section>
        <Section title="2. Your account">
          You sign in with your phone number using a one-time code. You're responsible for keeping access to that number secure. We may suspend or terminate accounts that we reasonably believe are being used to harass other users, evade bans, or violate these Terms.
        </Section>
        <Section title="3. Adding contacts">
          When you add a phone number, we hash it on our servers using a secret key before storing it. You agree that you have the right to upload any phone number you add, and that you will not use Sphere to harass, dox, or stalk anyone. A "match" is created only when both parties have independently added each other.
        </Section>
        <Section title="4. Acceptable use">
          You agree not to: (a) attempt to reverse-engineer the hashing or de-anonymize other users; (b) automate adds (e.g., uploading entire phone-number ranges) to enumerate who is on Sphere; (c) use Sphere for unlawful, harmful, or commercial bulk-messaging purposes; (d) attempt to access another user's account.
        </Section>
        <Section title="5. Content and license">
          You retain ownership of the data you submit. You grant Sphere a limited license to process that data solely to provide the service (matching, account management, abuse prevention).
        </Section>
        <Section title="6. Termination">
          You can delete your account at any time from the profile screen. On deletion we remove your account record and all hashed adds associated with it. We may terminate accounts that violate these Terms.
        </Section>
        <Section title="7. Disclaimers">
          Sphere is provided "as is" without warranties of any kind. We do not guarantee that any particular person is on Sphere, that matches will lead to any outcome, or that the service will be uninterrupted.
        </Section>
        <Section title="8. Limitation of liability">
          To the maximum extent permitted by law, Sphere and its operators are not liable for indirect, incidental, special, consequential, or punitive damages, or any loss of data or goodwill, arising from your use of the service.
        </Section>
        <Section title="9. Changes">
          We may update these Terms. If we make material changes we'll notify you in the app. Continued use after changes take effect means you accept the updated Terms.
        </Section>
        <Section title="10. Contact">
          Questions? Email <a className="underline" href="mailto:legal@mysphere.love">legal@mysphere.love</a>.
        </Section>

        <div className="mt-10 text-fg-45 text-[13px]">
          See also our <Link to="/privacy" className="underline">Privacy Policy</Link>.
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-[18px] font-semibold">{title}</h2>
      <p className="mt-2 text-[15px] text-fg-70" style={{ lineHeight: 1.6 }}>{children}</p>
    </section>
  );
}
