import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Privacy Policy', description: 'Privacy policy for MindScape Psychology blog.' };

export default function PrivacyPage() {
  return (
    <div className="pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="mb-12">
          <p className="text-accent text-sm font-medium uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: January 1, 2025</p>
        </div>
        <div className="prose-custom space-y-8">
          <Section title="1. Information We Collect">
            <p>We collect information you provide directly, including:</p>
            <ul>
              <li><strong>Contact information:</strong> Name, email address when you use our contact form or subscribe to our newsletter.</li>
              <li><strong>Account data:</strong> Email and password when you register for an account.</li>
              <li><strong>Purchase data:</strong> Billing information processed securely when you purchase books via bKash.</li>
              <li><strong>Usage data:</strong> Pages visited, articles read, and games played (anonymized and aggregated).</li>
            </ul>
          </Section>
          <Section title="2. How We Use Your Information">
            <p>We use collected information to:</p>
            <ul>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Send newsletters you have subscribed to (unsubscribe at any time)</li>
              <li>Process purchases and deliver order confirmations</li>
              <li>Improve our content based on aggregated usage analytics</li>
            </ul>
          </Section>
          <Section title="3. Data Storage & Security">
            <p>Your data is stored securely using Supabase (PostgreSQL) with row-level security policies. We implement industry-standard encryption for data in transit (TLS) and at rest. Payment information is processed directly by bKash and not stored on our servers.</p>
          </Section>
          <Section title="4. Cookies & Analytics">
            <p>We use minimal, privacy-respecting analytics. We may display Google AdSense advertisements, which uses cookies for relevant ads. You may opt out via your browser settings.</p>
          </Section>
          <Section title="5. Your Rights (GDPR)">
            <p>If you are in the European Economic Area, you have the right to access, correct, or delete your personal data, object to processing, and lodge complaints with a supervisory authority.</p>
          </Section>
          <Section title="6. Third-Party Services">
            <p>We integrate with: Supabase (database), bKash (payments), Google AdSense (ads), Vercel (hosting).</p>
          </Section>
          <Section title="7. Contact Us">
            <p>For privacy-related questions, contact privacy@mindscapepsychology.com</p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><h2>{title}</h2>{children}</div>;
}
