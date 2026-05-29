import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Terms of Service', description: 'Terms of service for MindScape Psychology.' };

export default function TermsPage() {
  return (
    <div className="pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="mb-12">
          <p className="text-accent text-sm font-medium uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: January 1, 2025</p>
        </div>
        <div className="prose-custom space-y-8">
          <Section title="1. Acceptance of Terms">
            <p>By accessing or using MindScape Psychology, you agree to be bound by these Terms of Service.</p>
          </Section>
          <Section title="2. Content & Intellectual Property">
            <p>All articles, games, graphics, and other content published on this site are the intellectual property of MindScape Psychology and Dr. Elena Hartmann unless otherwise stated. You may not reproduce, distribute, or create derivative works without written permission.</p>
          </Section>
          <Section title="3. Not Medical Advice">
            <p><strong>Important:</strong> Content on MindScape Psychology is for educational and informational purposes only. Nothing on this site constitutes professional psychological, psychiatric, or medical advice. Always seek the advice of a qualified mental health professional.</p>
          </Section>
          <Section title="4. Purchases & Refunds">
            <p>Books purchased through our store are final sale unless the product is demonstrably defective. Refund requests must be submitted within 14 days of purchase. bKash payments are processed through their secure gateway and subject to their terms.</p>
          </Section>
          <Section title="5. Disclaimer of Warranties">
            <p>The Site is provided &quot;as is&quot; without warranties of any kind, express or implied. We do not guarantee uninterrupted access or accuracy of content.</p>
          </Section>
          <Section title="6. Limitation of Liability">
            <p>MindScape Psychology shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Site.</p>
          </Section>
          <Section title="7. Governing Law">
            <p>These Terms are governed by the laws of Sweden. Disputes shall be resolved in Swedish courts.</p>
          </Section>
          <Section title="8. Contact">
            <p>Questions about these Terms should be directed to legal@mindscapepsychology.com</p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><h2>{title}</h2>{children}</div>;
}
