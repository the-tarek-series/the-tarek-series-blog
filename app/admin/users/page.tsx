'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Users, Mail } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface Subscriber { id: string; email: string; subscribed: boolean; created_at: string; }

export default function AdminUsersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('newsletter_subscribers').select('*').order('created_at', { ascending: false });
      if (data) setSubscribers(data);
      setLoading(false);
    }
    load();
  }, []);

  const active = subscribers.filter((s) => s.subscribed).length;

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/admin" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-2xl font-bold">Newsletter Subscribers</h1>
            <p className="text-muted-foreground text-sm">{active} active of {subscribers.length} total</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="bg-card border border-border rounded-xl p-5 text-center">
            <Users className="w-6 h-6 text-accent mx-auto mb-2" />
            <div className="text-2xl font-bold">{subscribers.length}</div>
            <div className="text-muted-foreground text-sm">Total Subscribers</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5 text-center">
            <Mail className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{active}</div>
            <div className="text-muted-foreground text-sm">Active</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5 text-center">
            <Mail className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <div className="text-2xl font-bold">{subscribers.length - active}</div>
            <div className="text-muted-foreground text-sm">Unsubscribed</div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Joined</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading
                ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={3} className="px-5 py-4"><div className="h-4 bg-muted animate-pulse rounded" /></td></tr>)
                : subscribers.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-4 text-sm">{s.email}</td>
                      <td className="px-5 py-4 text-sm text-muted-foreground hidden sm:table-cell">{format(new Date(s.created_at), 'MMM d, yyyy')}</td>
                      <td className="px-5 py-4">
                        <Badge className={s.subscribed ? 'bg-green-100 text-green-700 border-0' : 'bg-muted text-muted-foreground border-0'}>
                          {s.subscribed ? 'Active' : 'Unsubscribed'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
