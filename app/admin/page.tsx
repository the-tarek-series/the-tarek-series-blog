'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAdminAuth } from '@/components/admin/admin-guard';
import Link from 'next/link';
import { FileText, BookOpen, Mail, Users, Plus, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Stats { posts: number; books: number; contacts: number; subscribers: number; orders: number; }

export default function AdminPage() {
  const { userEmail, signOut } = useAdminAuth();
  const [stats, setStats] = useState<Stats>({ posts: 0, books: 0, contacts: 0, subscribers: 0, orders: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [
        { count: posts },
        { count: books },
        { count: contacts },
        { count: subscribers },
        { count: orders },
      ] = await Promise.all([
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('books').select('*', { count: 'exact', head: true }),
        supabase.from('contacts').select('*', { count: 'exact', head: true }),
        supabase.from('newsletter_subscribers').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
      ]);
      setStats({ posts: posts || 0, books: books || 0, contacts: contacts || 0, subscribers: subscribers || 0, orders: orders || 0 });
      setLoading(false);
    }
    load();
  }, []);

  const cards = [
    { title: 'Total Posts', value: stats.posts, icon: FileText, href: '/admin/posts', color: 'bg-blue-50 text-blue-600' },
    { title: 'Books', value: stats.books, icon: BookOpen, href: '/admin/books', color: 'bg-green-50 text-green-600' },
    { title: 'Messages', value: stats.contacts, icon: Mail, href: '/admin/contacts', color: 'bg-rose-50 text-rose-600' },
    { title: 'Subscribers', value: stats.subscribers, icon: Users, href: '/admin/users', color: 'bg-amber-50 text-amber-600' },
    { title: 'Orders', value: stats.orders, icon: ShoppingBag, href: '/admin/orders', color: 'bg-pink-50 text-pink-600' },
  ];

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-playfair)' }}>Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your MindScape content</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{userEmail}</span>
            <Button onClick={signOut} variant="outline" size="sm">Sign Out</Button>
            <Link href="/admin/posts/new">
              <Button className="bg-accent hover:bg-accent/90 text-white gap-2"><Plus className="w-4 h-4" /> New Post</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-10">
          {cards.map(({ title, value, icon: Icon, href, color }) => (
            <Link key={title} href={href} className="group card-hover block">
              <div className="bg-card border border-border rounded-xl p-6">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color} mb-4`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-3xl font-bold mb-1">{loading ? '-' : value}</div>
                <div className="font-medium text-sm">{title}</div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Manage Posts', desc: 'Create, edit, publish', href: '/admin/posts', icon: FileText },
            { label: 'Manage Books', desc: 'Add, edit bookstore items', href: '/admin/books', icon: BookOpen },
            { label: 'View Messages', desc: 'Contact form submissions', href: '/admin/contacts', icon: Mail },
            { label: 'Subscribers', desc: 'Newsletter sign-ups', href: '/admin/users', icon: Users },
            { label: 'Orders', desc: 'bKash payment tracking', href: '/admin/orders', icon: ShoppingBag },
          ].map(({ label, desc, href, icon: Icon }) => (
            <Link key={label} href={href} className="group card-hover block">
              <div className="bg-card border border-border rounded-xl p-5 h-full">
                <Icon className="w-5 h-5 text-accent mb-3" />
                <h3 className="font-semibold mb-1 group-hover:text-accent transition-colors">{label}</h3>
                <p className="text-muted-foreground text-sm">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
