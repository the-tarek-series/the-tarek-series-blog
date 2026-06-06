'use client';

import { useEffect, useState } from 'react';
import { supabase, type Contact } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, CircleCheck as CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Contact | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('contacts').select('*').order('created_at', { ascending: false });
    if (data) setContacts(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function markRead(id: string) {
    await supabase.from('contacts').update({ read: true }).eq('id', id);
    setContacts((prev) => prev.map((c) => c.id === id ? { ...c, read: true } : c));
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, read: true } : null);
    toast.success('Marked as read');
  }

  const unread = contacts.filter((c) => !c.read).length;

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/admin" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-2xl font-bold">Contact Messages</h1>
            <p className="text-muted-foreground text-sm">{unread} unread of {contacts.length} total</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-2">
            {loading ? [...Array(5)].map((_, i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />) : contacts.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">No messages yet.</div>
            ) : contacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => setSelected(contact)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selected?.id === contact.id ? 'border-accent bg-accent/5' : 'border-border bg-card hover:border-accent/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="font-medium text-sm line-clamp-1">{contact.name}</div>
                  {!contact.read && <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-1.5" />}
                </div>
                <div className="text-muted-foreground text-xs mb-1">{contact.email}</div>
                <div className="text-muted-foreground text-xs line-clamp-1">{contact.subject || contact.message}</div>
                <div className="text-muted-foreground text-xs mt-1.5">{format(new Date(contact.created_at), 'MMM d, h:mm a')}</div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-3">
            {selected ? (
              <div className="bg-card border border-border rounded-2xl p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold">{selected.name}</h2>
                    <a href={`mailto:${selected.email}`} className="text-accent text-sm hover:underline">{selected.email}</a>
                  </div>
                  {!selected.read && (
                    <button onClick={() => markRead(selected.id)} className="flex items-center gap-1.5 text-sm text-accent hover:underline">
                      <CheckCircle className="w-4 h-4" /> Mark Read
                    </button>
                  )}
                </div>
                {selected.subject && (
                  <div className="mb-4"><span className="text-muted-foreground text-sm">Subject: </span><span className="font-medium text-sm">{selected.subject}</span></div>
                )}
                <div className="bg-muted/50 rounded-xl p-5 mb-5 text-sm leading-relaxed whitespace-pre-wrap">{selected.message}</div>
                <div className="text-muted-foreground text-xs">Received: {format(new Date(selected.created_at), 'MMMM d, yyyy at h:mm a')}</div>
                <div className="mt-5 pt-5 border-t border-border">
                  <a href={`mailto:${selected.email}?subject=Re: ${selected.subject || 'Your message'}`} className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors">
                    <Mail className="w-4 h-4" /> Reply via Email
                  </a>
                </div>
              </div>
            ) : (
              <div className="bg-muted/30 border border-border rounded-2xl h-64 flex items-center justify-center text-muted-foreground">Select a message</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
