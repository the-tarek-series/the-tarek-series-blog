import Link from 'next/link';
import { Brain, Twitter, Instagram, Linkedin, Mail } from 'lucide-react';

const footerLinks = {
  Explore: [
    { label: 'Blog', href: '/blog' },
    { label: 'Memory Games', href: '/games' },
    { label: 'Bookstore', href: '/bookstore' },
    { label: 'Search', href: '/search' },
  ],
  Company: [
    { label: 'About Me', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
  Topics: [
    { label: 'CBT & Therapy', href: '/blog?category=therapy' },
    { label: 'Mindfulness', href: '/blog?category=mindfulness' },
    { label: 'Relationships', href: '/blog?category=relationships' },
    { label: 'Neuroscience', href: '/blog?category=neuroscience' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-foreground text-background mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 group mb-5">
              <div className="w-9 h-9 bg-accent rounded-full flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-xl text-background">Mind<span className="text-accent">Scape</span></span>
            </Link>
            <p className="text-background/60 text-sm leading-relaxed max-w-xs mb-6">
              Evidence-based psychology insights to help you understand the mind, build resilience, and live more intentionally.
            </p>
            <div className="flex items-center gap-3">
              {[
                { icon: Twitter, label: 'Twitter', href: '#' },
                { icon: Instagram, label: 'Instagram', href: '#' },
                { icon: Linkedin, label: 'LinkedIn', href: '#' },
                { icon: Mail, label: 'Email', href: '/contact' },
              ].map(({ icon: Icon, label, href }) => (
                <Link key={label} href={href} aria-label={label} className="w-9 h-9 rounded-full bg-background/10 flex items-center justify-center hover:bg-accent/80 transition-colors">
                  <Icon className="w-4 h-4 text-background/80" />
                </Link>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-background text-sm font-semibold uppercase tracking-widest mb-5 opacity-50">{section}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-background/60 text-sm hover:text-background transition-colors">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-background/10 mt-14 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-background/40 text-sm">&copy; {new Date().getFullYear()} MindScape Psychology. All rights reserved.</p>
          <p className="text-background/30 text-xs">Built with care for mental wellness</p>
        </div>
      </div>
    </footer>
  );
}
