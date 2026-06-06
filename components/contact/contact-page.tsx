'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Mail, MapPin, Phone } from 'lucide-react';

export function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('contacts').insert({
      name: form.name,
      email: form.email,
      subject: form.subject,
      message: form.message,
    });

    setLoading(false);
    if (error) {
      toast.error('Failed to send message');
    } else {
      toast.success('Message sent! We will get back to you soon.');
      setForm({ name: '', email: '', subject: '', message: '' });
    }
  }

  return (
    <div className="pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>
            Get in Touch
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Have questions about our psychology resources or book recommendations? We'd love to hear from you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {[
            { icon: Mail, label: 'Email', value: 'contact@mindscape.dev' },
            { icon: Phone, label: 'Phone', value: '+1 (555) 000-0000' },
            { icon: MapPin, label: 'Location', value: 'Online Community' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-card border rounded-xl p-6 text-center" style={{ borderColor: 'hsl(var(--border))' }}>
              <Icon className="w-8 h-8 text-accent mx-auto mb-3" />
              <h3 className="font-semibold mb-1">{label}</h3>
              <p style={{ color: 'hsl(var(--muted-foreground))' }}>{value}</p>
            </div>
          ))}
        </div>

        <div className="bg-card border rounded-2xl p-8 max-w-2xl mx-auto" style={{ borderColor: 'hsl(var(--border))' }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">Name *</label>
              <Input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email *</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="your@email.com"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Subject</label>
              <Input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="How can we help?"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Message *</label>
              <textarea
                rows={6}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Tell us more..."
                required
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                style={{ borderColor: 'hsl(var(--border))' }}
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-accent/90 text-white"
            >
              {loading ? 'Sending...' : 'Send Message'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
