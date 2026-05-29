'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Mail, MapPin, Clock, Send, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.from('contacts').insert(form);
    setSubmitting(false);
    if (error) { toast.error('Failed to send message. Please try again.'); } else {
      setSent(true);
      setForm({ name: '', email: '', subject: '', message: '' });
    }
  }

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-accent text-sm font-medium uppercase tracking-widest mb-3">Contact</p>
          <h1 className="text-4xl sm:text-5xl font-bold mb-5" style={{ fontFamily: 'var(--font-playfair)' }}>Get in Touch</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">Questions, collaborations, or just want to say hello? I read every message personally.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          <div className="lg:col-span-2 space-y-8">
            {[
              { icon: Mail, title: 'Email', content: 'hello@mindscapepsychology.com', sub: 'Response within 48 hours' },
              { icon: MapPin, title: 'Location', content: 'Stockholm, Sweden', sub: 'Available for online consultations worldwide' },
              { icon: Clock, title: 'Office Hours', content: 'Mon – Fri, 9am – 5pm CET', sub: 'Closed on weekends and holidays' },
            ].map(({ icon: Icon, title, content, sub }) => (
              <div key={title} className="flex gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold mb-0.5">{title}</h3>
                  <p className="text-foreground">{content}</p>
                  <p className="text-muted-foreground text-sm">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-3">
            {sent ? (
              <div className="bg-card border border-border rounded-2xl p-12 text-center">
                <CheckCircle className="w-16 h-16 text-accent mx-auto mb-5" />
                <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: 'var(--font-playfair)' }}>Message Sent!</h2>
                <p className="text-muted-foreground mb-6">Thank you for reaching out. I will get back to you within 48 hours.</p>
                <Button onClick={() => setSent(false)} variant="outline">Send Another Message</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-8 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium mb-2">Full Name *</label>
                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full h-11 px-4 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/50" placeholder="Dr. Jane Smith" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email Address *</label>
                    <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full h-11 px-4 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/50" placeholder="jane@example.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Subject</label>
                  <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full h-11 px-4 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/50" placeholder="Collaboration inquiry" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Message *</label>
                  <textarea required rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none" placeholder="Your message..." />
                </div>
                <Button type="submit" disabled={submitting} className="bg-accent hover:bg-accent/90 text-white w-full h-12 gap-2">
                  <Send className="w-4 h-4" />{submitting ? 'Sending...' : 'Send Message'}
                </Button>
                <p className="text-muted-foreground text-xs text-center">By submitting, you agree to our <a href="/privacy" className="text-accent hover:underline">Privacy Policy</a>.</p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
