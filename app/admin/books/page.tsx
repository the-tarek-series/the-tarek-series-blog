'use client';

import { useEffect, useState } from 'react';
import { supabase, type Book } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, ArrowLeft, X, Save } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const EMPTY_BOOK = {
  title: '', author: '', description: '', cover_image: '', price: 0, original_price: 0,
  isbn: '', pages: 0, category: 'psychology', in_stock: true, featured: false,
};

export default function AdminBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Book> | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('books').select('*').order('created_at', { ascending: false });
    if (data) setBooks(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing?.title || !editing?.author) { toast.error('Title and author required'); return; }
    setSaving(true);
    let error;
    if (editing.id) {
      ({ error } = await supabase.from('books').update(editing).eq('id', editing.id));
    } else {
      ({ error } = await supabase.from('books').insert(editing));
    }
    setSaving(false);
    if (error) { toast.error(error.message); } else { toast.success('Book saved'); setEditing(null); load(); }
  }

  async function del(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    await supabase.from('books').delete().eq('id', id);
    toast.success('Book deleted');
    load();
  }

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="text-2xl font-bold">Manage Books</h1>
          </div>
          <Button onClick={() => setEditing(EMPTY_BOOK)} className="bg-accent hover:bg-accent/90 text-white gap-2">
            <Plus className="w-4 h-4" /> Add Book
          </Button>
        </div>

        {editing && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">{editing.id ? 'Edit Book' : 'Add Book'}</h2>
                <button onClick={() => setEditing(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              <div className="space-y-4">
                {[
                  { key: 'title', label: 'Title', placeholder: 'Book title' },
                  { key: 'author', label: 'Author', placeholder: 'Author name' },
                  { key: 'cover_image', label: 'Cover Image URL', placeholder: 'https://...' },
                  { key: 'isbn', label: 'ISBN', placeholder: '978-...' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium mb-1">{label}</label>
                    <input
                      value={(editing as any)[key] || ''}
                      onChange={(e) => setEditing({ ...editing, [key]: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                      placeholder={placeholder}
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea rows={3} value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Price ($)</label>
                    <input type="number" step="0.01" value={editing.price || 0} onChange={(e) => setEditing({ ...editing, price: parseFloat(e.target.value) })} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Original Price ($)</label>
                    <input type="number" step="0.01" value={editing.original_price || 0} onChange={(e) => setEditing({ ...editing, original_price: parseFloat(e.target.value) })} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none" />
                  </div>
                </div>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editing.in_stock || false} onChange={(e) => setEditing({ ...editing, in_stock: e.target.checked })} className="accent-accent" />
                    <span className="text-sm">In Stock</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editing.featured || false} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} className="accent-accent" />
                    <span className="text-sm">Featured</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button onClick={() => setEditing(null)} variant="outline" className="flex-1">Cancel</Button>
                <Button onClick={save} disabled={saving} className="flex-1 bg-accent hover:bg-accent/90 text-white gap-2">
                  <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Book'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}</div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Book</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Price</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {books.map((book) => (
                  <tr key={book.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {book.cover_image && <img src={book.cover_image} alt="" className="w-10 h-12 object-cover rounded" />}
                        <div>
                          <div className="font-medium text-sm">{book.title}</div>
                          <div className="text-muted-foreground text-xs">{book.author}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell"><span className="font-semibold">${book.price}</span></td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <div className="flex gap-2">
                        <Badge className={book.in_stock ? 'bg-green-100 text-green-700 border-0' : 'bg-red-100 text-red-700 border-0'}>
                          {book.in_stock ? 'In Stock' : 'Out of Stock'}
                        </Badge>
                        {book.featured && <Badge className="bg-accent/10 text-accent border-0">Featured</Badge>}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setEditing(book)} className="p-1.5 text-muted-foreground hover:text-accent transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => del(book.id, book.title)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
